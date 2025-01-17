// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

extern crate directories;
extern crate rusqlite;

use std::collections::{HashMap, HashSet};
use std::env;
use std::sync::{Arc, Mutex};

use directories::ProjectDirs;
use serde::{Deserialize, Serialize};
use tauri::Emitter;

use database::{establish_connection, query_all_data};
use file_operations::have_no_metadata;
use plugins::{epic_importer, gog_importer, igdb, steam_importer};

use crate::plugins::steam_grid::{
    steamgrid_get_grid, steamgrid_get_hero, steamgrid_get_icon, steamgrid_get_logo,
};
use crate::tauri_commander::{
    add_game_to_category, create_category, delete_element, delete_game, download_yt_audio,
    export_game_database_to_archive, export_game_database_to_csv, get_achievements_for_game,
    get_all_categories, get_all_fields_from_db, get_all_games, get_all_images_location,
    get_all_videos_location, get_app_version, get_env_map, get_games_by_category, get_settings,
    import_library, kill_game, launch_game, open_data_folder, open_program_folder, post_game,
    remove_game_from_category, save_launch_video, save_media_to_external_storage, search_hltb,
    search_metadata, set_env_map, set_settings, startup_routine, upload_csv_to_db, upload_file,
};

mod database;
mod file_operations;
mod plugins;
mod tauri_commander;

#[derive(Serialize, Deserialize)]
struct ITrophy {
    id: String,
    game_id: String,
    name: String,
    description: String,
    visible: String,
    date_of_unlock: String,
    importer_id: String,
    image_url_locked: String,
    image_url_unlocked: String,
    unlocked: String,
}

impl ITrophy {
    fn new() -> ITrophy {
        ITrophy {
            id: String::new(),
            game_id: String::new(),
            name: String::new(),
            description: String::new(),
            visible: String::new(),
            date_of_unlock: String::new(),
            importer_id: String::new(),
            image_url_locked: String::new(),
            image_url_unlocked: String::new(),
            unlocked: String::new(),
        }
    }

    fn from_hashmap(hashmap: HashMap<String, String>) -> ITrophy {
        ITrophy {
            id: hashmap["id"].clone(),
            game_id: hashmap["game_id"].clone(),
            name: hashmap["name"].clone(),
            description: hashmap["description"].clone(),
            visible: hashmap["visible"].parse().unwrap(),
            date_of_unlock: hashmap["date_of_unlock"].clone(),
            importer_id: hashmap["importer_id"].clone(),
            image_url_locked: hashmap["image_url_locked"].clone(),
            image_url_unlocked: hashmap["image_url_unlocked"].clone(),
            unlocked: hashmap["unlocked"].parse().unwrap(),
        }
    }
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
struct IStats {
    id: String,
    game_id: String,
    time_played: String,
    date_of_play: String,
}

impl IStats {
    fn new() -> IStats {
        IStats {
            id: String::new(),
            game_id: String::new(),
            time_played: String::new(),
            date_of_play: String::new(),
        }
    }

    fn from_hashmap(hashmap: HashMap<String, String>) -> IStats {
        IStats {
            id: hashmap["id"].clone(),
            game_id: hashmap["game_id"].clone(),
            time_played: hashmap["time_played"].clone(),
            date_of_play: hashmap["date_of_play"].clone(),
        }
    }
}

#[derive(Serialize, Deserialize, Debug, Clone)]
struct IGame {
    id: String,
    game_importer_id: String,
    importer_id: String,
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
    trophies: String,
    trophies_unlocked: String,
    hidden: String,
}

impl IGame {
    pub fn field_names() -> Vec<&'static str> {
        vec![
            "id",
            "game_importer_id",
            "importer_id",
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
            "trophies",
            "trophies_unlocked",
            "hidden",
        ]
    }

    pub fn new() -> IGame {
        IGame {
            id: String::new(),
            game_importer_id: String::new(),
            importer_id: String::new(),
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
            trophies: String::new(),
            trophies_unlocked: String::new(),
            hidden: String::new(),
        }
    }

    pub fn is_empty(&self, field: &str) -> bool {
        match field {
            "id" => self.id == "",
            "game_importer_id" => self.game_importer_id == "",
            "importer_id" => self.importer_id == "",
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
            "trophies" => self.trophies == "",
            "trophies_unlocked" => self.trophies_unlocked == "",
            "hidden" => self.hidden == "",
            _ => false,
        }
    }

    pub fn from_hashmap(hashmap: HashMap<String, String>) -> IGame {
        IGame {
            id: hashmap["id"].clone(),
            game_importer_id: hashmap["game_importer_id"].clone(),
            importer_id: hashmap["importer_id"].clone(),
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
            trophies: hashmap["trophies"].clone(),
            trophies_unlocked: hashmap["trophies_unlocked"].clone(),
            hidden: hashmap["hidden"].clone(),
        }
    }

    pub fn get(&self, field: &str) -> Option<String> {
        match field {
            "id" => Some(self.id.clone()),
            "game_importer_id" => Some(self.game_importer_id.clone()),
            "importer_id" => Some(self.importer_id.clone()),
            "name" => Some(self.name.clone()),
            "sort_name" => Some(self.sort_name.clone()),
            "rating" => Some(self.rating.clone()),
            "platforms" => Some(self.platforms.clone()),
            "description" => Some(self.description.clone()),
            "critic_score" => Some(self.critic_score.clone()),
            "genres" => Some(self.genres.clone()),
            "styles" => Some(self.styles.clone()),
            "release_date" => Some(self.release_date.clone()),
            "developers" => Some(self.developers.clone()),
            "editors" => Some(self.editors.clone()),
            "game_dir" => Some(self.game_dir.clone()),
            "exec_file" => Some(self.exec_file.clone()),
            "exec_args" => Some(self.exec_args.clone()),
            "tags" => Some(self.tags.clone()),
            "status" => Some(self.status.clone()),
            "trophies" => Some(self.trophies.clone()),
            "trophies_unlocked" => Some(self.trophies_unlocked.clone()),
            "hidden" => Some(self.hidden.clone()),
            _ => None,
        }
    }

    fn check_if_game_has_minimum_requirements(&self) -> bool {
        let minimum_fields = vec![
            "name".to_string(),
            "description".to_string(),
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

fn initialize() {
    if let Some(proj_dirs) = ProjectDirs::from("fr", "Nytuo", "Meteoric") {
        proj_dirs.config_dir();
        if !proj_dirs.config_dir().exists() {
            std::fs::create_dir_all(proj_dirs.config_dir()).unwrap();
        }
        if !proj_dirs
            .config_dir()
            .join("meteoric_extra_content")
            .exists()
        {
            std::fs::create_dir_all(proj_dirs.config_dir().join("meteoric_extra_content")).unwrap();
        }
        create_basic_env_file();
        println!("Config dir: {:?}", proj_dirs.config_dir());
        println!("Data dir: {:?}", proj_dirs.data_dir());
        println!("Cache dir: {:?}", proj_dirs.cache_dir());
        println!("Runtime dir: {:?}", proj_dirs.runtime_dir());
        println!(
            "Extra content dir: {:?}",
            proj_dirs.config_dir().join("meteoric_extra_content")
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

pub async fn routine() {
    println!("[ROUTINE] Starting routine");
    let steam_api_key = env::var("STEAM_API_KEY").expect("[ROUTINE ERROR] STEAM_API_KEY not found");
    let steam_user_id = env::var("STEAM_USER_ID").expect("[ROUTINE ERROR] STEAM_USER_ID not found");
    let mut creds_temp = Vec::new();
    creds_temp.push(steam_user_id.clone());
    creds_temp.push(steam_api_key.clone());
    steam_importer::set_credentials(creds_temp).await;
    steam_importer::get_games_from_user()
        .await
        .expect("[ROUTINE ERROR] Steam Importer failed");
    epic_importer::get_games_from_user()
        .await
        .expect("[ROUTINE ERROR] Epic Importer failed");
    gog_importer::get_games_from_user()
        .await
        .expect("[ROUTINE ERROR] GOG Importer failed");

    populate_info();
    println!("[ROUTINE] Routine done");
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
    if games.len() == 0 {
        return;
    }
    send_message_to_frontend(&format!(
        "[Routine-INFO-3000]{} games need a metadata update",
        games.len()
    ));
    let client_id = env::var("IGDB_CLIENT_ID").expect("IGDB_CLIENT_ID not found");
    let client_secret = env::var("IGDB_CLIENT_SECRET").expect("IGDB_CLIENT_SECRET not found");
    igdb::set_credentials(Vec::from([client_id, client_secret]));
    tokio::spawn(async move {
        let mut rate_limiter = 0;
        for (index, game) in games.iter().enumerate() {
            rate_limiter += 1;
            if rate_limiter == 10 {
                std::thread::sleep(std::time::Duration::from_secs(5));
                rate_limiter = 0;
            }
            send_message_to_frontend(&format!(
                "[Routine-INFO-NL]Processing {}, {}/{}",
                game.name,
                index + 1,
                games.len()
            ));
            let _ = igdb::routine(game.clone().name, game.clone().id).await;
        }
    });
}

pub fn send_message_to_frontend(message: &str) {
    println!("Message to frontend: {}", message);
    if let Some(app_handle) = get_app_handle() {
        app_handle
            .emit("frontend-message", Some(message.to_string()))
            .expect("failed to send message to frontend");
    }
}

static APP_HANDLE: once_cell::sync::Lazy<Arc<Mutex<Option<tauri::AppHandle>>>> =
    once_cell::sync::Lazy::new(|| Arc::new(Mutex::new(None)));

fn store_app_handle(app_handle: tauri::AppHandle) {
    let mut handle = APP_HANDLE.lock().unwrap();
    *handle = Some(app_handle);
}

fn get_app_handle() -> Option<tauri::AppHandle> {
    let handle = APP_HANDLE.lock().unwrap();
    handle.clone()
}

fn create_basic_env_file() {
    let env_file = ProjectDirs::from("fr", "Nytuo", "Meteoric")
        .unwrap()
        .config_dir()
        .join("Meteoric.env");
    if !env_file.exists() {
        std::fs::write(
            env_file,
            "STEAM_API_KEY=\nEGS_CLIENT_ID=\nIGDB_CLIENT_SECRET=\nEGS_CLIENT_SECRET=\nIGDB_CLIENT_ID=\nSTEAMGRIDDB_API_KEY=\nSTEAM_USER_ID=\n",
        )
        .expect("Failed to create env file");
    }
}

#[tokio::main]
async fn main() {
    initialize();
    let dotenv_file = ProjectDirs::from("fr", "Nytuo", "Meteoric")
        .unwrap()
        .config_dir()
        .join("Meteoric.env");
    dotenv::from_filename(dotenv_file).ok();
    tauri::Builder::default()
        .plugin(tauri_plugin_os::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            store_app_handle(app.handle().clone());
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
            kill_game,
            add_game_to_category,
            remove_game_from_category,
            get_settings,
            set_settings,
            delete_game,
            export_game_database_to_csv,
            export_game_database_to_archive,
            get_env_map,
            set_env_map,
            search_hltb,
            get_app_version,
            open_program_folder,
            open_data_folder,
            save_launch_video,
            get_achievements_for_game
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
