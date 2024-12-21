use steam_rs::steam_id::SteamId;
use steam_rs::Steam;
use tokio::sync::Mutex;

use crate::database::establish_connection;
use crate::database::insert_stat_db;
use crate::database::update_game;
use crate::IGame;

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
        igame.platforms = "Steam".to_string();
        let conn = establish_connection().unwrap();
        let new_id = update_game(&conn, igame)?;
        insert_stat_db(
            &conn,
            new_id,
            (game.playtime_forever / 60).to_string().clone(),
            chrono::Local::now()
                .format("%Y-%m-%d %H:%M:%S")
                .to_string()
                .clone(),
        )?;
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
