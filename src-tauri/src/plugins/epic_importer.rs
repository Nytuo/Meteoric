use std::fs::File;
use std::io::Read;
use std::io::Write;

use directories::ProjectDirs;
use egs_api::EpicGames;
use tokio::sync::Mutex;

use crate::database::establish_connection;
use crate::database::update_game;
use crate::IGame;

lazy_static::lazy_static! {
    static ref AUTHCODE: Mutex<String> = Mutex::new("".to_string());
    static ref EPIC: Mutex<EpicGames> = Mutex::new(EpicGames::new());
}

pub async fn get_games() -> Result<(), Box<dyn std::error::Error>> {
    let authcode = AUTHCODE.lock().await;
    println!("arrived at GETGAMES {}", authcode);
    let mut client = EPIC.lock().await;

    let proj_dirs = ProjectDirs::from("fr", "Nytuo", "universe").unwrap();
    let file_path = proj_dirs.config_dir().join("epicDetails.txt");
    if authcode.is_empty() && file_path.exists() && file_path.metadata()?.len() > 0 {
        println!("RECOVERING");
        let mut file = File::open(&file_path)?;
        let mut contents = String::new();
        file.read_to_string(&mut contents)?;
        match serde_json::from_str::<egs_api::api::types::account::UserData>(&contents) {
            Ok(user_details) => {
                client.set_user_details(user_details);
            }
            Err(e) => {
                println!("Failed to deserialize JSON: {}", e); // Print error
            }
        }

        if client.login().await {
            println!("RECOVERED AND LOGGED IN");
        }
    }

    if !client.is_logged_in() && client.auth_code(None, Some(authcode.to_string())).await {
        println!("Logged In");
        let user_details = client.user_details();
        let mut file = File::create(file_path)?;
        let json = serde_json::to_string(&user_details)?;
        write!(file, "{}", json).expect("Unable to write to file");
        client.login().await;
    }

    let lib_items: Option<egs_api::api::types::library::Library> = client.library_items(true).await;
    let games = lib_items.unwrap().records;
    let mut parsed_games = Vec::new();
    for game in &games {
        let game_temp = game.clone().sandbox_name;
        if !game_temp.contains("UE Marketplace")
            && !game_temp.contains("Live")
            && !game_temp.contains("fab-listing-live")
        {
            parsed_games.push(game_temp);
        }
    }
    for game in &parsed_games {
        let mut igame: IGame = IGame::new();
        igame.id = "-1".to_string();
        igame.name = game.clone();
        igame.platforms = "Epic".to_string();
        let conn = establish_connection().unwrap();
        update_game(&conn, igame).expect("Failed to update game");
    }
    Ok(())
}

pub async fn set_credentials(creds: Vec<String>) {
    let authorization_code = creds[0].to_string();
    let mut authcode = AUTHCODE.lock().await;
    *authcode = authorization_code;
}

pub async fn get_games_from_user() -> Result<(), Box<dyn std::error::Error>> {
    get_games().await.expect("Failed to get games");
    Ok(())
}
