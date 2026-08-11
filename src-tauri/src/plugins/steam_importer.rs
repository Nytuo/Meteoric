use std::env;
use steam_rs::steam_id::SteamId;
use steam_rs::Steam;
use tokio::sync::Mutex;

use crate::database::{
    apply_incoming_metadata_if_preferred, establish_connection, first_time_stat,
    update_achievements, update_game_nodup,
};
use crate::plugins::steam_api_lenient;
use crate::{send_import_progress, send_message_to_frontend, IGame, ITrophy};

lazy_static::lazy_static! {
    static ref STEAMID: Mutex<String> = Mutex::new("".to_string());
    static ref APIKEY: Mutex<String> = Mutex::new("".to_string());
}

pub async fn get_games() -> Result<(), Box<dyn std::error::Error>> {
    println!("[STEAM IMPORTER] Starting Steam Importer");
    let apikey = APIKEY.lock().await;
    let steamid = STEAMID.lock().await;
    println!(
        "[STEAM IMPORTER] API Key length: {}, Steam ID length: {}",
        apikey.len(),
        steamid.len()
    );
    if apikey.is_empty() || steamid.is_empty() {
        println!(
            "[STEAM IMPORTER] Credentials not set (apikey empty: {}, steamid empty: {})",
            apikey.is_empty(),
            steamid.is_empty()
        );
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

    let last_played = steam_api_lenient::get_last_played_map(&apikey, steam_id_u64)
        .await
        .unwrap_or_default();

    drop(apikey);
    drop(steamid);

    let total_games = games.as_ref().map(|g| g.games.len()).unwrap_or(0);
    let mut processed = 0usize;

    let mut synced: Vec<(String, u32, String)> = Vec::with_capacity(total_games);
    for game in games.unwrap().games {
        processed += 1;
        send_import_progress(
            "steam",
            processed,
            total_games,
            &format!("Importing library: {}", game.name),
        );

        let mut igame: IGame = IGame::new();
        igame.id = "-1".to_string();
        igame.name = game.name.clone();
        igame.importer_id = "steam".to_string();
        igame.game_importer_id = game.appid.to_string();
        igame.platforms = "Steam".to_string();
        let conn = establish_connection().unwrap();
        let new_id = update_game_nodup(&conn, igame)?;
        if let Err(e) = apply_incoming_metadata_if_preferred(&conn, &new_id, &game.name, "", "") {
            println!("[STEAM IMPORTER] Failed to apply merge-preferred metadata: {}", e);
        }

        if game.playtime_forever > 0 {
            let playtime_ms = (game.playtime_forever * 60 * 1000).to_string();

            let date_of_play = match last_played.get(&game.appid) {
                Some(ts) => chrono::DateTime::from_timestamp(*ts, 0)
                    .map(|d| d.format("%Y-%m-%d %H:%M:%S").to_string())
                    .unwrap_or_else(|| "1970-01-01 00:00:00".to_string()),
                None => "1970-01-01 00:00:00".to_string(),
            };

            println!(
                "[STEAM IMPORTER] Game: {} - Playtime: {} min ({} ms)",
                game.name, game.playtime_forever, playtime_ms
            );

            first_time_stat(&conn, new_id.clone(), playtime_ms, date_of_play)?;
        }

        synced.push((new_id, game.appid, game.name));
    }
    println!("[STEAM IMPORTER] BASIC GAME DATA IMPORTED");

    let mut rate_limiter_requests = 0;
    let mut ach_processed = 0usize;
    for (new_id, appid, name) in &synced {
        ach_processed += 1;
        send_import_progress(
            "steam",
            ach_processed,
            total_games,
            &format!("Syncing achievements: {}", name),
        );

        rate_limiter_requests += 1;
        if rate_limiter_requests >= 10 {
            println!("[STEAM IMPORTER] Rate limiter reached, waiting 10 seconds");
            tokio::time::sleep(tokio::time::Duration::from_secs(10)).await;
            rate_limiter_requests = 0;
        }
        if let Err(e) = sync_achievements_silent(new_id, &appid.to_string()).await {
            println!(
                "[STEAM IMPORTER] Could not sync achievements for {} ({}): {}",
                name, appid, e
            );
        }
    }

    println!("STEAM IMPORTER DONE");
    send_message_to_frontend("[IMPORT-DONE]steam");
    Ok(())
}

pub async fn sync_achievements(game_id: &str, app_id: &str) -> Result<usize, String> {
    sync_achievements_inner(game_id, app_id, true).await
}

pub async fn sync_achievements_silent(game_id: &str, app_id: &str) -> Result<usize, String> {
    sync_achievements_inner(game_id, app_id, false).await
}

async fn sync_achievements_inner(
    game_id: &str,
    app_id: &str,
    notify: bool,
) -> Result<usize, String> {
    let app_id_u32: u32 = app_id
        .parse()
        .map_err(|_| format!("Invalid Steam app ID: {}", app_id))?;

    let apikey = APIKEY.lock().await;
    let steamid = STEAMID.lock().await;

    if apikey.is_empty() || steamid.is_empty() {
        drop(apikey);
        drop(steamid);

        match (env::var("STEAM_API_KEY"), env::var("STEAM_USER_ID")) {
            (Ok(api_key), Ok(user_id)) => {
                let mut apikey = APIKEY.lock().await;
                let mut steamid = STEAMID.lock().await;
                *apikey = api_key;
                *steamid = user_id;
                if notify {
                    send_message_to_frontend(
                        "[STEAM-ACH] Loaded credentials from environment variables",
                    );
                }
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

    let apikey = APIKEY.lock().await;
    let steamid = STEAMID.lock().await;

    let steam_id_u64: u64 = steamid.parse().map_err(|_| {
        format!("Invalid Steam ID '{}'. Must be a numeric Steam ID (SteamID64), not a username. Find yours at https://steamid.io/", steamid)
    })?;

    let achievements_schema =
        match steam_api_lenient::get_achievement_schema(&apikey, app_id_u32).await {
            Ok(schema) => schema,
            Err(e) => {
                let err_msg = format!(
                    "Failed to get achievement schema for game {}: {}",
                    app_id, e
                );
                if notify {
                    send_message_to_frontend(&format!("[STEAM-ACH] {}", err_msg));
                }
                return Err(err_msg);
            }
        };

    if achievements_schema.is_empty() {
        if notify {
            send_message_to_frontend(&format!(
                "[STEAM-ACH] No achievements found for app {}",
                app_id
            ));
        }
        return Ok(0);
    }

    let mut iachievements: Vec<ITrophy> = Vec::new();
    let mut api_name_map: std::collections::HashMap<String, usize> =
        std::collections::HashMap::new();

    for achievement in &achievements_schema {
        let api_name = achievement.name.clone().unwrap_or_default();
        let mut itrophy = ITrophy::new();
        itrophy.id = "-1".to_string();

        itrophy.name = achievement
            .display_name
            .clone()
            .unwrap_or_else(|| api_name.clone());
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

        api_name_map.insert(api_name, iachievements.len());
        iachievements.push(itrophy);
    }

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
            if notify {
                send_message_to_frontend(&format!(
                    "[STEAM-ACH] Could not fetch player achievements: {}",
                    e
                ));
            }
        }
    }

    if iachievements.is_empty() {
        return Ok(0);
    }

    let count = iachievements.len();
    let unlocked_count = iachievements
        .iter()
        .filter(|t| t.unlocked == "true")
        .count();

    let conn = establish_connection().unwrap();
    update_achievements(&conn, iachievements)
        .map_err(|e| format!("Failed to save achievements: {}", e))?;

    let sql = format!(
        "UPDATE games SET trophies = '{}', trophies_unlocked = '{}' WHERE id = '{}'",
        count, unlocked_count, game_id
    );
    let _ = conn.execute(&sql, []);

    if notify {
        send_message_to_frontend(&format!(
            "[STEAM-ACH] Synced {} achievements ({} unlocked) for app {}",
            count, unlocked_count, app_id
        ));
    }

    Ok(count)
}

pub async fn set_credentials(creds: Vec<String>) {
    println!(
        "[STEAM IMPORTER] Setting credentials - received {} items",
        creds.len()
    );
    if creds.len() >= 2 {
        println!(
            "[STEAM IMPORTER] Steam ID: '{}', API Key length: {}",
            creds[0],
            creds[1].len()
        );

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
