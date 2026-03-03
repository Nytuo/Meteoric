use std::collections::HashMap;
use std::fs;
use std::fs::File;
use std::io::Read;
use std::path::PathBuf;

use directories::ProjectDirs;
use gog::token::Token;
use gog::Gog;
use serde::{Deserialize, Serialize};
use tokio::sync::Mutex;

use crate::database::{establish_connection, update_achievements, update_game_nodup};
use crate::{send_message_to_frontend, IGame, ITrophy};

pub mod achievements;
pub mod cloud_saves;
pub mod download_manager;
pub mod game_launch;
pub mod gog_v2;

// ──────────────────────────────────────────────
// Global state
// ──────────────────────────────────────────────

lazy_static::lazy_static! {
    static ref AUTHCODE: Mutex<String> = Mutex::new(String::new());
    pub(crate) static ref GOG_TOKEN: Mutex<Option<Token>> = Mutex::new(None);
    pub(crate) static ref INSTALLED_GAMES: Mutex<HashMap<String, InstalledGogGame>> =
        Mutex::new(HashMap::new());
}

// ──────────────────────────────────────────────
// Installed game tracking
// ──────────────────────────────────────────────

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct InstalledGogGame {
    pub game_id: String,
    pub install_path: String,
    pub title: String,
    pub version: String,
    pub executable: String,
    pub install_size: u64,
    pub platform: String,
    pub cloud_save_folder: Option<String>,
    pub launch_parameters: Option<String>,
    pub working_dir: Option<String>,
}

// ──────────────────────────────────────────────
// GOG game entry (for the library/downloadable list)
// ──────────────────────────────────────────────

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct GogGameEntry {
    pub game_id: String,
    pub title: String,
    pub is_installed: bool,
    pub installed_version: Option<String>,
    pub has_update: bool,
    pub cloud_saves_supported: bool,
    pub background_image: Option<String>,
    pub cd_key: Option<String>,
}

// ──────────────────────────────────────────────
// Config helpers
// ──────────────────────────────────────────────

pub fn get_config_dir() -> PathBuf {
    ProjectDirs::from("fr", "Nytuo", "Meteoric")
        .unwrap()
        .config_dir()
        .to_path_buf()
}

pub fn get_gog_data_dir() -> PathBuf {
    let dir = get_config_dir().join("gog_data");
    if !dir.exists() {
        fs::create_dir_all(&dir).ok();
    }
    dir
}

fn get_installed_games_path() -> PathBuf {
    get_gog_data_dir().join("installed_games.json")
}

fn get_credentials_path() -> PathBuf {
    get_config_dir().join("gogDetails.txt")
}

pub fn get_platform() -> String {
    #[cfg(target_os = "windows")]
    {
        "windows".to_string()
    }
    #[cfg(target_os = "macos")]
    {
        "osx".to_string()
    }
    #[cfg(not(any(target_os = "windows", target_os = "macos")))]
    {
        "linux".to_string()
    }
}

// ──────────────────────────────────────────────
// Persistence: installed games
// ──────────────────────────────────────────────

pub async fn save_installed_games() {
    let path = get_installed_games_path();
    let games = INSTALLED_GAMES.lock().await;
    match serde_json::to_string_pretty(&*games) {
        Ok(json) => {
            match fs::write(&path, json) {
                Ok(_) => println!("[GOG] Saved {} installed games to {:?}", games.len(), path),
                Err(e) => eprintln!("[GOG ERROR] Failed to write installed games file: {}", e),
            }
        }
        Err(e) => eprintln!("[GOG ERROR] Failed to serialize installed games: {}", e),
    }
}

pub async fn load_installed_games() {
    let path = get_installed_games_path();
    if !path.exists() {
        println!("[GOG] No installed games file found, starting with empty cache");
        return;
    }
    match fs::read_to_string(&path) {
        Ok(data) => {
            match serde_json::from_str::<HashMap<String, InstalledGogGame>>(&data) {
                Ok(games) => {
                    let count = games.len();
                    let mut cache = INSTALLED_GAMES.lock().await;
                    *cache = games;
                    println!("[GOG] Loaded {} installed games from cache", count);
                }
                Err(e) => {
                    eprintln!("[GOG ERROR] Failed to parse installed games JSON: {}", e);
                }
            }
        }
        Err(e) => {
            eprintln!("[GOG ERROR] Failed to read installed games file: {}", e);
        }
    }
}

// ──────────────────────────────────────────────
// Authentication
// ──────────────────────────────────────────────

/// Ensure we have a valid GOG token (from file or auth code).
/// Returns a Gog client. The gog crate uses blocking reqwest, so this
/// should be called inside `task::block_in_place`.
pub fn ensure_token() -> Result<Token, String> {
    let creds_path = get_credentials_path();

    // Try loading from file first
    if creds_path.exists() {
        if let Ok(meta) = creds_path.metadata() {
            if meta.len() > 0 {
                if let Ok(contents) = fs::read_to_string(&creds_path) {
                    match serde_json::from_str::<Token>(&contents) {
                        Ok(token) => {
                            println!("[GOG] Recovered session from saved credentials");
                            return Ok(token);
                        }
                        Err(e) => {
                            println!("[GOG] Failed to deserialize saved credentials: {}", e);
                        }
                    }
                }
            }
        }
    }

    Err("Not logged in to GOG. Please provide an auth code.".into())
}

/// Refresh the token and save it back to file
pub fn refresh_and_save_token(token: &Token) -> Result<Token, String> {
    let refreshed = token.refresh()
        .map_err(|e| format!("Failed to refresh token: {}", e))?;
    
    // Save the refreshed token
    let creds_path = get_credentials_path();
    let json = serde_json::to_string(&refreshed)
        .map_err(|e| format!("Failed to serialize token: {}", e))?;
    fs::write(&creds_path, &json)
        .map_err(|e| format!("Failed to save refreshed token: {}", e))?;
    
    println!("[GOG] Token refreshed and saved");
    Ok(refreshed)
}

/// Build a Gog client from a token. Token auto-refreshes.
pub fn build_gog_client(token: Token) -> Gog {
    Gog::new(token)
}

/// Check if we are currently logged in (have a valid saved token)
pub async fn is_logged_in() -> bool {
    let creds_path = get_credentials_path();
    if !creds_path.exists() {
        return false;
    }
    if let Ok(contents) = fs::read_to_string(&creds_path) {
        serde_json::from_str::<Token>(&contents).is_ok()
    } else {
        false
    }
}

/// Get user display name
pub async fn get_display_name() -> Option<String> {
    tokio::task::block_in_place(|| {
        let token = ensure_token().ok()?;
        let gog = build_gog_client(token);
        let user_data = gog.get_user_data().ok()?;
        Some(user_data.username)
    })
}

/// Get user id
pub async fn get_user_id() -> Option<i64> {
    tokio::task::block_in_place(|| {
        let token = ensure_token().ok()?;
        let gog = build_gog_client(token);
        Some(gog.uid())
    })
}

// ──────────────────────────────────────────────
// Library import (database population)
// ──────────────────────────────────────────────

pub async fn get_games() -> Result<(), Box<dyn std::error::Error>> {
    let authcode = AUTHCODE.lock().await.clone();

    tokio::task::block_in_place(move || {
        let creds_path = get_credentials_path();
        let parsed_token: Token;

        if authcode.is_empty() && creds_path.exists() && creds_path.metadata().unwrap().len() > 0 {
            println!("[GOG IMPORTER] Found token file");
            let mut file = File::open(&creds_path).unwrap();
            let mut contents = String::new();
            file.read_to_string(&mut contents).unwrap();
            match serde_json::from_str::<Token>(&contents) {
                Ok(user_details) => {
                    parsed_token = user_details;
                }
                Err(e) => {
                    println!("[GOG IMPORTER] Failed to parse token file: {}", e);
                    return;
                }
            }
        } else if !authcode.is_empty() {
            parsed_token = Token::from_login_code(authcode.to_string()).unwrap();
            let json = serde_json::to_string(&parsed_token).unwrap();
            fs::write(&creds_path, &json).expect("Unable to write token file");
        } else {
            println!("[GOG IMPORTER] No token found");
            return;
        }

        let gog = Gog::new(parsed_token);
        let user_id = gog.uid();
        let games = gog.get_games().unwrap();
        let conn = establish_connection().unwrap();
        
        for game_id in games {
            let games_detailled = gog.get_game_details(game_id);
            match games_detailled {
                Ok(game) => {
                    let mut igame: IGame = IGame::new();
                    igame.id = "-1".to_string();
                    igame.name = game.title;
                    igame.importer_id = "gog".to_string();
                    igame.game_importer_id = game_id.to_string();
                    igame.release_date = game.release_timestamp.to_string();
                    let mut tags = Vec::new();
                    for tag in game.tags.clone() {
                        tags.push(tag.name);
                    }
                    igame.tags = tags.join(",");
                    igame.platforms = "GOG".to_string();
                    // Store game_id in exec_args for later use
                    igame.exec_args = format!("gog:{}", game_id);
                    let new_id = update_game_nodup(&conn, igame).expect("[GOG IMPORTER] Failed to update game");
                    
                    // GOG API doesn't provide total playtime or last played time
                    // We'll initialize with zero playtime and current time
                    // Actual playtime will be tracked when games are launched via game_launch.rs
                    let _ = crate::database::first_time_stat(
                        &conn,
                        new_id,
                        "0".to_string(), // No playtime data from API
                        chrono::Local::now()
                            .format("%Y-%m-%d %H:%M:%S")
                            .to_string(),
                    );
                }
                Err(_) => println!("[GOG IMPORTER] Failed to get game details"),
            }
            let achievements_result = gog.achievements(game_id, user_id);
            match achievements_result {
                Ok(achievements_list) => {
                    let mut iachievements: Vec<ITrophy> = Vec::new();
                    for achievement in achievements_list.items {
                        let mut itrophy: ITrophy = ITrophy::new();
                        itrophy.id = "-1".to_string();
                        itrophy.name = achievement.name;
                        itrophy.description = achievement.description;
                        itrophy.game_id = game_id.to_string();
                        itrophy.importer_id = "gog".to_string();
                        itrophy.visible = achievement.visible.to_string();
                        itrophy.image_url_unlocked = achievement.image_url_unlocked;
                        itrophy.image_url_locked = achievement.image_url_locked;
                        itrophy.date_of_unlock =
                            achievement.date_unlocked.clone().unwrap_or_default();
                        itrophy.unlocked =
                            achievement.date_unlocked.clone().is_some().to_string();
                        iachievements.push(itrophy);
                    }
                    let conn = establish_connection().unwrap();
                    update_achievements(&conn, iachievements)
                        .expect("[GOG IMPORTER] Failed to update achievements");
                }
                Err(_) => println!("[GOG IMPORTER] Failed to get achievements"),
            }
        }
    });

    send_message_to_frontend("[GOG-INFO] Library import complete");
    Ok(())
}

// ──────────────────────────────────────────────
// Get list of games available for download
// ──────────────────────────────────────────────

pub async fn get_downloadable_games() -> Result<Vec<GogGameEntry>, String> {
    // Blocking part: authenticate once and fetch owned game IDs
    let (game_ids, token) = tokio::task::block_in_place(|| -> Result<(Vec<i64>, gog::token::Token), String> {
        let token = ensure_token()?;
        let gog = build_gog_client(token.clone());
        let game_ids = gog.get_games().map_err(|e| format!("Failed to get games: {}", e))?;
        Ok((game_ids, token))
    })?;

    let installed = INSTALLED_GAMES.lock().await.clone();
    let mut entries = Vec::new();

    for game_id in game_ids {
        let game_id_str = game_id.to_string();
        let is_installed = installed.contains_key(&game_id_str);
        let installed_game = installed.get(&game_id_str);

        // Try the gog crate's embed-API details (may fail for DLCs / region-locked titles)
        let token_clone = token.clone();
        let details_result = tokio::task::block_in_place(move || -> Result<_, String> {
            let gog = build_gog_client(token_clone);
            gog.get_game_details(game_id).map_err(|e| format!("{:?}", e))
        });

        match details_result {
            Ok(details) => {
                entries.push(GogGameEntry {
                    game_id: game_id_str,
                    title: details.title,
                    is_installed,
                    installed_version: installed_game.map(|g| g.version.clone()),
                    has_update: false,
                    cloud_saves_supported: false,
                    background_image: Some(details.background_image),
                    cd_key: details.cd_key,
                });
            }
            Err(_) => {
                // Fallback: public GOG product API (no auth required)
                if let Some(title) = fetch_product_title(game_id).await {
                    entries.push(GogGameEntry {
                        game_id: game_id_str,
                        title,
                        is_installed,
                        installed_version: installed_game.map(|g| g.version.clone()),
                        has_update: false,
                        cloud_saves_supported: false,
                        background_image: None,
                        cd_key: None,
                    });
                }
                // silently skip if both APIs fail (e.g. account-only DLC with no standalone page)
            }
        }
    }

    Ok(entries)
}

/// Fetch a game's title from the public GOG product API (no authentication needed).
async fn fetch_product_title(game_id: i64) -> Option<String> {
    #[derive(serde::Deserialize)]
    struct ProductInfo {
        title: String,
    }

    let url = format!("https://api.gog.com/products/{}", game_id);
    let client = reqwest::Client::new();
    let resp = client
        .get(&url)
        .header("Accept", "application/json")
        .send()
        .await
        .ok()?;
    let info: ProductInfo = resp.json().await.ok()?;
    Some(info.title)
}

// ──────────────────────────────────────────────
// Get installed GOG games
// ──────────────────────────────────────────────

pub async fn get_installed_gog_games() -> Vec<InstalledGogGame> {
    let games = INSTALLED_GAMES.lock().await;
    games.values().cloned().collect()
}

pub async fn get_installed_gog_game(game_id: &str) -> Option<InstalledGogGame> {
    let games = INSTALLED_GAMES.lock().await;
    games.get(game_id).cloned()
}

pub async fn debug_cache_info() -> String {
    let path = get_installed_games_path();
    let games = INSTALLED_GAMES.lock().await;
    let mut info = String::new();

    info.push_str(&format!("File path: {}\n", path.display()));
    info.push_str(&format!("File exists: {}\n", path.exists()));

    if path.exists() {
        if let Ok(metadata) = fs::metadata(&path) {
            info.push_str(&format!("File size: {} bytes\n", metadata.len()));
        }
    }

    info.push_str(&format!("\nCache size: {} games\n", games.len()));
    if !games.is_empty() {
        info.push_str("Games in cache:\n");
        for (game_id, game) in games.iter() {
            info.push_str(&format!("  - {} ({})\n", game_id, game.title));
        }
    }

    info
}

pub async fn reload_installed_games_cache() -> Result<usize, String> {
    load_installed_games().await;
    let games = INSTALLED_GAMES.lock().await;
    Ok(games.len())
}

// ──────────────────────────────────────────────
// Credentials
// ──────────────────────────────────────────────

pub async fn set_credentials(creds: Vec<String>) {
    let authorization_code = creds[0].to_string();
    let mut authcode = AUTHCODE.lock().await;
    *authcode = authorization_code;
}

pub async fn get_games_from_user() -> Result<(), Box<dyn std::error::Error>> {
    load_installed_games().await;
    get_games().await
}
