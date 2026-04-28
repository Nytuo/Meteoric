use std::collections::HashMap;
use std::fs;
use std::path::{Path, PathBuf};

use reqwest::header::{HeaderMap, HeaderValue, AUTHORIZATION};
use serde::{Deserialize, Serialize};

use super::{ensure_logged_in, get_account_id, EPIC, INSTALLED_GAMES};
use crate::send_message_to_frontend;

const CLOUD_SAVE_BASE: &str =
    "https://datastorage-public-service-liveegs.live.use1a.on.epicgames.com";

#[derive(Serialize, Deserialize, Debug, Clone, PartialEq)]
pub enum SaveGameStatus {
    NoSave,
    LocalNewer,
    RemoteNewer,
    SameAge,
    Conflict,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct CloudSaveInfo {
    pub app_name: String,
    pub local_save_path: Option<String>,
    pub remote_save_exists: bool,
    pub status: SaveGameStatus,
    pub local_timestamp: Option<String>,
    pub remote_timestamp: Option<String>,
}

pub async fn resolve_save_path(app_name: &str) -> Result<Option<PathBuf>, String> {
    let installed = {
        let games = INSTALLED_GAMES.lock().await;
        games.get(app_name).cloned()
    };

    let installed = match installed {
        Some(ig) => ig,
        None => return Err(format!("Game {} is not installed", app_name)),
    };

    let save_folder = if cfg!(target_os = "macos") {
        installed
            .cloud_save_folder_mac
            .clone()
            .or(installed.cloud_save_folder.clone())
    } else {
        installed.cloud_save_folder.clone()
    };

    let save_folder = match save_folder {
        Some(f) if !f.is_empty() => f,
        _ => return Ok(None),
    };

    let account_id = get_account_id().await.unwrap_or_default();

    let mut save_path = save_folder.replace('\\', "/");

    save_path = save_path.replace("{installdir}", &installed.install_path);
    save_path = save_path.replace("{epicid}", &account_id);

    #[cfg(target_os = "windows")]
    {
        let local_appdata = std::env::var("LOCALAPPDATA").unwrap_or_default();
        let userprofile = std::env::var("USERPROFILE").unwrap_or_default();
        save_path = save_path.replace("{appdata}", &local_appdata);
        save_path = save_path.replace("{userdir}", &format!("{}/Documents", userprofile));
        save_path = save_path.replace("{userprofile}", &userprofile);
        save_path = save_path.replace("{usersavedgames}", &format!("{}/Saved Games", userprofile));
    }

    #[cfg(target_os = "macos")]
    {
        let home = std::env::var("HOME").unwrap_or_default();
        save_path = save_path.replace(
            "{appdata}",
            &format!("{}/Library/Application Support", home),
        );
        save_path = save_path.replace("{userdir}", &format!("{}/Documents", home));
        save_path = save_path.replace("{userlibrary}", &format!("{}/Library", home));
    }

    #[cfg(target_os = "linux")]
    {
        let home = std::env::var("HOME").unwrap_or_default();

        save_path = save_path.replace("{appdata}", &format!("{}/.local/share", home));
        save_path = save_path.replace("{userdir}", &format!("{}/Documents", home));
        save_path = save_path.replace("{userprofile}", &home);
        save_path = save_path.replace("{usersavedgames}", &format!("{}/Saved Games", home));
    }

    Ok(Some(PathBuf::from(save_path)))
}

#[derive(Serialize, Deserialize, Debug, Clone, Default)]
#[serde(rename_all = "camelCase")]
struct CloudSaveResponse {
    #[serde(default)]
    files: HashMap<String, CloudSaveFile>,
}

#[derive(Serialize, Deserialize, Debug, Clone, Default)]
#[serde(rename_all = "camelCase")]
struct CloudSaveFile {
    file_name: Option<String>,
    read_link: Option<String>,
    write_link: Option<String>,
    last_modified: Option<String>,
    length: Option<i64>,
    storage_type: Option<String>,
    etag: Option<String>,
    unique_filename: Option<String>,
    account_id: Option<String>,
}

async fn get_auth_info() -> Result<(String, String), String> {
    let client = EPIC.lock().await;
    let ud = client.user_details();
    let token = ud
        .access_token()
        .map(|t| t.to_string())
        .ok_or_else(|| "Not authenticated".to_string())?;
    let account = ud
        .account_id
        .clone()
        .ok_or_else(|| "No account ID".to_string())?;
    Ok((token, account))
}

fn auth_headers(access_token: &str) -> HeaderMap {
    let mut headers = HeaderMap::new();
    headers.insert(
        AUTHORIZATION,
        HeaderValue::from_str(&format!("Bearer {}", access_token)).unwrap(),
    );
    headers
}

async fn cloud_save_list(
    access_token: &str,
    user_id: &str,
    app_name: Option<&str>,
    manifests: bool,
) -> Result<CloudSaveResponse, String> {
    let app_path = match app_name {
        Some(name) if manifests => format!("{}/manifests/", name),
        Some(name) => format!("{}/", name),
        None => String::new(),
    };

    let url = format!(
        "{}/api/v1/access/egstore/savesync/{}/{}",
        CLOUD_SAVE_BASE, user_id, app_path
    );

    let http = reqwest::Client::new();
    let resp = http
        .get(&url)
        .headers(auth_headers(access_token))
        .send()
        .await
        .map_err(|e| format!("Cloud save list failed: {}", e))?;

    if !resp.status().is_success() {
        return Err(format!("Cloud save list HTTP {}", resp.status()));
    }

    resp.json::<CloudSaveResponse>()
        .await
        .map_err(|e| format!("Failed to parse cloud save response: {}", e))
}

async fn cloud_save_query(
    access_token: &str,
    user_id: &str,
    app_name: &str,
    filenames: &[String],
) -> Result<CloudSaveResponse, String> {
    let url = format!(
        "{}/api/v1/access/egstore/savesync/{}/{}/",
        CLOUD_SAVE_BASE, user_id, app_name
    );

    let body = serde_json::json!({ "files": filenames });
    let http = reqwest::Client::new();
    let resp = http
        .post(&url)
        .headers(auth_headers(access_token))
        .json(&body)
        .send()
        .await
        .map_err(|e| format!("Cloud save query failed: {}", e))?;

    if !resp.status().is_success() {
        return Err(format!("Cloud save query HTTP {}", resp.status()));
    }

    resp.json::<CloudSaveResponse>()
        .await
        .map_err(|e| format!("Failed to parse cloud save response: {}", e))
}

async fn cloud_save_delete_file(access_token: &str, path: &str) -> Result<(), String> {
    let url = format!("{}/api/v1/data/egstore/{}", CLOUD_SAVE_BASE, path);

    let http = reqwest::Client::new();
    let resp = http
        .delete(&url)
        .headers(auth_headers(access_token))
        .send()
        .await
        .map_err(|e| format!("Cloud save delete failed: {}", e))?;

    if !resp.status().is_success() {
        return Err(format!("Cloud save delete HTTP {}", resp.status()));
    }

    Ok(())
}

pub async fn check_save_status(app_name: &str) -> Result<CloudSaveInfo, String> {
    ensure_logged_in().await?;

    let local_path = resolve_save_path(app_name).await?;

    let (local_exists, local_timestamp) = match &local_path {
        Some(path) if path.exists() => {
            let newest = get_newest_file_time(path);
            (true, newest)
        }
        _ => (false, None),
    };

    let (access_token, user_id) = get_auth_info().await?;
    let cloud_saves = cloud_save_list(&access_token, &user_id, Some(app_name), true).await?;

    let remote_exists = !cloud_saves.files.is_empty();
    let remote_timestamp = cloud_saves
        .files
        .values()
        .filter(|f| {
            f.file_name
                .as_ref()
                .map(|n| n.contains(".manifest"))
                .unwrap_or(false)
        })
        .filter_map(|f| f.last_modified.clone())
        .max();

    let status = match (local_exists, remote_exists) {
        (false, false) => SaveGameStatus::NoSave,
        (true, false) => SaveGameStatus::LocalNewer,
        (false, true) => SaveGameStatus::RemoteNewer,
        (true, true) => match (&local_timestamp, &remote_timestamp) {
            (Some(local_ts), Some(remote_ts)) => {
                let local_dt =
                    chrono::NaiveDateTime::parse_from_str(local_ts, "%Y-%m-%d %H:%M:%S").ok();
                let remote_dt = chrono::DateTime::parse_from_rfc3339(remote_ts)
                    .ok()
                    .map(|dt| dt.naive_utc());

                match (local_dt, remote_dt) {
                    (Some(l), Some(r)) => {
                        let diff = (l - r).num_seconds().abs();
                        if diff < 60 {
                            SaveGameStatus::SameAge
                        } else if l > r {
                            SaveGameStatus::LocalNewer
                        } else {
                            SaveGameStatus::RemoteNewer
                        }
                    }
                    _ => SaveGameStatus::Conflict,
                }
            }
            _ => SaveGameStatus::Conflict,
        },
    };

    Ok(CloudSaveInfo {
        app_name: app_name.to_string(),
        local_save_path: local_path.map(|p| p.to_string_lossy().to_string()),
        remote_save_exists: remote_exists,
        status,
        local_timestamp,
        remote_timestamp,
    })
}

pub async fn upload_saves(app_name: &str) -> Result<(), String> {
    ensure_logged_in().await?;

    let local_path = resolve_save_path(app_name).await?;
    let local_path = match local_path {
        Some(p) if p.exists() => p,
        Some(p) => return Err(format!("Save directory does not exist: {}", p.display())),
        None => return Err("Game does not support cloud saves".to_string()),
    };

    send_message_to_frontend(&format!("[EPIC-CLOUD] Uploading saves for {}...", app_name));

    let save_files = collect_save_files(&local_path)?;
    if save_files.is_empty() {
        return Err("No save files found".to_string());
    }

    let filenames: Vec<String> = save_files.keys().cloned().collect();
    let (access_token, user_id) = get_auth_info().await?;

    let cloud_response = cloud_save_query(&access_token, &user_id, app_name, &filenames).await?;

    let http_client = reqwest::Client::new();

    for (rel_path, file_bytes) in &save_files {
        if let Some(cloud_file) = cloud_response.files.get(rel_path) {
            if let Some(ref write_link) = cloud_file.write_link {
                let resp = http_client
                    .put(write_link)
                    .body(file_bytes.clone())
                    .send()
                    .await
                    .map_err(|e| format!("Failed to upload {}: {}", rel_path, e))?;

                if !resp.status().is_success() {
                    return Err(format!(
                        "Failed to upload {}: HTTP {}",
                        rel_path,
                        resp.status()
                    ));
                }
            }
        }
    }

    send_message_to_frontend(&format!(
        "[EPIC-CLOUD] Uploaded {} save files for {}",
        save_files.len(),
        app_name
    ));

    Ok(())
}

pub async fn download_saves(app_name: &str) -> Result<(), String> {
    ensure_logged_in().await?;

    let local_path = resolve_save_path(app_name).await?;
    let local_path = match local_path {
        Some(p) => p,
        None => return Err("Game does not support cloud saves".to_string()),
    };

    send_message_to_frontend(&format!(
        "[EPIC-CLOUD] Downloading saves for {}...",
        app_name
    ));

    let (access_token, user_id) = get_auth_info().await?;
    let cloud_saves = cloud_save_list(&access_token, &user_id, Some(app_name), true).await?;

    let http_client = reqwest::Client::new();

    fs::create_dir_all(&local_path)
        .map_err(|e| format!("Failed to create save directory: {}", e))?;

    let mut downloaded_count = 0;

    for (filename, cloud_file) in &cloud_saves.files {
        if let Some(ref read_link) = cloud_file.read_link {
            if filename.ends_with(".manifest") {
                continue;
            }

            let resp = http_client
                .get(read_link)
                .send()
                .await
                .map_err(|e| format!("Failed to download {}: {}", filename, e))?;

            if resp.status().is_success() {
                let bytes = resp
                    .bytes()
                    .await
                    .map_err(|e| format!("Failed to read {}: {}", filename, e))?;

                let rel_path = extract_relative_save_path(filename, app_name);
                let file_path = local_path.join(&rel_path);

                if let Some(parent) = file_path.parent() {
                    fs::create_dir_all(parent).ok();
                }

                fs::write(&file_path, &bytes)
                    .map_err(|e| format!("Failed to write {}: {}", file_path.display(), e))?;

                downloaded_count += 1;
            }
        }
    }

    send_message_to_frontend(&format!(
        "[EPIC-CLOUD] Downloaded {} save files for {}",
        downloaded_count, app_name
    ));

    Ok(())
}

pub async fn delete_cloud_saves(app_name: &str) -> Result<(), String> {
    ensure_logged_in().await?;

    let (access_token, user_id) = get_auth_info().await?;
    let cloud_saves = cloud_save_list(&access_token, &user_id, Some(app_name), false).await?;

    for (filename, _) in &cloud_saves.files {
        cloud_save_delete_file(&access_token, filename).await?;
    }

    send_message_to_frontend(&format!(
        "[EPIC-CLOUD] Deleted cloud saves for {}",
        app_name
    ));

    Ok(())
}

fn collect_save_files(base_path: &Path) -> Result<HashMap<String, Vec<u8>>, String> {
    let mut files = HashMap::new();

    if !base_path.exists() {
        return Ok(files);
    }

    for entry in walkdir::WalkDir::new(base_path)
        .into_iter()
        .filter_map(|e| e.ok())
    {
        if entry.file_type().is_file() {
            let rel_path = entry
                .path()
                .strip_prefix(base_path)
                .map_err(|e| format!("Path error: {}", e))?
                .to_string_lossy()
                .replace('\\', "/");

            let bytes = fs::read(entry.path())
                .map_err(|e| format!("Failed to read {}: {}", entry.path().display(), e))?;

            files.insert(rel_path, bytes);
        }
    }

    Ok(files)
}

fn get_newest_file_time(path: &Path) -> Option<String> {
    let mut newest: Option<std::time::SystemTime> = None;

    if let Ok(entries) = walkdir::WalkDir::new(path)
        .into_iter()
        .collect::<Result<Vec<_>, _>>()
    {
        for entry in entries {
            if entry.file_type().is_file() {
                if let Ok(meta) = entry.metadata() {
                    if let Ok(modified) = meta.modified() {
                        newest = Some(match newest {
                            Some(n) if modified > n => modified,
                            Some(n) => n,
                            None => modified,
                        });
                    }
                }
            }
        }
    }

    newest.map(|t| {
        let dt: chrono::DateTime<chrono::Local> = t.into();
        dt.format("%Y-%m-%d %H:%M:%S").to_string()
    })
}

fn extract_relative_save_path(cloud_filename: &str, _app_name: &str) -> String {
    let parts: Vec<&str> = cloud_filename.split('/').collect();

    if parts.len() > 4 {
        parts[4..].join("/")
    } else if let Some(last) = parts.last() {
        last.to_string()
    } else {
        cloud_filename.to_string()
    }
}
