use steam_rs::steam_id::SteamId;
use steam_rs::Steam;
use tokio::sync::Mutex;
use std::env;

use crate::database::{
    establish_connection, first_time_stat, update_achievements, update_game_nodup,
};
use crate::{send_message_to_frontend, IGame, ITrophy};
use crate::plugins::steam_api_lenient;

lazy_static::lazy_static! {
    static ref STEAMID: Mutex<String> = Mutex::new("".to_string());
    static ref APIKEY: Mutex<String> = Mutex::new("".to_string());
}

pub async fn get_games() -> Result<(), Box<dyn std::error::Error>> {
    println!("[STEAM IMPORTER] Starting Steam Importer");
    let apikey = APIKEY.lock().await;
    let steamid = STEAMID.lock().await;
    println!("[STEAM IMPORTER] API Key length: {}, Steam ID length: {}", apikey.len(), steamid.len());
    if apikey.is_empty() || steamid.is_empty() {
        println!("[STEAM IMPORTER] Credentials not set (apikey empty: {}, steamid empty: {})", apikey.is_empty(), steamid.is_empty());
        return Ok(());
    }
    let client = Steam::new(&apikey);
    let steam_id_u64: u64 = steamid.parse().map_err(|_| {
        format!("Invalid Steam ID '{}'. Must be a numeric Steam ID (SteamID64), not a username. Find yours at https://steamid.io/", steamid)
    })?;
    let steam_id = SteamId::new(steam_id_u64);
    let games = client
        .get_owned_games(steam_id, true, false, 0, false, Some(true), "EN", true)
        .await;
    println!("[STEAM IMPORTER] Games collected from Steam");
    for game in games.clone().unwrap().games {
        let mut igame: IGame = IGame::new();
        igame.id = "-1".to_string();
        igame.name = game.name.clone();
        igame.importer_id = "steam".to_string();
        igame.game_importer_id = game.appid.to_string();
        igame.platforms = "Steam".to_string();
        let conn = establish_connection().unwrap();
        let new_id = update_game_nodup(&conn, igame)?;
        
        // Steam API provides playtime_forever in minutes
        // Convert to milliseconds for consistency with Meteoric's stats system
        let playtime_ms = (game.playtime_forever * 60 * 1000).to_string();
        
        // Note: The steam-rs library doesn't expose rtime_last_played
        // For now, use current time as import date
        // TODO: Custom API call to get actual last played time
        let date_of_play = chrono::Local::now()
            .format("%Y-%m-%d %H:%M:%S")
            .to_string();
        
        println!(
            "[STEAM IMPORTER] Game: {} - Playtime: {} min ({} ms)",
            game.name, game.playtime_forever, playtime_ms
        );
        
        first_time_stat(&conn, new_id, playtime_ms, date_of_play)?;
    }

    println!("[STEAM IMPORTER] BASIC GAME DATA IMPORTED");
    let mut rate_limiter_requests = 0;
    for game in games.unwrap().games {
        rate_limiter_requests += 1;
        if rate_limiter_requests == 10 {
            println!("[STEAM IMPORTER] Rate limiter reached, waiting 10 seconds");
            tokio::time::sleep(tokio::time::Duration::from_secs(10)).await;
            rate_limiter_requests = 0;
        }
        let schema = client
            .get_schema_for_game(game.appid, Option::from("EN"))
            .await;
        match schema {
            Ok(schema) => {
                let schema = schema;
                let achievements_schema = schema.available_game_stats.achievements;
                let mut iachievements: Vec<ITrophy> = Vec::new();
                for achievement in achievements_schema {
                    let mut itrophy: ITrophy = ITrophy::new();
                    itrophy.id = "-1".to_string();
                    itrophy.name = achievement.display_name;
                    itrophy.description = achievement.description;
                    itrophy.game_id = game.appid.to_string();
                    itrophy.importer_id = "steam".to_string();
                    itrophy.visible = if achievement.hidden == 0 {
                        "true".to_string()
                    } else {
                        "false".to_string()
                    };
                    itrophy.image_url_unlocked = achievement.icon;
                    itrophy.image_url_locked = achievement.icon_gray;
                    itrophy.date_of_unlock = "".to_string();
                    itrophy.unlocked = "false".to_string();
                    iachievements.push(itrophy);
                }
                let trophies_player_stat = client
                    .get_player_achievements(steam_id, game.appid, Option::from("EN"))
                    .await;
                match trophies_player_stat {
                    Ok(player_stats) => {
                        if let Some(player_achievements) = player_stats.achievements {
                            for achievement in iachievements.iter_mut() {
                                for player_achievement in player_achievements.iter() {
                                    if let Some(ref apiname) = player_achievement.apiname {
                                        if achievement.name == *apiname {
                                            achievement.unlocked = if player_achievement.achieved == 1 {
                                                "true".to_string()
                                            } else {
                                                "false".to_string()
                                            };
                                            if let Some(unlocktime) = player_achievement.unlocktime {
                                                achievement.date_of_unlock = unlocktime.to_string();
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                    Err(e) => {
                        println!("[STEAM IMPORTER] Could not fetch player achievements: {}", e);
                    }
                }
                println!("[STEAM IMPORTER] ACHIEVEMENTS IMPORTED");
                
                // Calculate counts before moving iachievements
                let count = iachievements.len();
                let unlocked_count = iachievements.iter().filter(|t| t.unlocked == "true").count();
                
                let conn = establish_connection().unwrap();
                update_achievements(&conn, iachievements)?;
                
                // Update the trophies count on the game row
                let sql = format!(
                    "UPDATE games SET trophies = '{}', trophies_unlocked = '{}' WHERE game_importer_id = '{}'",
                    count, unlocked_count, game.appid
                );
                let _ = conn.execute(&sql, []);
                
                println!("[STEAM IMPORTER] ACHIEVEMENTS UPDATED IN DB");
            }
            Err(e) => {
                let err_str = format!("{}", e);
                if err_str.contains("missing field") {
                    println!(
                        "[STEAM IMPORTER] Skipping achievements for game {} - incomplete data (missing required fields)",
                        game.appid
                    );
                } else {
                    println!("[STEAM IMPORTER] Error getting schema for game {}: {}", game.appid, e);
                }
            }
        }
    }
    println!("STEAM IMPORTER DONE");
    Ok(())
}

/// Sync achievements for a single Steam game.
/// `game_id` is the Meteoric database game ID.
/// `app_id` is the Steam application ID (numeric).
pub async fn sync_achievements(game_id: &str, app_id: &str) -> Result<usize, String> {
    // Parse app_id to u32
    let app_id_u32: u32 = app_id
        .parse()
        .map_err(|_| format!("Invalid Steam app ID: {}", app_id))?;
    
    // Try to get credentials from memory first
    let apikey = APIKEY.lock().await;
    let steamid = STEAMID.lock().await;
    
    // If not set in memory, try to load from environment variables
    if apikey.is_empty() || steamid.is_empty() {
        drop(apikey);
        drop(steamid);
        
        match (env::var("STEAM_API_KEY"), env::var("STEAM_USER_ID")) {
            (Ok(api_key), Ok(user_id)) => {
                let mut apikey = APIKEY.lock().await;
                let mut steamid = STEAMID.lock().await;
                *apikey = api_key;
                *steamid = user_id;
                send_message_to_frontend("[STEAM-ACH] Loaded credentials from environment variables");
            }
            _ => {
                return Err(
                    "Steam credentials not set. Please import your Steam library first or set STEAM_API_KEY and STEAM_USER_ID in your .env file.".to_string()
                );
            }
        }
    } else {
        drop(apikey);
        drop(steamid);
    }
    
    // Re-acquire locks after dropping
    let apikey = APIKEY.lock().await;
    let steamid = STEAMID.lock().await;

    // Validate Steam ID is numeric
    let steam_id_u64: u64 = steamid.parse().map_err(|_| {
        format!("Invalid Steam ID '{}'. Must be a numeric Steam ID (SteamID64), not a username. Find yours at https://steamid.io/", steamid)
    })?;

    // Fetch achievement schema for the game using lenient API
    let achievements_schema = match steam_api_lenient::get_achievement_schema(&apikey, app_id_u32).await {
        Ok(schema) => schema,
        Err(e) => {
            let err_msg = format!("Failed to get achievement schema for game {}: {}", app_id, e);
            send_message_to_frontend(&format!("[STEAM-ACH] {}", err_msg));
            return Err(err_msg);
        }
    };
    
    if achievements_schema.is_empty() {
        send_message_to_frontend(&format!("[STEAM-ACH] No achievements found for app {}", app_id));
        return Ok(0);
    }
    
    let mut iachievements: Vec<ITrophy> = Vec::new();
    let mut api_name_map: std::collections::HashMap<String, usize> = std::collections::HashMap::new();

    for achievement in &achievements_schema {
        let api_name = achievement.name.clone().unwrap_or_default();
        let mut itrophy = ITrophy::new();
        itrophy.id = "-1".to_string();
        // Use display_name for the user-facing name (like Epic does)
        itrophy.name = achievement.display_name.clone().unwrap_or_else(|| api_name.clone());
        itrophy.description = achievement.description.clone().unwrap_or_default();
        itrophy.game_id = game_id.to_string();
        itrophy.importer_id = "steam".to_string();
        itrophy.visible = if achievement.hidden.unwrap_or(0) == 0 {
            "true".to_string()
        } else {
            "false".to_string()
        };
        itrophy.image_url_unlocked = achievement.icon.clone().unwrap_or_default();
        itrophy.image_url_locked = achievement.icon_gray.clone().unwrap_or_default();
        itrophy.date_of_unlock = String::new();
        itrophy.unlocked = "false".to_string();
        
        // Map API name to index for later matching
        api_name_map.insert(api_name, iachievements.len());
        iachievements.push(itrophy);
    }

    // Fetch player achievements and merge
    match steam_api_lenient::get_player_achievements(&apikey, steam_id_u64, app_id_u32).await {
        Ok(player_achievements) => {
            for player_achievement in player_achievements.iter() {
                if let Some(ref apiname) = player_achievement.apiname {
                    if let Some(&index) = api_name_map.get(apiname) {
                        let achievement = &mut iachievements[index];
                        achievement.unlocked = if player_achievement.achieved.unwrap_or(0) == 1 {
                            "true".to_string()
                        } else {
                            "false".to_string()
                        };
                        if let Some(unlocktime) = player_achievement.unlocktime {
                            achievement.date_of_unlock = unlocktime.to_string();
                        }
                    }
                }
            }
        }
        Err(e) => {
            send_message_to_frontend(&format!(
                "[STEAM-ACH] Could not fetch player achievements: {}",
                e
            ));
        }
    }

    if iachievements.is_empty() {
        return Ok(0);
    }

    let count = iachievements.len();
    let unlocked_count = iachievements.iter().filter(|t| t.unlocked == "true").count();

    let conn = establish_connection().unwrap();
    update_achievements(&conn, iachievements)
        .map_err(|e| format!("Failed to save achievements: {}", e))?;

    // Update the trophies count on the game row
    let sql = format!(
        "UPDATE games SET trophies = '{}', trophies_unlocked = '{}' WHERE id = '{}'",
        count, unlocked_count, game_id
    );
    let _ = conn.execute(&sql, []);

    send_message_to_frontend(&format!(
        "[STEAM-ACH] Synced {} achievements ({} unlocked) for app {}",
        count, unlocked_count, app_id
    ));

    Ok(count)
}

pub async fn set_credentials(creds: Vec<String>) {
    println!("[STEAM IMPORTER] Setting credentials - received {} items", creds.len());
    if creds.len() >= 2 {
        println!("[STEAM IMPORTER] Steam ID: '{}', API Key length: {}", creds[0], creds[1].len());
        
        // Validate Steam ID is numeric
        if creds[0].parse::<u64>().is_err() {
            eprintln!("[STEAM IMPORTER ERROR] Invalid Steam ID '{}'. Must be a numeric Steam ID (SteamID64), not a username.", creds[0]);
            eprintln!("[STEAM IMPORTER ERROR] Find your numeric Steam ID at https://steamid.io/");
            eprintln!("[STEAM IMPORTER ERROR] Example: 76561198012345678");
            return;
        }
    }
    let steam_id = creds[0].to_string();
    let api_key = creds[1].to_string();
    let mut steamid = STEAMID.lock().await;
    *steamid = steam_id;
    let mut apikey = APIKEY.lock().await;
    *apikey = api_key;
    println!("[STEAM IMPORTER] Credentials set successfully");
}

pub async fn get_games_from_user() -> Result<(), Box<dyn std::error::Error>> {
    get_games().await.expect("Failed to get games");
    Ok(())
}
