use std::fs::File;
use std::io::Read;
use std::io::Write;

use directories::ProjectDirs;
use gog::token::Token;
use gog::Gog;
use tokio::{sync::Mutex, task};

use crate::database::establish_connection;
use crate::database::update_game;
use crate::IGame;

lazy_static::lazy_static! {
    static ref TOKEN: Mutex<String> = Mutex::new("".to_string());
}

pub async fn get_games() -> Result<(), Box<dyn std::error::Error>> {
    let token = TOKEN.lock().await;
    task::block_in_place(move || {
        let proj_dirs = ProjectDirs::from("fr", "Nytuo", "Meteoric").unwrap();
        let file_path = proj_dirs.config_dir().join("gogDetails.txt");
        let parsed_token: Token;
        if token.is_empty() && file_path.exists() && file_path.metadata().unwrap().len() > 0 {
            println!("RECOVERING");
            let mut file = File::open(&file_path).unwrap();
            let mut contents = String::new();
            file.read_to_string(&mut contents).unwrap();
            match serde_json::from_str::<Token>(&contents) {
                Ok(user_details) => {
                    parsed_token = user_details;
                }
                Err(e) => {
                    println!("Failed to deserialize JSON: {}", e); // Print error
                    return;
                }
            }
        } else {
            parsed_token = Token::from_login_code(token.to_string()).unwrap();
            let mut file = File::create(file_path).unwrap();
            let json = serde_json::to_string(&parsed_token).unwrap();
            write!(file, "{}", json).expect("Unable to write to file");
        }

        let gog = Gog::new(parsed_token);
        let games = gog.get_games().unwrap();
        for game_id in games {
            let games_detailled = gog.get_game_details(game_id);
            match games_detailled {
                Ok(game) => {
                    let mut igame: IGame = IGame::new();
                    igame.id = "-1".to_string();
                    igame.name = game.title;
                    igame.release_date = game.release_timestamp.to_string();
                    let mut tags = Vec::new();
                    for tag in game.tags.clone() {
                        tags.push(tag.name);
                    }
                    igame.tags = tags.join(",");
                    igame.platforms = "GOG".to_string();
                    let conn = establish_connection().unwrap();
                    update_game(&conn, igame).expect("Failed to update game");
                }
                Err(_) => println!("failed to get game details"),
            }
        }
    });

    Ok(())
}

pub async fn set_credentials(creds: Vec<String>) {
    let token = creds[0].to_string();
    let mut tok = TOKEN.lock().await;
    *tok = token.to_string();
}

pub async fn get_games_from_user() -> Result<(), Box<dyn std::error::Error>> {
    get_games().await.expect("Failed to get games");
    Ok(())
}
