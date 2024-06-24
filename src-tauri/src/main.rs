// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

extern crate directories;
extern crate rusqlite;

use directories::ProjectDirs;
use serde::{Deserialize, Serialize};

use crate::plugins::steam_grid::{
    steamgrid_get_grid, steamgrid_get_hero, steamgrid_get_icon, steamgrid_get_logo,
};
use crate::tauri_commander::{
    delete_element, download_yt_audio, get_all_categories, get_all_fields_from_db, get_all_games,
    get_all_images_location, get_all_videos_location, get_games_by_category, post_game,
    save_media_to_external_storage, search_metadata, upload_csv_to_db, upload_file,
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
            "tags",
            "status",
            "time_played",
            "trophies",
            "trophies_unlocked",
            "last_time_played",
        ]
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

#[tokio::main]
async fn main() {
    initialize();
    let dotenv_file = ProjectDirs::from("fr", "Nytuo", "universe")
        .unwrap()
        .config_dir()
        .join("universe.env");
    dotenv::from_filename(dotenv_file).ok();
    tauri::Builder::default()
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
            upload_csv_to_db
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
