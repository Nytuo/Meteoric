// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

extern crate rusqlite;
extern crate directories;

use std::collections::HashMap;
use rusqlite::{params, Connection, Result};
use directories::{BaseDirs, UserDirs, ProjectDirs};
use tauri::async_runtime::TokioHandle;


// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
#[tauri::command]
fn get_all_games() -> String {
    let conn = establish_connection().unwrap();
    let games = query_all_data(&conn, "games").unwrap()
        .iter()
        .map(|row| {
            format!("{:?}", row)
        })
        .collect::<Vec<String>>()
        .join(",");
    format!("[{}]", games)
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

fn establish_connection() -> Result<Connection> {
    let proj_dirs = ProjectDirs::from("fr", "Nytuo", "universe").unwrap();
    let db_path = proj_dirs.config_dir().join("universe.db");
    let conn = Connection::open(db_path)?;
    create_default_tables(&conn)?;
    Ok(conn)
}

fn create_default_tables(conn: &Connection) -> Result<()> {
    conn.execute(
        "CREATE TABLE IF NOT EXISTS games (
                 id             INTEGER PRIMARY KEY,
                 nom            TEXT NOT NULL,
                 nomTri        TEXT NOT NULL,
                 jaquette    TEXT NOT NULL,
                 background TEXT NOT NULL,
                 logo TEXT NOT NULL,
                 icon TEXT NOT NULL,
                 rating TEXT NOT NULL,
                 platforms TEXT NOT NULL,
                 description TEXT NOT NULL,
                 critic_score TEXT NOT NULL,
                 genres TEXT NOT NULL,
                 styles TEXT NOT NULL,
                 release_date TEXT NOT NULL,
                 developers TEXT NOT NULL,
                 editors TEXT NOT NULL,
                 videos TEXT NOT NULL,
                 images TEXT NOT NULL,
                 game_dir TEXT NOT NULL,
                 exec_file TEXT NOT NULL,
                 tags TEXT NOT NULL
                  )",
        [],
    )?;

    conn.execute(
        "CREATE TABLE IF NOT EXISTS universe (
                  id              INTEGER PRIMARY KEY,
                  name            TEXT NOT NULL,
                  games           TEXT NOT NULL
                  )",
        [],
    )?;
    Ok(())
}

fn insert_data(conn: &Connection, id: i32, name: &str) -> Result<()> {
    conn.execute(
        "INSERT INTO user (id, name) VALUES (?1, ?2)",
        params![id, name],
    )?;
    Ok(())
}

fn query_all_data(conn: &Connection, table: &str) -> std::result::Result<Vec<HashMap<String, String>>, rusqlite::Error> {
    let mut stmt = conn.prepare(&format!("SELECT * FROM {}", table))?;
    let col_count = stmt.column_count();
    let col_names = stmt.column_names().into_iter().map(|s| s.to_string()).collect::<Vec<String>>();

    let rows = stmt.query_map([], |row| {
        let mut map = HashMap::new();
        for i in 0..col_count {
            let value: String = row.get(i).unwrap_or_default();
            let name = col_names[i].clone();
            map.insert(name, value);
        }
        Ok(map)
    })?;

    let mut result = Vec::new();
    for row in rows {
        result.push(row.unwrap());
    }
    Ok(result)
}

fn main() {
    initialize();
    let conn = establish_connection().unwrap();
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![get_all_games])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}