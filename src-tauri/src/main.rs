// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod database;
mod file_operations;
mod tauri_commander;

extern crate rusqlite;
extern crate directories;

use std::collections::HashMap;
use rusqlite::{params, Connection, Result};
use directories::{BaseDirs, UserDirs, ProjectDirs};
use tauri::async_runtime::TokioHandle;
use serde::{Deserialize, Serialize};
use crate::database::establish_connection;
use crate::tauri_commander::{get_all_videos_location, get_all_games, get_all_categories, get_games_by_category, get_all_images_location, upload_file, delete_element, post_game};


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

#[derive(Serialize, Deserialize, Debug)]
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

fn main() {
    initialize();
    let conn = establish_connection().unwrap();
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![get_all_videos_location,get_all_games,get_all_categories,get_games_by_category,get_all_images_location,upload_file,delete_element,post_game])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}