// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

extern crate directories;
extern crate rusqlite;

use database::{establish_connection, query_all_data};
use directories::ProjectDirs;
use file_operations::{have_no_metadata, is_folder_empty_recursive};
use lazy_static::lazy_static;
use plugins::igdb;
use serde::{Deserialize, Serialize};
use std::collections::{HashMap, HashSet};
use std::path::Path;
use std::sync::{Arc, Mutex};
use std::{env, fs};
use tauri::{AppHandle, Manager, State, Window};
use tokio::process::Child;

use crate::plugins::steam_grid::{
    steamgrid_get_grid, steamgrid_get_hero, steamgrid_get_icon, steamgrid_get_logo,
};
use crate::tauri_commander::{
    create_category, delete_element, download_yt_audio, get_all_categories, get_all_fields_from_db,
    get_all_games, get_all_images_location, get_all_videos_location, get_games_by_category,
    import_library, kill_game, launch_game, post_game, save_media_to_external_storage,
    search_metadata, startup_routine, upload_csv_to_db, upload_file,
};

mod database;
mod file_operations;
mod plugins;
mod tauri_commander;

#[derive(Serialize, Deserialize)]
struct ITrophy {
    id: String,
    name: String,
    description: String,
    icon: String,
    game_id: String,
    status: String,
    date_obtained: String,
    platform: String,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
struct Metadata {
    jaquette: Option<String>,
    background: Option<String>,
    logo: Option<String>,
    icon: Option<String>,
    audio: Option<String>,
    screenshots: Option<Vec<String>>,
    videos: Option<Vec<String>>,
}

impl Metadata {
    fn new() -> Metadata {
        Metadata {
            jaquette: None,
            background: None,
            logo: None,
            icon: None,
            audio: None,
            screenshots: None,
            videos: None,
        }
    }
}

#[derive(Serialize, Deserialize, Debug, Clone)]
struct IGame {
    id: String,
    name: String,
    sort_name: String,
    rating: String,
    platforms: String,
    description: String,
    critic_score: String,
    genres: String,
    styles: String,
    release_date: String,
    developers: String,
    editors: String,
    game_dir: String,
    exec_file: String,
    exec_args: String,
    tags: String,
    status: String,
    time_played: String,
    trophies: String,
    trophies_unlocked: String,
    last_time_played: String,
}

impl IGame {
    pub fn field_names() -> Vec<&'static str> {
        vec![
            "id",
            "name",
            "sort_name",
            "rating",
            "platforms",
            "description",
            "critic_score",
            "genres",
            "styles",
            "release_date",
            "developers",
            "editors",
            "game_dir",
            "exec_file",
            "exec_args",
            "tags",
            "status",
            "time_played",
            "trophies",
            "trophies_unlocked",
            "last_time_played",
        ]
    }

    pub fn new() -> IGame {
        IGame {
            id: String::new(),
            name: String::new(),
            sort_name: String::new(),
            rating: String::new(),
            platforms: String::new(),
            description: String::new(),
            critic_score: String::new(),
            genres: String::new(),
            styles: String::new(),
            release_date: String::new(),
            developers: String::new(),
            editors: String::new(),
            game_dir: String::new(),
            exec_file: String::new(),
            exec_args: String::new(),
            tags: String::new(),
            status: String::new(),
            time_played: String::new(),
            trophies: String::new(),
            trophies_unlocked: String::new(),
            last_time_played: String::new(),
        }
    }

    pub fn is_empty(&self, field: &str) -> bool {
        match field {
            "id" => self.id == "",
            "name" => self.name == "",
            "sort_name" => self.sort_name == "",
            "rating" => self.rating == "",
            "platforms" => self.platforms == "",
            "description" => self.description == "",
            "critic_score" => self.critic_score == "",
            "genres" => self.genres == "",
            "styles" => self.styles == "",
            "release_date" => self.release_date == "",
            "developers" => self.developers == "",
            "editors" => self.editors == "",
            "game_dir" => self.game_dir == "",
            "exec_file" => self.exec_file == "",
            "exec_args" => self.exec_args == "",
            "tags" => self.tags == "",
            "status" => self.status == "",
            "time_played" => self.time_played == "",
            "trophies" => self.trophies == "",
            "trophies_unlocked" => self.trophies_unlocked == "",
            "last_time_played" => self.last_time_played == "",
            _ => false,
        }
    }

    pub fn from_hashmap(hashmap: HashMap<String, String>) -> IGame {
        IGame {
            id: hashmap["id"].clone(),
            name: hashmap["name"].clone(),
            sort_name: hashmap["sort_name"].clone(),
            rating: hashmap["rating"].clone(),
            platforms: hashmap["platforms"].clone(),
            description: hashmap["description"].clone(),
            critic_score: hashmap["critic_score"].clone(),
            genres: hashmap["genres"].clone(),
            styles: hashmap["styles"].clone(),
            release_date: hashmap["release_date"].clone(),
            developers: hashmap["developers"].clone(),
            editors: hashmap["editors"].clone(),
            game_dir: hashmap["game_dir"].clone(),
            exec_file: hashmap["exec_file"].clone(),
            exec_args: hashmap["exec_args"].clone(),
            tags: hashmap["tags"].clone(),
            status: hashmap["status"].clone(),
            time_played: hashmap["time_played"].clone(),
            trophies: hashmap["trophies"].clone(),
            trophies_unlocked: hashmap["trophies_unlocked"].clone(),
            last_time_played: hashmap["last_time_played"].clone(),
        }
    }

    pub fn get(&self, field: &str) -> Option<&String> {
        match field {
            "id" => return Some(&self.id),
            "name" => return Some(&self.name),
            "sort_name" => return Some(&self.sort_name),
            "rating" => return Some(&self.rating),
            "platforms" => return Some(&self.platforms),
            "description" => return Some(&self.description),
            "critic_score" => return Some(&self.critic_score),
            "genres" => return Some(&self.genres),
            "styles" => return Some(&self.styles),
            "release_date" => return Some(&self.release_date),
            "developers" => return Some(&self.developers),
            "editors" => return Some(&self.editors),
            "game_dir" => return Some(&self.game_dir),
            "exec_file" => return Some(&self.exec_file),
            "exec_args" => return Some(&self.exec_args),
            "tags" => return Some(&self.tags),
            "status" => return Some(&self.status),
            "time_played" => return Some(&self.time_played),
            "trophies" => return Some(&self.trophies),
            "trophies_unlocked" => return Some(&self.trophies_unlocked),
            "last_time_played" => return Some(&self.last_time_played),
            _ => (),
        }
        None
    }

    fn check_if_game_has_minimum_requirements(&self) -> bool {
        let minimum_fields = vec![
            "name".to_string(),
            "description".to_string(),
            "genres".to_string(),
            "release_date".to_string(),
        ];
        for field in &minimum_fields {
            if self.is_empty(field) {
                return false;
            }
        }
        true
    }
}

pub fn send_message_to_frontend(message: &str) {
    println!("Message to frontend: {}", message);
    let handle = APP_HANDLE.lock().unwrap();
    if let Some(app_handle) = handle.as_ref() {
        let state: State<AppState> = app_handle.state();
        let window = &state.main_window;
        window.emit("frontend-message", message).unwrap();
    }
}

fn initialize() {
    if let Some(proj_dirs) = ProjectDirs::from("fr", "Nytuo", "universe") {
        proj_dirs.config_dir();
        if !proj_dirs.config_dir().exists() {
            std::fs::create_dir_all(proj_dirs.config_dir()).unwrap();
        }
        if !proj_dirs
            .config_dir()
            .join("universe_extra_content")
            .exists()
        {
            std::fs::create_dir_all(proj_dirs.config_dir().join("universe_extra_content")).unwrap();
        }
        println!("Config dir: {:?}", proj_dirs.config_dir());
        println!("Data dir: {:?}", proj_dirs.data_dir());
        println!("Cache dir: {:?}", proj_dirs.cache_dir());
        println!("Runtime dir: {:?}", proj_dirs.runtime_dir());
        println!(
            "Extra content dir: {:?}",
            proj_dirs.config_dir().join("universe_extra_content")
        );
    }
}

fn to_title_case(s: &str) -> String {
    let exceptions: HashSet<&str> = vec![
        "of", "at", "and", "but", "or", "for", "nor", "on", "in", "with",
    ]
    .into_iter()
    .collect();

    s.split_whitespace()
        .enumerate()
        .map(|(i, word)| {
            if exceptions.contains(word) && i != 0 {
                word.to_lowercase()
            } else {
                let mut chars = word.chars();
                match chars.next() {
                    None => String::new(),
                    Some(first) => {
                        first.to_uppercase().collect::<String>() + &chars.as_str().to_lowercase()
                    }
                }
            }
        })
        .collect::<Vec<_>>()
        .join(" ")
}

pub fn routine() {
    populate_info();
}

fn hash2_games(games: Vec<HashMap<String, String>>) -> Vec<IGame> {
    let mut games_v: Vec<IGame> = Vec::new();
    for game in games {
        let game = IGame::from_hashmap(game);
        games_v.push(game)
    }
    games_v
}

fn populate_info() {
    let conn = establish_connection().unwrap();
    let all_games = hash2_games(query_all_data(&conn, "games").unwrap());
    let games = have_no_metadata(all_games);
    if games.len() > 0 {
        send_message_to_frontend(&format!("ROUTINE_IGDB_TOTAL: {}", games.len()));
    } else {
        send_message_to_frontend("ROUTINE_IGDB_TOTAL: -1");
        return;
    }
    let client_id = env::var("IGDB_CLIENT_ID").expect("IGDB_CLIENT_ID not found");
    let client_secret = env::var("IGDB_CLIENT_SECRET").expect("IGDB_CLIENT_SECRET not found");
    igdb::set_credentials(Vec::from([client_id, client_secret]));
    for (index, game) in games.iter().enumerate() {
        send_message_to_frontend(&format!("ROUTINE_IGDB_STATUS: {}", index));
        send_message_to_frontend(&format!("ROUTINE_IGDB_NAME: {}", game.name));
        let _ = igdb::routine(game.clone().name, game.clone().id);
    }
}

// TODO Process watcher to send a message to front end in case a game process has stopped

struct AppState {
    main_window: Window,
}

lazy_static! {
    static ref APP_HANDLE: Mutex<Option<AppHandle>> = Mutex::new(None);
}

#[tokio::main]
async fn main() {
    initialize();
    let dotenv_file = ProjectDirs::from("fr", "Nytuo", "universe")
        .unwrap()
        .config_dir()
        .join("universe.env");
    dotenv::from_filename(dotenv_file).ok();
    tauri::Builder::default()
        .setup(|app| {
            let main_window = app.get_window("main").unwrap();
            app.manage(AppState {
                main_window: main_window.clone(),
            });

            let mut handle = APP_HANDLE.lock().unwrap();
            *handle = Some(app.handle());

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            get_all_videos_location,
            get_all_games,
            get_all_categories,
            get_games_by_category,
            get_all_images_location,
            upload_file,
            delete_element,
            post_game,
            search_metadata,
            save_media_to_external_storage,
            download_yt_audio,
            steamgrid_get_grid,
            steamgrid_get_hero,
            steamgrid_get_logo,
            steamgrid_get_icon,
            get_all_fields_from_db,
            upload_csv_to_db,
            import_library,
            create_category,
            startup_routine,
            launch_game,
            kill_game
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
