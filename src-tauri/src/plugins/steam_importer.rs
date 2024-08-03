use steam_rs::Steam;
use steam_rs::steam_id::SteamId;
use tokio::sync::Mutex;

use crate::database::establish_connection;
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
    let games = client
        .get_owned_games(steam_id, true, false, 0, false, Some(true), "EN", true)
        .await;
    for game in games.unwrap().games {
        println!("{:?}", game);
        let mut igame: IGame = IGame::new();
        igame.id = "-1".to_string();
        igame.name = game.name;
        igame.time_played = (game.playtime_forever / 60).to_string();
        igame.platforms = "steam".to_string();
        let conn = establish_connection().unwrap();
        update_game(&conn, igame)?;
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
