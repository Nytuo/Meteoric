use std::collections::HashMap;
use std::fs;
use std::path::PathBuf;

use directories::ProjectDirs;
use egs_api::api::types::epic_asset::EpicAsset;
use egs_api::EpicGames;
use serde::{Deserialize, Serialize};
use tokio::sync::Mutex;

use crate::database::{establish_connection, update_game_nodup};
use crate::{send_message_to_frontend, IGame};

pub mod achievements;
pub mod cloud_saves;
pub mod download_manager;
pub mod game_launch;

mod test;

lazy_static::lazy_static! {
    static ref AUTHCODE: Mutex<String> = Mutex::new(String::new());
    pub(crate) static ref EPIC: Mutex<EpicGames> = Mutex::new(EpicGames::new());
    pub(crate) static ref INSTALLED_GAMES: Mutex<HashMap<String, InstalledEpicGame>> =
        Mutex::new(HashMap::new());
    static ref ASSET_CACHE: Mutex<HashMap<String, EpicAsset>> = Mutex::new(HashMap::new());
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct InstalledEpicGame {
    pub app_name: String,
    pub install_path: String,
    pub title: String,
    pub version: String,
    pub executable: String,
    pub install_size: u64,
    pub manifest_path: String,
    pub namespace: String,
    pub catalog_item_id: String,
    pub can_run_offline: bool,
    pub requires_ownership_token: bool,
    pub platform: String,
    pub cloud_save_folder: Option<String>,
    pub cloud_save_folder_mac: Option<String>,
    pub launch_parameters: Option<String>,
}

pub fn get_config_dir() -> PathBuf {
    ProjectDirs::from("fr", "Nytuo", "Meteoric")
        .unwrap()
        .config_dir()
        .to_path_buf()
}

pub fn get_platform() -> String {
    #[cfg(target_os = "windows")]
    {
        "Windows".to_string()
    }

    #[cfg(target_os = "macos")]
    {
        "Mac".to_string()
    }

    #[cfg(not(any(target_os = "windows", target_os = "macos")))]
    {
        "Windows".to_string()
    }
}

pub fn get_epic_data_dir() -> PathBuf {
    let dir = get_config_dir().join("epic_data");
    if !dir.exists() {
        fs::create_dir_all(&dir).ok();
    }
    dir
}

fn get_installed_games_path() -> PathBuf {
    get_epic_data_dir().join("installed_games.json")
}

fn get_credentials_path() -> PathBuf {
    get_config_dir().join("epicDetails.txt")
}

pub fn get_manifests_dir() -> PathBuf {
    let dir = get_epic_data_dir().join("manifests");
    if !dir.exists() {
        fs::create_dir_all(&dir).ok();
    }
    dir
}

pub async fn save_installed_games() {
    let path = get_installed_games_path();
    let games = INSTALLED_GAMES.lock().await;
    match serde_json::to_string_pretty(&*games) {
        Ok(json) => match fs::write(&path, json) {
            Ok(_) => println!("[EPIC] Saved {} installed games to {:?}", games.len(), path),
            Err(e) => eprintln!("[EPIC ERROR] Failed to write installed games file: {}", e),
        },
        Err(e) => eprintln!("[EPIC ERROR] Failed to serialize installed games: {}", e),
    }
}

pub async fn load_installed_games() {
    let path = get_installed_games_path();
    println!("[EPIC] ========================================");
    println!("[EPIC] Loading installed games from: {}", path.display());
    println!("[EPIC] File exists: {}", path.exists());

    if !path.exists() {
        println!("[EPIC] No installed games file found, starting with empty cache");
        println!("[EPIC] ========================================");
        return;
    }

    match fs::read_to_string(&path) {
        Ok(data) => {
            println!("[EPIC] Successfully read file, size: {} bytes", data.len());
            println!(
                "[EPIC] First 200 chars: {}",
                &data.chars().take(200).collect::<String>()
            );

            match serde_json::from_str::<HashMap<String, InstalledEpicGame>>(&data) {
                Ok(games) => {
                    let count = games.len();
                    println!("[EPIC] Successfully parsed {} games from JSON", count);
                    for (key, game) in &games {
                        println!("[EPIC]   - {} => {} ({})", key, game.title, game.app_name);
                    }

                    let mut cache = INSTALLED_GAMES.lock().await;
                    *cache = games;

                    println!("[EPIC] Cache now contains {} games", cache.len());
                    println!("[EPIC] ========================================");
                }
                Err(e) => {
                    eprintln!("[EPIC ERROR] Failed to parse installed games JSON: {}", e);
                    eprintln!("[EPIC ERROR] JSON content: {}", data);
                    println!("[EPIC] ========================================");
                }
            }
        }
        Err(e) => {
            eprintln!("[EPIC ERROR] Failed to read installed games file: {}", e);
            println!("[EPIC] ========================================");
        }
    }
}

pub async fn ensure_logged_in() -> Result<(), String> {
    let authcode = AUTHCODE.lock().await.clone();
    let mut client = EPIC.lock().await;

    if client.is_logged_in() {
        return Ok(());
    }

    let creds_path = get_credentials_path();
    if authcode.is_empty() && creds_path.exists() {
        if let Ok(meta) = creds_path.metadata() {
            if meta.len() > 0 {
                if let Ok(contents) = fs::read_to_string(&creds_path) {
                    match serde_json::from_str::<egs_api::api::types::account::UserData>(&contents)
                    {
                        Ok(user_details) => {
                            client.set_user_details(user_details);
                            if client.login().await {
                                println!("[EPIC] Recovered session from saved credentials");
                                let ud = client.user_details();
                                let _ = fs::write(
                                    &creds_path,
                                    serde_json::to_string(&ud).unwrap_or_default(),
                                );
                                return Ok(());
                            }
                        }
                        Err(e) => {
                            println!("[EPIC] Failed to deserialize saved credentials: {}", e);
                        }
                    }
                }
            }
        }
    }

    if !authcode.is_empty() && client.auth_code(None, Some(authcode.clone())).await {
        println!("[EPIC] Logged in with auth code");
        client.login().await;
        let ud = client.user_details();
        let _ = fs::write(&creds_path, serde_json::to_string(&ud).unwrap_or_default());
        return Ok(());
    }

    Err("Failed to login to Epic Games. Please provide a valid auth code.".into())
}

pub async fn is_logged_in() -> bool {
    let client = EPIC.lock().await;
    client.is_logged_in()
}

pub async fn get_display_name() -> Option<String> {
    let client = EPIC.lock().await;
    if client.is_logged_in() {
        let ud = client.user_details();
        Some(ud.display_name.clone().unwrap_or_default())
    } else {
        None
    }
}

pub async fn get_account_id() -> Option<String> {
    let client = EPIC.lock().await;
    if client.is_logged_in() {
        let ud = client.user_details();
        Some(ud.account_id.clone().unwrap_or_default())
    } else {
        None
    }
}

pub async fn fetch_assets() -> Result<Vec<EpicAsset>, String> {
    ensure_logged_in().await?;
    let platform = get_platform();
    let mut client = EPIC.lock().await;
    let assets = client.list_assets(Some(platform), None).await;
    let mut cache = ASSET_CACHE.lock().await;
    for asset in &assets {
        cache.insert(asset.app_name.clone(), asset.clone());
    }
    Ok(assets)
}

pub async fn get_cached_asset(app_name: &str) -> Option<EpicAsset> {
    let cache = ASSET_CACHE.lock().await;
    cache.get(app_name).cloned()
}

pub async fn get_games() -> Result<(), String> {
    load_installed_games().await;

    ensure_logged_in().await?;

    let mut client = EPIC.lock().await;

    let lib_items = client.library_items(true).await;
    let records = match lib_items {
        Some(lib) => lib.records,
        None => {
            println!("[EPIC] No library items found");
            return Ok(());
        }
    };

    let assets = client.list_assets(Some("Windows".to_string()), None).await;
    let asset_map: HashMap<String, EpicAsset> = assets
        .iter()
        .map(|a| (a.app_name.clone(), a.clone()))
        .collect();

    {
        let mut cache = ASSET_CACHE.lock().await;
        for (k, v) in &asset_map {
            cache.insert(k.clone(), v.clone());
        }
    }

    let mut parsed_games: HashMap<String, (String, String)> = HashMap::new();
    let conn = establish_connection().unwrap();
    for record in &records {
        let game_id = record.product_id.clone();
        let game_name = record.sandbox_name.clone();

        if game_name.contains("UE Marketplace")
            || game_name.contains("Live")
            || game_name.contains("fab-listing-live")
        {
            continue;
        }
        parsed_games.insert(game_id, (game_name, record.app_name.clone()));
    }

    drop(client);

    for (product_id, (game_name, app_name)) in &parsed_games {
        let mut igame = IGame::new();
        igame.id = "-1".to_string();
        igame.name = game_name.clone();
        igame.platforms = "Epic Games".to_string();
        igame.game_importer_id = product_id.clone();
        igame.importer_id = "epic".to_string();

        if let Some(asset) = asset_map.get(app_name) {
            igame.exec_args = format!(
                "epic:{}:{}:{}",
                asset.app_name, asset.namespace, asset.catalog_item_id
            );
        }

        let new_id = update_game_nodup(&conn, igame).expect("[EPIC] Failed to update game");

        let _ = crate::database::first_time_stat(
            &conn,
            new_id,
            "0".to_string(),
            chrono::Local::now().format("%Y-%m-%d %H:%M:%S").to_string(),
        );
    }

    send_message_to_frontend("[EPIC-INFO] Library import complete");
    Ok(())
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct EpicGameEntry {
    pub app_name: String,
    pub title: String,
    pub namespace: String,
    pub catalog_item_id: String,
    pub build_version: String,
    pub install_size: Option<u64>,
    pub is_installed: bool,
    pub installed_version: Option<String>,
    pub has_update: bool,
    pub cloud_saves_supported: bool,
}

pub async fn get_downloadable_games() -> Result<Vec<EpicGameEntry>, String> {
    let assets = fetch_assets().await?;
    let installed = INSTALLED_GAMES.lock().await;

    let mut entries = Vec::new();
    for asset in &assets {
        if asset.namespace == "ue" {
            continue;
        }

        let is_installed = installed.contains_key(&asset.app_name);
        let installed_game = installed.get(&asset.app_name);
        let has_update = installed_game
            .map(|ig| ig.version != asset.build_version)
            .unwrap_or(false);

        entries.push(EpicGameEntry {
            app_name: asset.app_name.clone(),
            title: asset.app_name.clone(),
            namespace: asset.namespace.clone(),
            catalog_item_id: asset.catalog_item_id.clone(),
            build_version: asset.build_version.clone(),
            install_size: None,
            is_installed,
            installed_version: installed_game.map(|ig| ig.version.clone()),
            has_update,
            cloud_saves_supported: false,
        });
    }

    Ok(entries)
}

pub async fn get_installed_epic_games() -> Vec<InstalledEpicGame> {
    let games = INSTALLED_GAMES.lock().await;
    games.values().cloned().collect()
}

pub async fn get_installed_epic_game(app_name: &str) -> Option<InstalledEpicGame> {
    let games = INSTALLED_GAMES.lock().await;
    games.get(app_name).cloned()
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
        if let Ok(contents) = fs::read_to_string(&path) {
            info.push_str(&format!(
                "File contents (first 500 chars):\n{}\n",
                &contents.chars().take(500).collect::<String>()
            ));
        }
    }

    info.push_str(&format!("\nCache size: {} games\n", games.len()));
    if !games.is_empty() {
        info.push_str("Games in cache:\n");
        for (app_name, game) in games.iter() {
            info.push_str(&format!("  - {} ({})\n", app_name, game.title));
        }
    }

    info
}

pub async fn reload_installed_games_cache() -> Result<usize, String> {
    println!("[EPIC] Manually reloading installed games cache...");
    load_installed_games().await;
    let games = INSTALLED_GAMES.lock().await;
    let count = games.len();
    println!("[EPIC] Cached reloaded: {} games", count);
    Ok(count)
}

pub async fn set_credentials(creds: Vec<String>) {
    let authorization_code = creds[0].to_string();
    let mut authcode = AUTHCODE.lock().await;
    *authcode = authorization_code;
}

pub async fn get_games_from_user() -> Result<(), Box<dyn std::error::Error>> {
    get_games().await.map_err(|e| e.into())
}
