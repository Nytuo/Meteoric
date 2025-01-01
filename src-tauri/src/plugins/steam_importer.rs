use steam_rs::steam_id::SteamId;
use steam_rs::Steam;
use tokio::sync::Mutex;

use crate::database::insert_stat_db;
use crate::database::update_game;
use crate::database::{
    establish_connection, first_time_stat, update_achievements, update_game_nodup,
};
use crate::IGame;
use crate::ITrophy;

lazy_static::lazy_static! {
    static ref STEAMID: Mutex<String> = Mutex::new("".to_string());
    static ref APIKEY: Mutex<String> = Mutex::new("".to_string());
}

pub async fn get_games() -> Result<(), Box<dyn std::error::Error>> {
    println!("[STEAM IMPORTER] Starting Steam Importer");
    let apikey = APIKEY.lock().await;
    let steamid = STEAMID.lock().await;
    if apikey.is_empty() || steamid.is_empty() {
        println!("[STEAM IMPORTER] Credentials not set");
        return Ok(());
    }
    let client = Steam::new(&apikey);
    let steam_id = SteamId::new(steamid.parse()?);
    let games = client
        .get_owned_games(steam_id, true, false, 0, false, Some(true), "EN", true)
        .await;
    println!("[STEAM IMPORTER] Games collected from Steam");
    for game in games.clone().unwrap().games {
        let mut igame: IGame = IGame::new();
        igame.id = "-1".to_string();
        igame.name = game.name;
        igame.importer_id = "steam".to_string();
        igame.game_importer_id = game.appid.to_string();
        igame.platforms = "Steam".to_string();
        let conn = establish_connection().unwrap();
        let new_id = update_game_nodup(&conn, igame)?;
        first_time_stat(
            &conn,
            new_id,
            (game.playtime_forever / 60).to_string().clone(),
            chrono::Local::now()
                .format("%Y-%m-%d %H:%M:%S")
                .to_string()
                .clone(),
        )?;
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
                let player_achievements = trophies_player_stat.unwrap().achievements.unwrap();
                for achievement in iachievements.iter_mut() {
                    for player_achievement in player_achievements.iter() {
                        if achievement.name == player_achievement.clone().apiname.unwrap() {
                            achievement.unlocked = if player_achievement.clone().achieved == 1 {
                                "true".to_string()
                            } else {
                                "false".to_string()
                            };
                            achievement.date_of_unlock =
                                player_achievement.unlocktime.unwrap().to_string();
                        }
                    }
                }
                println!("[STEAM IMPORTER] ACHIEVEMENTS IMPORTED");
                let conn = establish_connection().unwrap();
                update_achievements(&conn, iachievements)?;
                println!("[STEAM IMPORTER] ACHIEVEMENTS UPDATED IN DB");
            }
            Err(e) => {
                println!("[STEAM IMPORTER] Error getting schema for game: {}", e);
            }
        }
    }
    println!("STEAM IMPORTER DONE");
    Ok(())
}

pub async fn set_credentials(creds: Vec<String>) {
    let steam_id = creds[0].to_string();
    let api_key = creds[1].to_string();
    let mut steamid = STEAMID.lock().await;
    *steamid = steam_id.to_string();
    let mut apikey = APIKEY.lock().await;
    *apikey = api_key.to_string();
}

pub async fn get_games_from_user() -> Result<(), Box<dyn std::error::Error>> {
    get_games().await.expect("Failed to get games");
    Ok(())
}
