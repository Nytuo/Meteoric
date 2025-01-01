use std::collections::HashMap;
use std::env;
use std::path::PathBuf;
use std::time::Duration;
use directories::ProjectDirs;
use rusty_ytdl::{Video, VideoError, VideoOptions, VideoQuality, VideoSearchOptions};
use tokio::process::Command;
use tokio::task;
use tokio::time::Instant;

use crate::database::{
    add_category, add_game_to_category_db, bulk_update_stats, delete_game_db, establish_connection,
    get_all_fields, get_stats_for_game, insert_stat_db, query_all_data, query_data,
    remove_game_from_category_db, set_settings_db, update_game, update_stat_db,
};
use crate::file_operations::{
    archive_db_and_extra_content, create_extra_dirs, get_all_files_in_dir_for,
    get_all_files_in_dir_for_parsed, get_extra_dirs, read_env_file, remove_file, write_env_file,get_base_extra_dir
};
use crate::plugins::{epic_importer, gog_importer, igdb, steam_grid, steam_importer, ytdl};
use crate::{routine, send_message_to_frontend, IGame, IStats};

#[tauri::command]
pub fn get_all_games() -> String {
    let conn = establish_connection().unwrap();
    let games = query_all_data(&conn, "games");
    let stats = query_all_data(&conn, "stats");
    let games = games
        .unwrap()
        .iter()
        .map(|row| {
            let mut row = row.clone();
            let id = row.get("id").unwrap().to_string();
            let stats = stats
                .as_ref()
                .unwrap()
                .iter()
                .filter(|s| s.get("game_id").unwrap().to_string() == id)
                .map(|s| format!("{:?}", s))
                .collect::<Vec<String>>()
                .join(",");
            row.insert("stats".to_string(), format!("[{}]", stats));
            format!("{:?}", row)
        })
        .collect::<Vec<String>>()
        .join(",");
    format!("[{}]", games)
}

#[tauri::command]
pub fn get_all_categories() -> String {
    let conn = establish_connection().unwrap();
    let category = query_all_data(&conn, "category")
        .unwrap()
        .iter()
        .map(|row| format!("{:?}", row))
        .collect::<Vec<String>>()
        .join(",");
    format!("[{}]", category)
}

#[tauri::command]
pub async fn create_category(
    name: String,
    icon: String,
    games: Vec<String>,
    filters: Vec<String>,
    views: Vec<String>,
    background: String,
) -> Result<(), String> {
    let conn = establish_connection().unwrap();
    let _ = add_category(
        &conn,
        name.clone(),
        icon.clone(),
        games.clone(),
        filters.clone(),
        views.clone(),
        background.clone(),
    );
    Ok(())
}

#[tauri::command]
pub async fn add_game_to_category(game_id: String, category_id: String) -> Result<(), String> {
    let conn = establish_connection().unwrap();
    println!("Game id: {}, Category id: {}", game_id, category_id);
    let _ = add_game_to_category_db(&conn, game_id, category_id);
    Ok(())
}

#[tauri::command]
pub async fn remove_game_from_category(game_id: String, category_id: String) -> Result<(), String> {
    let conn = establish_connection().unwrap();
    let _ = remove_game_from_category_db(&conn, game_id, category_id);
    Ok(())
}

#[tauri::command]
pub fn get_all_fields_from_db() -> String {
    let conn = establish_connection().unwrap();
    let fields = get_all_fields(&conn)
        .iter()
        .map(|row| format!("{:?}", row))
        .collect::<Vec<String>>()
        .join(",");
    format!("[{}]", fields)
}

#[tauri::command]
pub fn get_all_images_location(id: String) -> String {
    if get_all_files_in_dir_for(&id, "screenshots").is_err() {
        create_extra_dirs(&id).unwrap();
    }
    get_all_files_in_dir_for_parsed(&id, "screenshots")
}

#[tauri::command]
pub fn get_all_videos_location(id: String) -> String {
    if get_all_files_in_dir_for(&id, "videos").is_err() {
        create_extra_dirs(&id).unwrap();
    }
    get_all_files_in_dir_for_parsed(&id, "videos")
}

#[tauri::command]
pub fn get_settings() -> String {
    let conn = establish_connection().unwrap();
    let settings = query_all_data(&conn, "settings")
        .unwrap()
        .iter()
        .map(|row| format!("{:?}", row))
        .collect::<Vec<String>>()
        .join(",");
    format!("[{}]", settings)
}

#[tauri::command]
pub fn set_settings(settings: String) -> Result<(), String> {
    let conn = establish_connection().unwrap();
    let settings: Vec<HashMap<String, String>> =
        serde_json::from_str(&settings).map_err(|e| e.to_string())?;
    for setting in settings {
        let name = setting.get("name").unwrap();
        let value = setting.get("value").unwrap();
        set_settings_db(&conn, name, value).unwrap();
    }
    Ok(())
}

#[tauri::command]
pub async fn upload_csv_to_db(data: Vec<HashMap<String, String>>) -> Result<(), String> {
    let conn = establish_connection().unwrap();
    for row in data {
        let json_map: serde_json::Map<String, serde_json::Value> = row
            .into_iter()
            .map(|(k, v)| (k, serde_json::Value::String(v)))
            .collect();
        let mut game: IGame = serde_json::from_value(serde_json::Value::Object(json_map.clone()))
            .unwrap_or_else(|_| {
                let mut default_map = json_map;
                for key in IGame::field_names() {
                    default_map
                        .entry(key.to_string())
                        .or_insert_with(|| serde_json::Value::String("".to_string()));
                }
                serde_json::from_value(serde_json::Value::Object(default_map)).unwrap()
            });
        game.id = "-1".to_string();
        update_game(&conn, game).expect("Error updating game");
    }
    Ok(())
}

#[tauri::command]
pub fn delete_game(id: String) -> Result<(), String> {
    let conn = establish_connection().unwrap();
    delete_game_db(&conn, id)
}

#[tauri::command]
pub fn upload_file(file_content: Vec<u8>, type_of: String, id: String) -> Result<(), String> {
    let is_game_id_found = id != "" && id != "undefined" && id != "null" && id != "-1";
    let mut id = &id;
    let new_game_id;
    if !is_game_id_found {
        let latest_game_id = query_all_data(&establish_connection().unwrap(), "games")
            .unwrap()
            .last()
            .unwrap()
            .get("id")
            .unwrap()
            .to_string();
        println!("{:?}", latest_game_id);
        let latest_game_id = latest_game_id.replace("\"", "");
        let latest_game_id = latest_game_id.parse::<i32>().unwrap();
        new_game_id = (latest_game_id + 1).to_string().parse().unwrap();
        id = &new_game_id;
    }
    if id.is_empty() {
        send_message_to_frontend(
            &"[File Uploader Error-ERROR-3000] Game name is empty".to_string(),
        );
        return Err("Game name is empty".to_string());
    }
    if type_of.is_empty() {
        send_message_to_frontend(&"[File Uploader Error-ERROR-3000] Type of is empty".to_string());
        return Err("Type of is empty".to_string());
    }
    if file_content.is_empty() {
        send_message_to_frontend(
            &"[File Uploader Error-ERROR-3000] File content is empty".to_string(),
        );
        return Err("File content is empty".to_string());
    }
    if file_content.len() > 100000000 {
        send_message_to_frontend(
            &"[File Uploader Error-ERROR-3000] File content is too big".to_string(),
        );
        return Err("File content is too big".to_string());
    }
    if type_of != "screenshot"
        && type_of != "video"
        && type_of != "audio"
        && type_of != "background"
        && type_of != "jaquette"
        && type_of != "logo"
        && type_of != "icon"
    {
        send_message_to_frontend(
            &"[File Uploader Error-ERROR-3000] Type of is not valid".to_string(),
        );
        return Err("Type of is not valid".to_string());
    }
    if id.contains("/") || id.contains("\\") {
        send_message_to_frontend(
            &"[File Uploader Error-ERROR-3000] Game name is not valid".to_string(),
        );
        return Err("Game name is not valid".to_string());
    }

    create_extra_dirs(&id).unwrap();
    let game_dir = get_extra_dirs(&id).unwrap();

    let get_nb_of_screenshots = std::fs::read_dir(&game_dir.join("screenshots"))
        .unwrap()
        .count()
        + 1;
    let get_nb_of_videos = std::fs::read_dir(&game_dir.join("videos")).unwrap().count() + 1;
    let file_path = match type_of.as_str() {
        "screenshot" => game_dir
            .join("screenshots")
            .join("screenshot-".to_string() + &get_nb_of_screenshots.to_string() + ".jpg"),
        "video" => game_dir
            .join("videos")
            .join("video-".to_string() + &get_nb_of_videos.to_string() + ".mp4"),
        "audio" => game_dir.join("musics").join("theme.mp3"),
        "background" => game_dir.join("background.jpg"),
        "jaquette" => game_dir.join("jaquette.jpg"),
        "logo" => game_dir.join("logo.png"),
        "icon" => game_dir.join("icon.png"),
        _ => game_dir,
    };

    if let Err(e) = std::fs::write(&file_path, &file_content) {
        send_message_to_frontend(&format!(
            "[File Uploader Error-ERROR-3000] Error writing file: {:?}",
            e
        ));
        return Err(format!("Error writing file: {:?}", e));
    }
    Ok(())
}

#[tauri::command]
pub async fn startup_routine() -> Result<(), String> {
    let handle = task::spawn_blocking(move || {
        routine();
    });

    handle.await.unwrap();
    Ok(())
}

#[tauri::command]
pub fn delete_element(
    type_of: String,
    id: String,
    element_to_delete: String,
) -> Result<(), String> {
    let id = &id;
    if id.is_empty() {
        send_message_to_frontend(
            &*"[Element Deleter Error-ERROR-3000] Game id is empty".to_string(),
        );
        return Err("Game id is empty".to_string());
    }
    if type_of.is_empty() {
        send_message_to_frontend(
            &*"[Element Deleter Error-ERROR-3000] Type of is empty".to_string(),
        );
        return Err("Type of is empty".to_string());
    }
    if type_of != "screenshot"
        && type_of != "video"
        && type_of != "audio"
        && type_of != "background"
        && type_of != "jaquette"
        && type_of != "logo"
        && type_of != "icon"
    {
        send_message_to_frontend(
            &*"[Element Deleter Error-ERROR-3000] Type of is not valid".to_string(),
        );
        return Err("Type of is not valid".to_string());
    }
    if id.contains("/") || id.contains("\\") {
        send_message_to_frontend(
            &*"[Element Deleter Error-ERROR-3000] Game id is not valid".to_string(),
        );
        return Err("Game id is not valid".to_string());
    }

    create_extra_dirs(&id).unwrap();
    let game_dir = get_extra_dirs(&id).unwrap();
    let file_path = match type_of.as_str() {
        "screenshot" => game_dir
            .clone()
            .join("screenshots")
            .join("screenshot-".to_string() + &element_to_delete + ".jpg"),
        "video" => game_dir
            .clone()
            .join("videos")
            .join("video-".to_string() + &element_to_delete + ".mp4"),
        "audio" => game_dir.clone().join("musics").join("theme.mp3"),
        _ => game_dir.clone(),
    };

    if !file_path.exists() {
        send_message_to_frontend(
            &*"[Element Deleter Error-ERROR-3000] File does not exist".to_string(),
        );
        return Err("File does not exist".to_string());
    }

    if let Err(e) = remove_file(&file_path.to_str().unwrap()) {
        send_message_to_frontend(&format!(
            "[Element Deleter Error-ERROR-3000] Error removing file: {:?}",
            e
        ));
        return Err(format!("Error removing file: {:?}", e));
    }

    Ok(())
}

#[tauri::command]
pub fn get_games_by_category(category: String) -> String {
    let conn = establish_connection().unwrap();
    let game_ids_from_cat = query_data(
        &conn,
        vec!["category"],
        vec!["DISTINCT games"],
        vec![("name", &*("'".to_string() + &category + "'"))],
        false,
    )
        .unwrap();
    let games = query_data(
        &conn,
        vec!["games"],
        vec!["*"],
        vec![("id", &game_ids_from_cat[0]["games"])],
        true,
    );
    let stats = query_all_data(&conn, "stats");
    let games = games
        .unwrap()
        .iter()
        .map(|row| {
            let mut row = row.clone();
            let id = row.get("id").unwrap().to_string();
            let stats = stats
                .as_ref()
                .unwrap()
                .iter()
                .filter(|s| s.get("game_id").unwrap().to_string() == id)
                .map(|s| format!("{:?}", s))
                .collect::<Vec<String>>()
                .join(",");
            row.insert("stats".to_string(), format!("[{}]", stats));
            format!("{:?}", row)
        })
        .collect::<Vec<String>>()
        .join(",");
    format!("[{}]", games)
}

// TODO send error messages to frontend
#[tauri::command]
pub async fn search_metadata(game_name: String, plugin_name: String, strict: bool) -> String {
    // ADD API HERE
    match plugin_name.as_str() {
        "ytdl" => {
            let result = ytdl::search_game(&game_name).unwrap();
            format!("{:?}", result)
        }
        "igdb" => {
            let client_id: String = env::var("IGDB_CLIENT_ID").expect("IGDB_CLIENT_ID not found");
            let client_secret =
                env::var("IGDB_CLIENT_SECRET").expect("IGDB_CLIENT_SECRET not found");
            igdb::set_credentials(Vec::from([client_id, client_secret]));
            let result = igdb::search_game(&game_name, strict).unwrap();
            format!("{:?}", result)
        }
        "steam_grid" => {
            let api_key = env::var("STEAMGRIDDB_API_KEY").expect("STEAMGRIDDB_API_KEY not found");
            steam_grid::set_credentials(api_key).await;
            let result = steam_grid::search_game(&game_name).unwrap();
            format!("{:?}", result)
        }
        _ => "Plugin not found".to_string(),
    }
}

#[tauri::command]
pub async fn import_library(plugin_name: String, creds: Vec<String>) {
    // ADD API HERE
    match plugin_name.as_str() {
        "epic_importer" => {
            epic_importer::set_credentials(creds).await;
            epic_importer::get_games_from_user()
                .await
                .expect("Failed to get games");
        }
        "steam_importer" => {
            let api_key = env::var("STEAM_API_KEY").expect("STEAM_API_KEY not found");
            let mut creds_temp = Vec::new();
            for i in creds {
                creds_temp.push(i.clone());
            }
            creds_temp.push(api_key.clone());
            steam_importer::set_credentials(creds_temp).await;
            steam_importer::get_games_from_user()
                .await
                .expect("Failed to get games");
        }
        "gog_importer" => {
            gog_importer::set_credentials(creds).await;
            gog_importer::get_games_from_user()
                .await
                .expect("Failed to get games");
        }
        _ => {
            eprintln!("Unsupported plugin: {}", plugin_name);
        }
    }
}

#[tauri::command]
pub fn get_games_by_id(id: String) -> String {
    let conn = establish_connection().unwrap();
    let game = query_data(&conn, vec!["games"], vec!["*"], vec![("id", &id)], false)
        .unwrap()
        .iter()
        .map(|row| format!("{:?}", row))
        .collect::<Vec<String>>()
        .join(",");
    let stats = get_stats_for_game(&conn, id);
    let stats = stats
        .iter()
        .map(|row| format!("{:?}", row))
        .collect::<Vec<String>>()
        .join(",");
    let game = format!("{},\"stats\":[{}]", game, stats);
    format!("[{}]", game)
}

#[tauri::command]
pub fn post_game(game: String) -> Result<String, String> {
    let conn = establish_connection().map_err(|e| e.to_string())?;
    let mut _game: HashMap<String, serde_json::Value> =
        serde_json::from_str(&game).map_err(|e| e.to_string())?;

    let parsed_stats = _game.get("stats")
        .ok_or("Missing stats field")?
        .to_string()
        .replace("\\\"", "\"");

    let stats: Vec<IStats> = serde_json::from_str(&parsed_stats).map_err(|e| e.to_string())?;
    _game.remove("stats");

    let __game: HashMap<String, String> = _game
        .iter()
        .map(|(k, v)| (k.clone(), v.as_str().unwrap_or("").trim_matches('"').to_string()))
        .collect();

    let game_without_stats: IGame = IGame::from_hashmap(__game);
    println!("{:?}", game_without_stats);
bulk_update_stats(&conn, stats).unwrap_or_else(|e| {
    send_message_to_frontend(&format!("Error updating stats: {}", e));
});
    let id = update_game(&conn, game_without_stats).map_err(|e| e.to_string())?;

    Ok(id)
}

struct GameTimer {
    start_time: Option<Instant>,
    total_time_played: Duration,
}

impl GameTimer {
    fn new() -> Self {
        GameTimer {
            start_time: None,
            total_time_played: Duration::new(0, 0),
        }
    }

    fn start(&mut self) {
        self.start_time = Some(Instant::now());
    }

    fn stop(&mut self) {
        if let Some(start_time) = self.start_time {
            self.total_time_played += start_time.elapsed();
            self.start_time = None;
        }
    }

    fn get_total_time_played(&self) -> Duration {
        self.total_time_played
    }
}

#[tauri::command]
pub async fn launch_game(game_id: String) -> Result<u32, String> {
    let conn = establish_connection().unwrap();
    let game = query_data(
        &conn,
        vec!["games"],
        vec!["*"],
        vec![("id", &game_id)],
        false,
    )
        .unwrap();
    let game = game.get(0);
    let mut game_object: IGame = IGame::from_hashmap(game.unwrap().clone());
    if let Some(row) = game {
        let executable = row.get("exec_file").unwrap().clone();
        let launch_dir = row.get("game_dir").unwrap().clone();
        let args = row.get("exec_args").unwrap().clone();
        let args = if !args.is_empty() { Some(args) } else { None };
        let mut cmd = Command::new(&executable)
            .current_dir(&launch_dir)
            .args(&args)
            .spawn()
            .map_err(|_| "Failed to launch game".to_string())?;
        let pid = cmd.id().ok_or("Failed to get process ID".to_string())?;
        send_message_to_frontend(&format!("GL-{:?}", pid));
        let date = chrono::Local::now().format("%Y-%m-%d %H:%M:%S").to_string();

        let mut game_timer = GameTimer::new();
        game_timer.start();
        let _ = cmd.wait().await;
        game_timer.stop();
        let played_time_u128: u128 = game_timer.get_total_time_played().as_millis();
        insert_stat_db(
            &conn,
            game_id.clone(),
            played_time_u128.to_string().clone(),
            date.clone(),
        );
        send_message_to_frontend(&format!("GL-END-{}", pid));
        Ok(pid)
    } else {
        send_message_to_frontend(&"[Game Launcher Error-ERROR-3000] Game not found".to_string());
        Err("Game not found".to_string())
    }
}

#[tauri::command]
pub async fn kill_game(pid: u32) -> Result<(), String> {
    let os = env::consts::OS;
    if os == "windows" {
        kill_game_windows(pid)?;
    } else if os == "linux" {
        kill_game_linux(pid)?;
    } else {
        send_message_to_frontend(
            &"[Game Killer Error-ERROR-3000] Unsupported operating system".to_string(),
        );
        return Err("Unsupported operating system".to_string());
    }
    Ok(())
}

fn kill_game_windows(pid: u32) -> Result<(), String> {
    use std::process::Command;
    let output = Command::new("taskkill")
        .args(&["/PID", &pid.to_string(), "/F"])
        .output()
        .map_err(|e| e.to_string())?;

    if output.status.success() {
        send_message_to_frontend(&format!("Game with PID {} killed", pid));
        Ok(())
    } else {
        send_message_to_frontend(&format!(
            "[Game Killer Error-ERROR-3000] Failed to kill process: {}",
            String::from_utf8_lossy(&output.stderr)
        ));
        Err(format!(
            "Failed to kill process: {}",
            String::from_utf8_lossy(&output.stderr)
        ))
    }
}

fn kill_game_linux(pid: u32) -> Result<(), String> {
    use std::process::Command;
    let output = Command::new("kill")
        .arg("-9")
        .arg(pid.to_string())
        .output()
        .map_err(|e| e.to_string())?;

    if output.status.success() {
        send_message_to_frontend(&format!("Game with PID {} killed", pid));
        Ok(())
    } else {
        send_message_to_frontend(&format!(
            "[Game Killer Error-ERROR-3000] Failed to kill process: {}",
            String::from_utf8_lossy(&output.stderr)
        ));
        Err(format!(
            "Failed to kill process: {}",
            String::from_utf8_lossy(&output.stderr)
        ))
    }
}

#[tauri::command]
pub async fn save_media_to_external_storage(id: String, game: String) -> Result<(), String> {
    let game: HashMap<String, serde_json::Value> =
        serde_json::from_str(&game).map_err(|e| e.to_string())?;
    let is_game_id_found = id != "" && id != "undefined" && id != "null" && id != "-1";
    let mut id = &id;
    let new_game_id;
    if !is_game_id_found {
        let latest_game_id = query_all_data(&establish_connection().unwrap(), "games")
            .unwrap()
            .last()
            .unwrap()
            .get("id")
            .unwrap()
            .to_string();
        println!("{:?}", latest_game_id);
        let latest_game_id = latest_game_id.replace("\"", "");
        let latest_game_id = latest_game_id.parse::<i32>().unwrap();
        new_game_id = (latest_game_id + 1).to_string().parse().unwrap();
        id = &new_game_id;
    }
    if id.is_empty() {
        send_message_to_frontend(
            &"[Media Downloader Error-ERROR-3000] Game name is empty".to_string(),
        );
        return Err("Game name is empty".to_string());
    }
    if game.is_empty() {
        send_message_to_frontend(&"[Media Downloader Error-ERROR-3000] Game is empty".to_string());
        return Err("Urls are empty".to_string());
    }
    if id.contains("/") || id.contains("\\") {
        send_message_to_frontend(
            &"[Media Downloader Error-ERROR-3000] Game name is not valid".to_string(),
        );
        return Err("Game name is not valid".to_string());
    }

    create_extra_dirs(&id).unwrap();
    let game_dir = get_extra_dirs(&id).unwrap();

    let mut get_nb_of_screenshots = std::fs::read_dir(&game_dir.clone().join("screenshots"))
        .unwrap()
        .count();
    let mut get_nb_of_videos = std::fs::read_dir(&game_dir.clone().join("videos"))
        .unwrap()
        .count();

    let cl = reqwest::Client::new();

    for (key, value) in game.iter() {
        println!("Key: {}, Value: {}", key, value);
        if value.is_null() || key.is_empty() {
            continue;
        }
        if value.is_array() {
            if key == "screenshots" {
                if let Some(str_value) = value.as_array() {
                    for i in str_value {
                        println!("Downloading: {}", i);
                        let url = i.as_str().unwrap();
                        get_nb_of_screenshots = get_nb_of_screenshots + 1;
                        let file_path = game_dir.join("screenshots").join(
                            "screenshot-".to_string() + &get_nb_of_screenshots.to_string() + ".jpg",
                        );
                        let file_content = cl.get(url).send().await.unwrap().bytes().await.unwrap();
                        if let Err(e) = std::fs::write(&file_path, &file_content) {
                            send_message_to_frontend(&format!(
                                "[Media Downloader Error-ERROR-3000] Error writing file: {:?}",
                                e
                            ));
                            return Err(format!("Error writing file: {:?}", e));
                        }
                    }
                }
            }

            if key == "videos" {
                if let Some(str_value) = value.as_array() {
                    for i in str_value {
                        let url = i.as_str().unwrap();
                        get_nb_of_videos = get_nb_of_videos + 1;
                        let video_path = game_dir.join("videos");
                        let file_path = game_dir
                            .join("videos")
                            .join("video-".to_string() + &get_nb_of_videos.to_string() + ".mp4");
                        let is_youtube = url.contains("youtube.com");

                        if is_youtube {
                            match download_youtube_video(
                                url,
                                video_path.to_str().unwrap().to_string(),
                                "video-".to_string() + &get_nb_of_videos.to_string(),
                            )
                                .await
                            {
                                Ok(_) => send_message_to_frontend(&"[Media Downloader-INFO-3000] Youtube Video Downloaded".to_string()),
                                Err(e) => send_message_to_frontend(&format!("[Media Downloader Error-ERROR-3000] Cannot Download This Youtube Video: {:?}", e)),
                            }
                        } else {
                            let file_content =
                                cl.get(url).send().await.unwrap().bytes().await.unwrap();
                            if let Err(e) = std::fs::write(&file_path, &file_content) {
                                send_message_to_frontend(&format!(
                                    "[Media Downloader Error-ERROR-3000] Error writing file: {:?}",
                                    e
                                ));
                                return Err(format!("Error writing file: {:?}", e));
                            }
                        }
                    }
                }
            }
        } else {
            let url = value.as_str().unwrap();

            if key == "audio"
                || key == "background"
                || key == "jaquette"
                || key == "logo"
                || key == "icon"
            {
                println!("Downloading: {}", url);
                if url.is_empty() {
                    continue;
                }
                let file_content = cl.get(url).send().await.unwrap().bytes().await.unwrap();
                let game_dir_clone = game_dir.clone();
                let file_path = match key.as_str() {
                    "audio" => game_dir_clone.join("musics").join("theme.mp3"),
                    "background" => game_dir_clone.join("background.jpg"),
                    "jaquette" => game_dir_clone.join("jaquette.jpg"),
                    "logo" => game_dir_clone.join("logo.png"),
                    "icon" => game_dir_clone.join("icon.png"),
                    _ => game_dir_clone,
                };
                if let Err(e) = std::fs::write(&file_path, &file_content) {
                    send_message_to_frontend(&format!(
                        "[Media Downloader Error-ERROR-3000] Error writing file: {:?}",
                        e
                    ));
                    return Err(format!("Error writing file: {:?}", e));
                }
            }
        }
    }
    Ok(())
}

#[tauri::command]
pub async fn download_yt_audio(url: String, id: String) -> Result<(), String> {
    let id = &id;
    if id.is_empty() {
        send_message_to_frontend("[Youtube Downloader Error-ERROR-3000] Game name is empty");
        return Err("Game name is empty".to_string());
    }
    if url.is_empty() {
        send_message_to_frontend("[Youtube Downloader Error-ERROR-3000] Url is empty");
        return Err("Url is empty".to_string());
    }
    if id.contains("/") || id.contains("\\") {
        send_message_to_frontend("[Youtube Downloader Error-ERROR-3000] Game name is not valid");
        return Err("Game name is not valid".to_string());
    }

    create_extra_dirs(&id).unwrap();
    let game_dir = get_extra_dirs(&id)
        .unwrap()
        .join("musics")
        .join("theme.mp3");

    send_message_to_frontend("[Youtube Downloader-INFO-3000] Downloading Youtube Audio");
    if let Err(e) = download_youtube_audio(&url, game_dir).await {
        return Err(format!("Error downloading youtube audio: {:?}", e));
    }

    Ok(())
}

pub async fn download_youtube_video(
    url: &str,
    location: String,
    name: String,
) -> Result<(), VideoError> {
    let path = std::path::Path::new(&location).join(format!("{}.mp4", name));
    let video_options = VideoOptions {
        quality: VideoQuality::Lowest,
        filter: VideoSearchOptions::VideoAudio,
        ..Default::default()
    };
    let video = Video::new_with_options(url, video_options).unwrap();
    match video.download(path).await {
        Ok(_) => {
            send_message_to_frontend("[Youtube Downloader-INFO-3000] Youtube Video Downloaded");
            Ok(())
        }
        Err(err) => {
            send_message_to_frontend(
                "[Youtube Downloader Error-ERROR-3000] Cannot Download This Youtube Video",
            );
            Err(VideoError::DownloadError(err.to_string()))
        }
    }
}

pub async fn download_youtube_audio(url: &str, location: PathBuf) -> Result<(), VideoError> {
    let path = std::path::Path::new(&location);
    let video_options = VideoOptions {
        quality: VideoQuality::HighestAudio,
        filter: VideoSearchOptions::Audio,
        ..Default::default()
    };
    let video = Video::new_with_options(url, video_options).unwrap();
    match video.download(path).await {
        Ok(_) => {
            send_message_to_frontend("[Youtube Downloader-INFO-3000] Youtube Audio Downloaded");
            Ok(())
        }
        Err(err) => {
            send_message_to_frontend(
                "[Youtube Downloader Error-ERROR-3000] Cannot Download This Youtube Audio",
            );
            Err(VideoError::DownloadError(err.to_string()))
        }
    }
}

#[tauri::command]
pub fn export_game_database_to_csv(path: String) -> Result<(), String> {
    let conn = establish_connection().unwrap();
    let results = query_all_data(&conn, "games").unwrap();
    let mut wtr = csv::Writer::from_path(path.clone()).unwrap();
    for row in results {
        let mut game: IGame = IGame::from_hashmap(row.clone());
        game.description = game.description.replace("\n", " ");

        let stat = get_stats_for_game(&conn, game.id.clone());

        let mut stats = String::new();
        for s in stat {
            stats.push_str(&format!("{:?},", s));
        }
        let game_with_stats = format!("{:?},\"stats\":[{}]", game, stats);
        wtr.serialize(game_with_stats).unwrap();
    }
    wtr.flush().unwrap();
    Ok(())
}

#[tauri::command]
pub fn export_game_database_to_archive(path: String) -> Result<(), String> {
    archive_db_and_extra_content(path).expect("Failed to archive database and extra content");
    Ok(())
}

#[tauri::command]
pub fn get_env_map() -> Result<HashMap<String, String>, String> {
    Ok(read_env_file().expect("Failed to read env file"))
}

#[tauri::command]
pub fn set_env_map(env_map: HashMap<String, String>) -> Result<(), String> {
    write_env_file(env_map).expect("Failed to write env file");
    Ok(())
}

#[tauri::command]
pub async fn search_hltb(game_name: String) -> String {
    let hltb_game = howlongtobeat_scraper::search_by_name(&game_name).await.unwrap();
    let hltb_game = serde_json::to_string(&hltb_game).unwrap();
    hltb_game
}

#[tauri::command]
pub fn get_app_version() -> String {
    env!("CARGO_PKG_VERSION").to_string()
}

#[tauri::command]
pub fn open_program_folder() -> Result<(), String> {
    let exe_path = std::env::current_exe().unwrap();
    let parent_path = exe_path.parent().unwrap().to_str().unwrap().to_string();
    tauri_plugin_opener::open_path(&parent_path, None::<&str>).unwrap();
    Ok(())
}

#[tauri::command]
pub fn open_data_folder() -> Result<(), String> {
    let project_dirs = ProjectDirs::from("fr", "Nytuo", "Meteoric").unwrap();
    let data_path = project_dirs.config_dir();
    tauri_plugin_opener::open_path(data_path, None::<&str>).unwrap();
    Ok(())
}

#[tauri::command]
pub fn save_launch_video(file:String)-> Result<(), String> {
    let data_dir = get_base_extra_dir().unwrap();
    let startup_video = data_dir.join("startup.mp4");
    std::fs::copy(file, startup_video).unwrap();
    Ok(())
}

#[tauri::command]
pub fn get_achievements_for_game(game_id: String) -> String {
    println!("Game id: {}", game_id);
    let conn = establish_connection().unwrap();
    let achievements = query_data(
        &conn,
        vec!["achievements"],
        vec!["*"],
        vec![("game_id", &game_id)],
        false,
    )
        .unwrap()
        .iter()
        .map(|row| format!("{:?}", row))
        .collect::<Vec<String>>()
        .join(",");
        println!("Achievements: {:?}", achievements);
    format!("[{}]", achievements)
}