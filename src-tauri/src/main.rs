// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

extern crate rusqlite;
extern crate directories;

use std::collections::HashMap;
use rusqlite::{params, Connection, Result};
use directories::{BaseDirs, UserDirs, ProjectDirs};
use tauri::async_runtime::TokioHandle;
use serde::{Deserialize, Serialize};


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

#[tauri::command]
fn get_all_categories() -> String {
    let conn = establish_connection().unwrap();
    let category = query_all_data(&conn, "universe").unwrap()
        .iter()
        .map(|row| {
            format!("{:?}", row)
        })
        .collect::<Vec<String>>()
        .join(",");
    format!("[{}]", category)
}

#[tauri::command]
fn get_all_images_location(game_name: String) -> String {
    let proj_dirs = ProjectDirs::from("fr", "Nytuo", "universe").unwrap();
    let extra_content_dir = proj_dirs.config_dir().join("universe_extra_content");
    let game_dir = extra_content_dir.join(game_name).join("screenshots");
    let images = match std::fs::read_dir(&game_dir) {
        Ok(entries) => {
            dbg!(entries
                .filter_map(|entry| entry.ok())
                .map(|entry| format!("\"{}\"", entry.path().to_str().unwrap()).replace(extra_content_dir.to_str().unwrap(), "").replace("\\", "/")))
                .collect::<Vec<String>>().join(",")
        },
        Err(_) => {
            eprintln!("Directory not found: {:?}", game_dir);
            String::new()
        },
    };
    format!("[{}]", images)
}

#[tauri::command]
fn get_all_videos_location(game_name: String) -> String {
    let proj_dirs = ProjectDirs::from("fr", "Nytuo", "universe").unwrap();
    let extra_content_dir = proj_dirs.config_dir().join("universe_extra_content");
    let game_dir = extra_content_dir.join(game_name).join("videos");
    let videos = match std::fs::read_dir(&game_dir) {
        Ok(entries) => {
            dbg!(entries
                .filter_map(|entry| entry.ok())
                .map(|entry| format!("\"{}\"", entry.path().to_str().unwrap()).replace(extra_content_dir.to_str().unwrap(), "").replace("\\", "/")))
                .collect::<Vec<String>>().join(",")
        },
        Err(_) => {
            eprintln!("Directory not found: {:?}", game_dir);
            String::new()
        },
    };
    format!("[{}]", videos)
}

#[tauri::command]
fn upload_file(file_content: Vec<u8>, type_of: String, game_name: String) -> Result<(), String> {
    let mut game_name = game_name;
    println!("Type of: {}", type_of);
    println!("Game name: {}", game_name);
    if game_name.is_empty() {
        return Err("Game name is empty".to_string());
    }
    if type_of.is_empty() {
        return Err("Type of is empty".to_string());
    }
    if file_content.is_empty() {
        return Err("File content is empty".to_string());
    }
    if file_content.len() > 100000000 {
        return Err("File content is too big".to_string());
    }
    if type_of != "screenshot" && type_of != "video" && type_of != "audio" && type_of != "background" && type_of != "jaquette" && type_of != "logo" && type_of != "icon" {
        return Err("Type of is not valid".to_string());
    }
    if game_name.contains("/") || game_name.contains("\\") {
        return Err("Game name is not valid".to_string());
    }
    if game_name.contains(" ") {
        game_name = game_name.replace(" ", "_");
        game_name = game_name.replace(":", "_");
        game_name = game_name.to_lowercase();
    }
    let proj_dirs = ProjectDirs::from("fr", "Nytuo", "universe").unwrap();
    let extra_content_dir = proj_dirs.config_dir().join("universe_extra_content");
    let game_dir = extra_content_dir.join(game_name);
    if !game_dir.exists() {
        std::fs::create_dir_all(&game_dir).unwrap();
    }
    let get_nb_of_screenshots = std::fs::read_dir(&game_dir.join("screenshots")).unwrap().count() + 1;
    let get_nb_of_videos = std::fs::read_dir(&game_dir.join("videos")).unwrap().count() + 1;
    println!("Number of screenshots: {}", get_nb_of_screenshots);
    println!("Number of videos: {}", get_nb_of_videos);
    let file_path = match type_of.as_str() {
        "screenshot" => game_dir.join("screenshots").join("screenshot-".to_string() + &get_nb_of_screenshots.to_string() + ".jpg"),
        "video" => game_dir.join("videos").join("video-".to_string() + &get_nb_of_videos.to_string() + ".mp4"),
        "audio" => game_dir.join("music").join("theme.mp3"),
        "background" => game_dir.join("background.jpg"),
        "jaquette" => game_dir.join("jaquette.jpg"),
        "logo" => game_dir.join("logo.png"),
        "icon" => game_dir.join("icon.png"),
        _ => game_dir,
    };

    println!("File path: {:?}", file_path);

    if let Err(e) = std::fs::write(&file_path, &file_content) {
        return Err(format!("Error writing file: {:?}", e));
    }
    Ok(())
}

#[tauri::command]
fn delete_element(type_of: String, game_name: String, element_name: String) -> Result<(), String> {
    let mut game_name = game_name;
    println!("Type of: {}", type_of);
    println!("Game name: {}", game_name);
    println!("Element name: {}", element_name);
    if game_name.is_empty() {
        return Err("Game name is empty".to_string());
    }
    if type_of.is_empty() {
        return Err("Type of is empty".to_string());
    }
    if type_of != "screenshot" && type_of != "video" && type_of != "audio" && type_of != "background" && type_of != "jaquette" && type_of != "logo" && type_of != "icon" {
        return Err("Type of is not valid".to_string());
    }
    if game_name.contains("/") || game_name.contains("\\") {
        return Err("Game name is not valid".to_string());
    }
    if game_name.contains(" ") {
        game_name = game_name.replace(" ", "_");
        game_name = game_name.replace(":", "_");
        game_name = game_name.to_lowercase();
    }
    let proj_dirs = ProjectDirs::from("fr", "Nytuo", "universe").unwrap();
    let extra_content_dir = proj_dirs.config_dir().join("universe_extra_content");
    let game_dir = extra_content_dir.join(game_name);
    if !game_dir.exists() {
        std::fs::create_dir_all(&game_dir).unwrap();
    }
    let get_nb_of_screenshots = std::fs::read_dir(&game_dir.join("screenshots")).unwrap().count();
    let get_nb_of_videos = std::fs::read_dir(&game_dir.join("videos")).unwrap().count();
    println!("Number of screenshots: {}", get_nb_of_screenshots);
    println!("Number of videos: {}", get_nb_of_videos);
    let file_path = match type_of.as_str() {
        "screenshot" => game_dir.join("screenshots").join("screenshot-".to_string() + &get_nb_of_screenshots.to_string() + ".jpg"),
        "video" => game_dir.join("videos").join("video-".to_string() + &get_nb_of_videos.to_string() + ".mp4"),
        "audio" => game_dir.join("music").join("theme.mp3"),
        _ => game_dir,
    };

    println!("File path: {:?}", file_path);

    if !file_path.exists() {
        return Err("File does not exist".to_string());
    }

    if let Err(e) = std::fs::remove_file(&file_path) {
        return Err(format!("Error deleting file: {:?}", e));
    }

    Ok(())
}

#[tauri::command]
fn get_games_by_category(category: String) -> String {
    let conn = establish_connection().unwrap();
    let game_ids_from_cat = query_data(&conn, vec!["universe"], vec!["DISTINCT games"], vec![("name", &*("'".to_string() + &category + "'"))], false).unwrap();
    let games = query_data(&conn, vec!["games"], vec!["*"], vec![("id", &game_ids_from_cat[0]["games"])],true).unwrap()
        .iter()
        .map(|row| {
            format!("{:?}", row)
        })
        .collect::<Vec<String>>()
        .join(",");
    format!("[{}]", games)
}

#[tauri::command]
fn get_games_by_id(id: String) -> String {
    let conn = establish_connection().unwrap();
    let game = query_data(&conn, vec!["games"], vec!["*"], vec![("id", &id)],false).unwrap()
        .iter()
        .map(|row| {
            format!("{:?}", row)
        })
        .collect::<Vec<String>>()
        .join(",");
    format!("[{}]", game)
}

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

#[tauri::command]
fn post_game(game: String) -> Result<(), String> {
    let conn = establish_connection().unwrap();
    let game: IGame = serde_json::from_str(&game).map_err(|e| e.to_string())?;
    println!("Game: {:?}", game);
    let sql_check_exist = format!("SELECT * FROM games WHERE id = {}", game.id);
    let mut stmt = conn.prepare(&sql_check_exist).map_err(|e| e.to_string())?;
    let mut rows = stmt.query([]).map_err(|e| e.to_string())?;
    // escape single quotes
    let game = IGame {
        id: game.id,
        name: game.name.replace("'", "''"),
        sort_name: game.sort_name.replace("'", "''"),
        rating: game.rating.replace("'", "''"),
        platforms: game.platforms.replace("'", "''"),
        description: game.description.replace("'", "''"),
        critic_score: game.critic_score.replace("'", "''"),
        genres: game.genres.replace("'", "''"),
        styles: game.styles.replace("'", "''"),
        release_date: game.release_date.replace("'", "''"),
        developers: game.developers.replace("'", "''"),
        editors: game.editors.replace("'", "''"),
        game_dir: game.game_dir.replace("'", "''"),
        exec_file: game.exec_file.replace("'", "''"),
        tags: game.tags.replace("'", "''"),
        status: game.status.replace("'", "''"),
        time_played: game.time_played.replace("'", "''"),
        trophies: game.trophies.replace("'", "''"),
        trophies_unlocked: game.trophies_unlocked.replace("'", "''"),
        last_time_played: game.last_time_played.replace("'", "''"),
    };
    if rows.next().is_ok() {
        let sql_update = format!("UPDATE games SET name = '{}', sort_name = '{}', rating = '{}', platforms = '{}', description = '{}', critic_score = '{}', genres = '{}', styles = '{}', release_date = '{}', developers = '{}', editors = '{}', game_dir = '{}', exec_file = '{}', tags = '{}', status = '{}', time_played = '{}', trophies_unlocked = '{}', last_time_played = '{}' WHERE id = '{}';", game.name, game.sort_name, game.rating, game.platforms, game.description, game.critic_score, game.genres, game.styles, game.release_date, game.developers, game.editors, game.game_dir, game.exec_file, game.tags, game.status, game.time_played, game.trophies_unlocked, game.last_time_played, game.id);
        conn.execute(&sql_update, []).map_err(|e| e.to_string())?;
        println!("Game updated");
    } else {
        let all_fields = vec![game.id, game.name, game.sort_name, game.rating, game.platforms, game.description, game.critic_score, game.genres, game.styles, game.release_date, game.developers, game.editors, game.game_dir, game.exec_file, game.tags, game.status, game.time_played, game.trophies_unlocked, game.last_time_played];
        let all_fields = all_fields.iter().map(|field| field.to_string()).collect::<Vec<String>>().join("', '");
        let sql_insert = format!("INSERT INTO games (id, name, sort_name, rating, platforms, description, critic_score, genres, styles, release_date, developers, editors, game_dir, exec_file, tags, status, time_played, trophies_unlocked, last_time_played) VALUES ('{}')", all_fields);
        conn.execute(&sql_insert, []).map_err(|e| e.to_string())?;
        println!("Game inserted");
    }
    Ok(())
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
                 name            TEXT NOT NULL,
                 sortName        TEXT,
                 rating TEXT NOT NULL DEFAULT '0',
                 platforms TEXT,
                 description TEXT,
                 critic_score TEXT,
                 genres TEXT,
                 styles TEXT,
                 release_date TEXT,
                 developers TEXT,
                 editors TEXT,
                 game_dir TEXT,
                 exec_file TEXT,
                 tags TEXT,
                 status TEXT NOT NULL DEFAULT 'NOT PLAYED',
                 time_played INTEGER NOT NULL DEFAULT 0,
                 trophies TEXT,
                 trophies_unlocked INTEGER NOT NULL DEFAULT 0,
                 last_played TEXT
                  )",
        [],
    )?;

    conn.execute(
        "CREATE TABLE IF NOT EXISTS universe (
                  id              INTEGER PRIMARY KEY,
                  name            TEXT NOT NULL,
                  games           TEXT NOT NULL,
                  icon            TEXT,
                     background      TEXT,
                  filters         TEXT,
                  views           TEXT
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

fn update_data(conn: &Connection, id: i32, field: &str, value: &str, table: &str) -> Result<()> {
    conn.execute(
        &format!("UPDATE {} SET {} = ?1 WHERE id = ?2", table, field),
        params![value, id],
    )?;
    Ok(())
}

fn query_all_data(conn: &Connection, table: &str) -> std::result::Result<Vec<HashMap<String, String>>, rusqlite::Error> {
    let mut stmt = conn.prepare(&format!("SELECT * FROM {}", table))?;
    let json = make_a_json_from_db(&mut stmt)?;
    Ok(json)
}

fn make_a_json_from_db(stmt: &mut rusqlite::Statement) -> std::result::Result<Vec<HashMap<String, String>>, rusqlite::Error> {
    let col_count = stmt.column_count();
    let col_names = stmt.column_names().into_iter().map(|s| s.to_string()).collect::<Vec<String>>();
    let rows = stmt.query_map([], |row| {
        let mut map = HashMap::new();
        for i in 0..col_count {
            let value = match row.get_ref(i).unwrap() {
                rusqlite::types::ValueRef::Integer(int) => int.to_string(),
                rusqlite::types::ValueRef::Text(text) => std::str::from_utf8(text).unwrap_or_default().to_string(),
                _ => String::new(),
            };
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

fn query_data(conn: &Connection, tables: Vec<&str>, fields: Vec<&str>, conditions: Vec<(&str, &str)>, is_list: bool ) -> std::result::Result<Vec<HashMap<String, String>>, rusqlite::Error> {
    let sql;
    if is_list {
        sql = format!("SELECT {} FROM {} WHERE {}", fields.join(","), tables.join(","), conditions.iter().map(|(field, value)| format!("{} IN ({})", field, value)).collect::<Vec<String>>().join(" AND "));
    } else {
        sql = format!("SELECT {} FROM {} WHERE {}", fields.join(","), tables.join(","), conditions.iter().map(|(field, value)| format!("{} = {}", field, value)).collect::<Vec<String>>().join(" AND "));
    }
    let mut stmt = conn.prepare(&sql)?;
    let col_count = stmt.column_count();
    let col_names = stmt.column_names().into_iter().map(|s| s.to_string()).collect::<Vec<String>>();
    let json = make_a_json_from_db(&mut stmt)?;
    Ok(json)
}

fn main() {
    initialize();
    let conn = establish_connection().unwrap();
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![get_all_videos_location,get_all_games,get_all_categories,get_games_by_category,get_all_images_location,upload_file,delete_element,post_game])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}