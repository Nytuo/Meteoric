use std::sync::{Arc, Mutex};
use std::time::{Duration, Instant};

use reqwest::Client;
use serde::{Deserialize, Serialize};

struct TokenCache {
    token: Option<String>,
    acquired_at: Option<Instant>,
}

impl TokenCache {
    fn new() -> Self {
        Self {
            token: None,
            acquired_at: None,
        }
    }

    fn is_valid(&self) -> bool {
        match (&self.token, self.acquired_at) {
            (Some(_), Some(t)) => t.elapsed() < Duration::from_secs(23 * 3600),
            _ => false,
        }
    }
}

static TOKEN_CACHE: once_cell::sync::Lazy<Arc<Mutex<TokenCache>>> =
    once_cell::sync::Lazy::new(|| Arc::new(Mutex::new(TokenCache::new())));

#[derive(Serialize)]
struct LoginRequest {
    email: String,
    password: String,
}

#[derive(Serialize)]
struct DeviceLoginRequest {
    device_token: String,
}

#[derive(Deserialize)]
struct LoginResponse {
    token: String,
}

fn keyring_entry() -> Result<keyring::Entry, String> {
    keyring::Entry::new("Meteoric", "confero_device_token")
        .map_err(|e| format!("Failed to access OS credential store: {}", e))
}

pub fn is_linked() -> bool {
    keyring_entry()
        .and_then(|e| e.get_password().map_err(|e| e.to_string()))
        .is_ok()
}

pub async fn link_account(email: String, password: String) -> Result<(), String> {
    let client = build_client()?;
    let url = base_url()?;

    let resp = client
        .post(format!("{}/api/auth/login", url))
        .json(&LoginRequest { email, password })
        .send()
        .await
        .map_err(|e| format!("Login request failed: {}", e))?;

    if !resp.status().is_success() {
        let status = resp.status();
        let body = resp.text().await.unwrap_or_default();
        return Err(format!("Login failed ({}): {}", status, body));
    }

    let session: LoginResponse = resp
        .json()
        .await
        .map_err(|e| format!("Failed to parse login response: {}", e))?;

    let device_resp = client
        .post(format!("{}/api/auth/device-token", url))
        .bearer_auth(&session.token)
        .send()
        .await
        .map_err(|e| format!("Device token request failed: {}", e))?;

    if !device_resp.status().is_success() {
        let status = device_resp.status();
        let body = device_resp.text().await.unwrap_or_default();
        return Err(format!("Device token request failed ({}): {}", status, body));
    }

    let device: LoginResponse = device_resp
        .json()
        .await
        .map_err(|e| format!("Failed to parse device token response: {}", e))?;

    keyring_entry()?
        .set_password(&device.token)
        .map_err(|e| format!("Failed to store device token: {}", e))?;

    let mut cache = TOKEN_CACHE.lock().unwrap();
    *cache = TokenCache::new();

    Ok(())
}

pub async fn unlink_account() -> Result<(), String> {
    if let Ok(token) = get_token(&build_client()?, &base_url()?).await {
        let client = build_client()?;
        let url = base_url()?;
        let _ = client
            .post(format!("{}/api/auth/device-token/revoke", url))
            .bearer_auth(&token)
            .send()
            .await;
    }

    if let Ok(entry) = keyring_entry() {
        let _ = entry.delete_credential();
    }

    let mut cache = TOKEN_CACHE.lock().unwrap();
    *cache = TokenCache::new();

    Ok(())
}

async fn get_token(client: &Client, base_url: &str) -> Result<String, String> {
    {
        let cache = TOKEN_CACHE.lock().unwrap();
        if cache.is_valid() {
            return Ok(cache.token.clone().unwrap());
        }
    }

    let device_token = keyring_entry()?
        .get_password()
        .map_err(|_| "Not linked to Confero. Please link your account first.".to_string())?;

    let resp = client
        .post(format!("{}/api/auth/device-login", base_url))
        .json(&DeviceLoginRequest { device_token })
        .send()
        .await
        .map_err(|e| format!("Device login request failed: {}", e))?;

    if !resp.status().is_success() {
        let status = resp.status();
        let body = resp.text().await.unwrap_or_default();
        return Err(format!("Device login failed ({}): {}", status, body));
    }

    let login_resp: LoginResponse = resp
        .json()
        .await
        .map_err(|e| format!("Failed to parse device login response: {}", e))?;

    let token = login_resp.token.clone();

    let mut cache = TOKEN_CACHE.lock().unwrap();
    cache.token = Some(login_resp.token);
    cache.acquired_at = Some(Instant::now());

    Ok(token)
}

fn base_url() -> Result<String, String> {
    Ok(std::env::var("CONFERO_URL")
        .ok()
        .filter(|s| !s.trim().is_empty())
        .unwrap_or_else(|| "https://confero.nytuo.fr".to_string()))
}

fn build_client() -> Result<Client, String> {
    let mut headers = reqwest::header::HeaderMap::new();
    if let Ok(secret) = std::env::var("CONFERO_APP_SECRET") {
        if !secret.is_empty() {
            if let Ok(val) = reqwest::header::HeaderValue::from_str(&secret) {
                headers.insert("x-app-secret", val);
            }
        }
    }
    Client::builder()
        .timeout(Duration::from_secs(600))
        .default_headers(headers)
        .build()
        .map_err(|e| format!("Failed to build HTTP client: {}", e))
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct SyncGameItem {
    pub source_id: String,
    pub game_importer_id: String,
    pub importer_id: String,
    pub igdb_id: String,
    pub name: String,
    pub sort_name: String,
    pub rating: String,
    pub platforms: String,
    pub description: String,
    pub critic_score: String,
    pub genres: String,
    pub styles: String,
    pub release_date: String,
    pub developers: String,
    pub editors: String,
    pub tags: String,
    pub status: String,
    pub trophies: String,
    pub trophies_unlocked: String,
    pub hidden: String,

    #[serde(default)]
    pub favorite: bool,

    pub updated_at: String,
}

#[derive(Serialize)]
struct SyncGamesPayload {
    games: Vec<SyncGameItem>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct SyncStatItem {
    pub source_id: String,
    pub game_source_id: String,
    pub time_played: String,
    pub date_of_play: String,
}

#[derive(Serialize)]
struct SyncStatsPayload {
    stats: Vec<SyncStatItem>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct SyncTrophyItem {
    pub source_id: String,
    pub game_source_id: String,
    pub name: String,
    pub description: String,
    pub visible: String,
    pub date_of_unlock: String,
    pub importer_id: String,
    pub image_url_locked: String,
    pub image_url_unlocked: String,
    pub unlocked: String,
}

#[derive(Serialize)]
struct SyncTrophiesPayload {
    trophies: Vec<SyncTrophyItem>,
}

#[derive(Deserialize, Debug, Clone, Default)]
pub struct ConferoLibraryItem {
    #[serde(default)]
    pub source_id: String,

    #[serde(default)]
    pub igdb_id: String,

    #[serde(default)]
    pub title: String,
    #[serde(default)]
    pub description: String,
    #[serde(default)]
    pub genres: String,
    #[serde(default)]
    pub developers: String,
    #[serde(default)]
    pub platforms: String,

    #[serde(default)]
    pub release_date: String,

    #[serde(default)]
    pub status: String,

    #[serde(default)]
    pub rating: String,
    #[serde(default)]
    pub favorite: bool,

    #[serde(default = "default_hidden")]
    pub hidden: String,

    pub updated_at: String,
}

fn default_hidden() -> String {
    "false".to_string()
}

pub fn map_confero_status(status: &str) -> &'static str {
    match status.trim() {
        "doing" => "In progress",
        "done" => "Completed",
        "abandoned" => "Dropped",
        "platine" => "Platinum",
        _ => "Not started",
    }
}

#[derive(Serialize)]
struct DeletePayload {
    source_id: String,
}

pub async fn push_games(games: Vec<SyncGameItem>) -> Result<(), String> {
    let client = build_client()?;
    let url = base_url()?;
    let token = get_token(&client, &url).await?;

    let resp = client
        .post(format!("{}/api/sync/meteoric/games", url))
        .bearer_auth(&token)
        .json(&SyncGamesPayload { games })
        .send()
        .await
        .map_err(|e| format!("push_games request failed: {}", e))?;

    if !resp.status().is_success() {
        let status = resp.status();
        let body = resp.text().await.unwrap_or_default();
        return Err(format!("push_games failed ({}): {}", status, body));
    }
    Ok(())
}

pub async fn push_stats(stats: Vec<SyncStatItem>) -> Result<(), String> {
    let client = build_client()?;
    let url = base_url()?;
    let token = get_token(&client, &url).await?;

    let resp = client
        .post(format!("{}/api/sync/meteoric/stats", url))
        .bearer_auth(&token)
        .json(&SyncStatsPayload { stats })
        .send()
        .await
        .map_err(|e| format!("push_stats request failed: {}", e))?;

    if !resp.status().is_success() {
        let status = resp.status();
        let body = resp.text().await.unwrap_or_default();
        return Err(format!("push_stats failed ({}): {}", status, body));
    }
    Ok(())
}

pub async fn push_trophies(trophies: Vec<SyncTrophyItem>) -> Result<(), String> {
    let client = build_client()?;
    let url = base_url()?;
    let token = get_token(&client, &url).await?;

    let resp = client
        .post(format!("{}/api/sync/meteoric/trophies", url))
        .bearer_auth(&token)
        .json(&SyncTrophiesPayload { trophies })
        .send()
        .await
        .map_err(|e| format!("push_trophies request failed: {}", e))?;

    if !resp.status().is_success() {
        let status = resp.status();
        let body = resp.text().await.unwrap_or_default();
        return Err(format!("push_trophies failed ({}): {}", status, body));
    }
    Ok(())
}

pub async fn pull_games(since: Option<String>) -> Result<Vec<serde_json::Value>, String> {
    let client = build_client()?;
    let url = base_url()?;
    let token = get_token(&client, &url).await?;

    let mut req = client.get(format!("{}/api/sync/meteoric/games", url));
    if let Some(s) = since {
        req = req.query(&[("since", s)]);
    }

    let resp = req
        .bearer_auth(&token)
        .send()
        .await
        .map_err(|e| format!("pull_games request failed: {}", e))?;

    if !resp.status().is_success() {
        let status = resp.status();
        let body = resp.text().await.unwrap_or_default();
        return Err(format!("pull_games failed ({}): {}", status, body));
    }

    let body: serde_json::Value = resp
        .json()
        .await
        .map_err(|e| format!("Failed to parse pull_games response: {}", e))?;

    Ok(body["games"].as_array().cloned().unwrap_or_default())
}

pub async fn pull_stats(since: Option<String>) -> Result<Vec<serde_json::Value>, String> {
    let client = build_client()?;
    let url = base_url()?;
    let token = get_token(&client, &url).await?;

    let mut req = client.get(format!("{}/api/sync/meteoric/stats", url));
    if let Some(s) = since {
        req = req.query(&[("since", s)]);
    }

    let resp = req
        .bearer_auth(&token)
        .send()
        .await
        .map_err(|e| format!("pull_stats request failed: {}", e))?;

    if !resp.status().is_success() {
        let status = resp.status();
        let body = resp.text().await.unwrap_or_default();
        return Err(format!("pull_stats failed ({}): {}", status, body));
    }

    let body: serde_json::Value = resp
        .json()
        .await
        .map_err(|e| format!("Failed to parse pull_stats response: {}", e))?;

    Ok(body["stats"].as_array().cloned().unwrap_or_default())
}

pub async fn pull_trophies(since: Option<String>) -> Result<Vec<serde_json::Value>, String> {
    let client = build_client()?;
    let url = base_url()?;
    let token = get_token(&client, &url).await?;

    let mut req = client.get(format!("{}/api/sync/meteoric/trophies", url));
    if let Some(s) = since {
        req = req.query(&[("since", s)]);
    }

    let resp = req
        .bearer_auth(&token)
        .send()
        .await
        .map_err(|e| format!("pull_trophies request failed: {}", e))?;

    if !resp.status().is_success() {
        let status = resp.status();
        let body = resp.text().await.unwrap_or_default();
        return Err(format!("pull_trophies failed ({}): {}", status, body));
    }

    let body: serde_json::Value = resp
        .json()
        .await
        .map_err(|e| format!("Failed to parse pull_trophies response: {}", e))?;

    Ok(body["trophies"].as_array().cloned().unwrap_or_default())
}

pub async fn pull_library(since: Option<String>) -> Result<Vec<ConferoLibraryItem>, String> {
    let client = build_client()?;
    let url = base_url()?;
    let token = get_token(&client, &url).await?;

    let mut req = client.get(format!("{}/api/sync/meteoric/library", url));
    if let Some(s) = since {
        req = req.query(&[("since", s)]);
    }

    let resp = req
        .bearer_auth(&token)
        .send()
        .await
        .map_err(|e| format!("pull_library request failed: {}", e))?;

    if !resp.status().is_success() {
        let status = resp.status();
        let body = resp.text().await.unwrap_or_default();
        return Err(format!("pull_library failed ({}): {}", status, body));
    }

    let body: serde_json::Value = resp
        .json()
        .await
        .map_err(|e| format!("Failed to parse pull_library response: {}", e))?;

    let items: Vec<ConferoLibraryItem> = body["games"]
        .as_array()
        .unwrap_or(&vec![])
        .iter()
        .filter_map(|v| serde_json::from_value(v.clone()).ok())
        .collect();

    Ok(items)
}

pub async fn delete_remote_game(source_id: String) -> Result<(), String> {
    let client = build_client()?;
    let url = base_url()?;
    let token = get_token(&client, &url).await?;

    let resp = client
        .post(format!("{}/api/sync/meteoric/games/delete", url))
        .bearer_auth(&token)
        .json(&DeletePayload { source_id })
        .send()
        .await
        .map_err(|e| format!("delete_remote_game request failed: {}", e))?;

    if !resp.status().is_success() {
        let status = resp.status();
        let body = resp.text().await.unwrap_or_default();
        return Err(format!("delete_remote_game failed ({}): {}", status, body));
    }
    Ok(())
}

pub async fn test_connection() -> Result<String, String> {
    let client = build_client()?;
    let url = base_url()?;
    let token = get_token(&client, &url).await?;

    let resp = client
        .get(format!("{}/api/auth/check-login", url))
        .bearer_auth(&token)
        .send()
        .await
        .map_err(|e| format!("Connection test failed: {}", e))?;

    if resp.status().is_success() {
        Ok("OK".to_string())
    } else {
        Err(format!("Server returned {}", resp.status()))
    }
}

fn is_recognized_store(importer_id: &str) -> bool {
    matches!(
        importer_id.trim().to_lowercase().as_str(),
        "steam" | "epic" | "gog" | "heroic" | "itch"
    )
}

pub fn has_resolvable_identity(igdb_id: &str, game_importer_id: &str, importer_id: &str) -> bool {
    !igdb_id.trim().is_empty() || (!game_importer_id.trim().is_empty() && is_recognized_store(importer_id))
}

pub fn should_push_local(updated_at: &str, confero_updated_at: Option<&str>) -> bool {
    let updated = chrono::DateTime::parse_from_rfc3339(updated_at).ok();
    match confero_updated_at.filter(|ts| !ts.is_empty()) {
        Some(ts) => {
            let confero = chrono::DateTime::parse_from_rfc3339(ts).ok();
            match (updated, confero) {
                (Some(u), Some(c)) => u > c,
                (Some(_), None) => true,
                _ => false,
            }
        }
        None => true,
    }
}

pub fn should_apply_remote(remote_updated_at: &str, local_confero_updated_at: Option<&str>) -> bool {
    let remote = chrono::DateTime::parse_from_rfc3339(remote_updated_at).ok();
    let local = local_confero_updated_at.and_then(|s| chrono::DateTime::parse_from_rfc3339(s).ok());
    match (remote, local) {
        (Some(r), Some(l)) => r > l,
        (Some(_), None) => true,
        _ => false,
    }
}

pub fn is_conflict(
    updated_at: &str,
    confero_updated_at: Option<&str>,
    remote_updated_at: &str,
) -> bool {
    should_push_local(updated_at, confero_updated_at)
        && should_apply_remote(remote_updated_at, confero_updated_at)
}

#[cfg(test)]
mod merge_tests {
    use super::*;

    #[test]
    fn should_push_local_when_never_synced() {
        assert!(should_push_local("2024-01-02T00:00:00Z", None));
        assert!(should_push_local("2024-01-02T00:00:00Z", Some("")));
    }

    #[test]
    fn should_push_local_when_edited_after_last_sync() {
        assert!(should_push_local(
            "2024-01-02T00:00:00Z",
            Some("2024-01-01T00:00:00Z")
        ));
    }

    #[test]
    fn should_not_push_local_when_not_edited_since_last_sync() {
        assert!(!should_push_local(
            "2024-01-01T00:00:00Z",
            Some("2024-01-02T00:00:00Z")
        ));
        assert!(!should_push_local(
            "2024-01-01T00:00:00Z",
            Some("2024-01-01T00:00:00Z")
        ));
    }

    #[test]
    fn should_not_push_local_on_unparsable_timestamps() {
        assert!(!should_push_local("not-a-date", Some("2024-01-01T00:00:00Z")));
    }

    #[test]
    fn should_apply_remote_when_never_synced() {
        assert!(should_apply_remote("2024-01-02T00:00:00Z", None));
    }

    #[test]
    fn should_apply_remote_when_newer_than_last_sync() {
        assert!(should_apply_remote(
            "2024-01-02T00:00:00Z",
            Some("2024-01-01T00:00:00Z")
        ));
    }

    #[test]
    fn should_not_apply_remote_when_not_newer() {
        assert!(!should_apply_remote(
            "2024-01-01T00:00:00Z",
            Some("2024-01-02T00:00:00Z")
        ));
        assert!(!should_apply_remote(
            "2024-01-01T00:00:00Z",
            Some("2024-01-01T00:00:00Z")
        ));
    }

    #[test]
    fn conflict_when_both_sides_changed_since_last_sync() {
        assert!(is_conflict(
            "2024-01-05T00:00:00Z",
            Some("2024-01-01T00:00:00Z"),
            "2024-01-06T00:00:00Z"
        ));
    }

    #[test]
    fn no_conflict_when_only_local_changed() {
        assert!(!is_conflict(
            "2024-01-05T00:00:00Z",
            Some("2024-01-01T00:00:00Z"),
            "2024-01-01T00:00:00Z"
        ));
    }

    #[test]
    fn no_conflict_when_only_remote_changed() {
        assert!(!is_conflict(
            "2024-01-01T00:00:00Z",
            Some("2024-01-01T00:00:00Z"),
            "2024-01-05T00:00:00Z"
        ));
    }

    #[test]
    fn no_conflict_on_first_sync_is_still_a_conflict_if_both_have_data() {
        assert!(is_conflict("2024-01-01T00:00:00Z", None, "2024-01-01T00:00:00Z"));
    }

    #[test]
    fn resolvable_with_igdb_id_only() {
        assert!(has_resolvable_identity("12345", "", ""));
    }

    #[test]
    fn resolvable_with_recognized_store_id() {
        assert!(has_resolvable_identity("", "76561200000000", "steam"));
        assert!(has_resolvable_identity("", "abc123", "Epic"));
    }

    #[test]
    fn not_resolvable_with_neither() {
        assert!(!has_resolvable_identity("", "", ""));
        assert!(!has_resolvable_identity("", "", "playnite"));
    }

    #[test]
    fn not_resolvable_with_unrecognized_store_and_no_igdb_id() {
        assert!(!has_resolvable_identity("", "some-id", "playnite"));
    }
}
