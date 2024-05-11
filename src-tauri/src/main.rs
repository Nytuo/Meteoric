// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

extern crate directories;
extern crate rusqlite;

use std::ffi::OsStr;
use std::sync::Mutex;

use directories::ProjectDirs;
use serde::{Deserialize, Serialize};

use crate::database::establish_connection;
use crate::metadata_api::Plugin;
use crate::tauri_commander::{delete_element, download_yt_audio, get_all_categories, get_all_games, get_all_images_location, get_all_videos_location, get_available_metadata_api, get_games_by_category, insert_creds_by_user, post_game, save_media_to_external_storage, search_metadata_api, upload_file};

mod database;
mod file_operations;
mod tauri_commander;
mod metadata_api;

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

lazy_static::lazy_static! {
    static ref PLUGINS: Mutex<Vec<Plugin>> = Mutex::new(Vec::new());
    static ref PLUGINS_NAMES: Mutex<Vec<String>> = Mutex::new(Vec::new());
    static ref PLUGINS_INFO: Mutex<Vec<String>> = Mutex::new(Vec::new());
}


fn initialize() {
    if let Some(proj_dirs) = ProjectDirs::from("fr", "Nytuo", "universe") {
        proj_dirs.config_dir();
        if !proj_dirs.config_dir().exists() {
            std::fs::create_dir_all(proj_dirs.config_dir()).unwrap();
        }
        if !proj_dirs.config_dir().join("universe_extra_content").exists() {
            std::fs::create_dir_all(proj_dirs.config_dir().join("universe_extra_content")).unwrap();
        }
        println!("Config dir: {:?}", proj_dirs.config_dir());
        println!("Data dir: {:?}", proj_dirs.data_dir());
        println!("Cache dir: {:?}", proj_dirs.cache_dir());
        println!("Runtime dir: {:?}", proj_dirs.runtime_dir());
        println!("Extra content dir: {:?}", proj_dirs.config_dir().join("universe_extra_content"));
    }
}

#[tokio::main]
async fn main() {
    initialize();
    load_plugins();
    let conn = establish_connection().unwrap();
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![get_all_videos_location, get_all_games, get_all_categories, get_games_by_category, get_all_images_location, upload_file, delete_element, post_game,get_available_metadata_api,search_metadata_api,insert_creds_by_user,save_media_to_external_storage,download_yt_audio])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

fn load_plugins() {
    let mut plugins = PLUGINS.lock().unwrap();
    let mut plugins_names = PLUGINS_NAMES.lock().unwrap();
    let mut plugins_info = PLUGINS_INFO.lock().unwrap();
    let loaded_plugins = metadata_api::load_all_plugins();
    for plugin in loaded_plugins {
        plugins.push(plugin);
    }
    for plugin in &*plugins {
        let cargo = (plugin.vtable.get_cargo)();
        let name = cargo[0].clone();
        plugins_names.push(name);
        plugins_info.push(cargo.join(", "));
    }
    println!("Plugins: {:?}", plugins_names);
    println!("Plugins info: {:?}", plugins_info);
}