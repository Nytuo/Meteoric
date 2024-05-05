// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod database;
mod file_operations;
mod tauri_commander;

extern crate rusqlite;
extern crate directories;

use std::collections::HashMap;
use std::ffi::OsStr;
use std::sync::Arc;
use rusqlite::{params, Connection};
use directories::{BaseDirs, UserDirs, ProjectDirs};
use libloading::{Library, Symbol};
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

type GetApiVersion = extern "C" fn() -> u8;
type GetGames = extern "C" fn(&str) -> Result<Vec<String>, Box<dyn std::error::Error>>;

type GetToken = extern "C" fn(&str, &str) -> Result<String, Box<dyn std::error::Error>>;



struct VTableV0{
    get_info: Box<GetGames>,
    get_version: Box<GetApiVersion>,
    get_token: Box<GetToken>,
}

impl<'lib> VTableV0 {
    unsafe fn new(library: &Library) -> VTableV0 {
        println!("Loading API version 0...");
        println!("Library: {:?}", library);
        VTableV0 {
            get_info: Box::new(**library.get::<Symbol<GetGames>>(b"search_game_sync_wrapper\0").unwrap().into_raw()),
            get_version: Box::new(**library.get::<Symbol<GetApiVersion>>(b"get_api_version\0").unwrap().into_raw()),
            get_token: Box::new(**library.get::<Symbol<GetToken>>(b"calculate_igdb_token_sync_wrapper\0").unwrap().into_raw()),
        }
    }
}
struct Plugin {
    #[allow(dead_code)]
    library: Library,
    vtable: VTableV0,
}

impl Plugin {
    unsafe fn new(library_name: &OsStr) -> Plugin {
        let library = Library::new(library_name).unwrap();
        let get_api_version: Symbol<GetApiVersion> = library.get(b"get_api_version\0").unwrap();
        let vtable = match get_api_version() {
            145 => VTableV0::new(&library),
            _ => panic!("Unrecognized Rust API version number."),
        };

        Plugin {
            library,
            vtable,
        }
    }
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
    let conn = establish_connection().unwrap();
    let library_path: &OsStr = OsStr::new("uc_igdb.dll");
    println!("Loading plugin: {:?}", library_path);
    let plugin = unsafe { Plugin::new(library_path) };
    let games = (plugin.vtable.get_info)("Cyberpunk 2077");
    println!("Games: {:?}", games);
    println!("API version: {:?}", (plugin.vtable.get_version)());
    println!("Token: {:?}", (plugin.vtable.get_token)("ouhbo4ww6pkcmbthrh1y3uzsoghclw", "imuzybhck3fu1phngkggkovpm41ooc"));
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![get_all_videos_location, get_all_games, get_all_categories, get_games_by_category, get_all_images_location, upload_file, delete_element, post_game])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}