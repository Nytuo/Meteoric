use steam_rs::steam_id::SteamId;
use steam_rs::Steam;
use tokio::sync::Mutex;

use crate::database::{establish_connection, first_time_stat, update_achievements, update_game_nodup};
use crate::database::insert_stat_db;
use crate::database::update_game;
use crate::IGame;
use crate::ITrophy;

lazy_static::lazy_static! {
    static ref STEAMID: Mutex<String> = Mutex::new("".to_string());
    static ref APIKEY: Mutex<String> = Mutex::new("".to_string());
}

pub async fn get_games() -> Result<(), Box<dyn std::error::Error>> {
    let apikey = APIKEY.lock().await;
    let steamid = STEAMID.lock().await;
    let client = Steam::new(&apikey);
    let steam_id = SteamId::new(steamid.parse()?);
    let conn = establish_connection().unwrap();
    let games = client
        .get_owned_games(steam_id, true, false, 0, false, Some(true), "EN", true)
        .await;
    for game in games.unwrap().games {
        println!("{:?}", game);
        let mut igame: IGame = IGame::new();
        igame.id = "-1".to_string();
        igame.name = game.name;
        igame.importer_id = "steam".to_string();
        igame.game_importer_id = game.appid.to_string();
        igame.platforms = "Steam".to_string();

        let schema = client.get_schema_for_game(game.appid, Option::from("EN")).await;
        let schema = schema.unwrap();
        let achievements_schema = schema.available_game_stats.achievements;
        let mut iachievements: Vec<ITrophy> = Vec::new();
        for achievement in achievements_schema {
            let mut itrophy: ITrophy = ITrophy::new();
            itrophy.id = "-1".to_string();
            itrophy.name = achievement.display_name;
            itrophy.description = achievement.description;
            itrophy.game_id = game.appid.to_string();
            itrophy.importer_id = "steam".to_string();
            itrophy.visible = achievement.hidden == 0;
            itrophy.image_url_unlocked = achievement.icon;
            itrophy.image_url_locked = achievement.icon_gray;
            itrophy.date_of_unlock = "".to_string();
            itrophy.unlocked = false;
            iachievements.push(itrophy);
        }
        let  trophies_player_stat = client.get_player_achievements(steam_id, game.appid, Option::from("EN")).await;
        let player_achievements = trophies_player_stat.unwrap().achievements.unwrap();
        for achievement in iachievements.iter_mut() {
            for player_achievement in player_achievements.iter() {
                if achievement.name == player_achievement.clone().apiname.unwrap() {
                    achievement.unlocked = player_achievement.achieved == 1;
                    achievement.date_of_unlock = player_achievement.unlocktime.unwrap().to_string();
                }
            }
        }

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

        update_achievements(&conn, iachievements)?;
    }
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
