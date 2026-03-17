use directories::ProjectDirs;
use std::collections::HashMap;
use std::env;
use std::path::PathBuf;
use std::time::Duration;
use tokio::process::Command;
use tokio::time::Instant;

use crate::confero_sync;
use crate::database::{
    add_category, add_game_to_category_db, apply_confero_update, bulk_update_stats, delete_game_db,
    establish_connection, find_game_by_igdb_id, find_game_by_name, get_all_fields, get_game_by_id,
    get_setting_db, get_stats_for_game, insert_stat_db, query_all_data, query_data,
    remove_game_from_category_db, set_confero_updated_at, set_settings_db, update_game,
};

use crate::file_operations::{
    archive_db_and_extra_content, create_extra_dirs, get_all_files_in_dir_for,
    get_all_files_in_dir_for_parsed, get_base_extra_dir, get_extra_dirs, read_env_file,
    remove_file, write_env_file,
};
use crate::plugins::{
    epic_importer, gog_importer, igdb, steam_grid, steam_importer, ytdl, ytdl_manager,
};
use crate::{routine, send_message_to_frontend, IGame, IStats, ITrophy};

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
pub fn get_game_image_paths(id: String) -> String {
    use std::fs;
    let game_dir = match get_extra_dirs(&id) {
        Ok(dir) => dir,
        Err(_) => return "{}".to_string(),
    };

    let mut paths: HashMap<String, String> = HashMap::new();

    let find_image = |name: &str| -> Option<String> {
        let extensions = vec!["webp", "gif", "jpg", "jpeg", "png"];
        for ext in extensions {
            let path = game_dir.join(format!("{}.{}", name, ext));
            if fs::metadata(&path).is_ok() {
                let relative_path = format!("{}/{}.{}", id, name, ext);
                return Some(relative_path);
            }
        }
        None
    };

    if let Some(path) = find_image("background") {
        paths.insert("background".to_string(), path);
    }
    if let Some(path) = find_image("jaquette") {
        paths.insert("jaquette".to_string(), path);
    }
    if let Some(path) = find_image("jaquette_horizontal") {
        paths.insert("jaquette_horizontal".to_string(), path);
    }
    if let Some(path) = find_image("logo") {
        paths.insert("logo".to_string(), path);
    }
    if let Some(path) = find_image("icon") {
        paths.insert("icon".to_string(), path);
    }

    serde_json::to_string(&paths).unwrap_or_else(|_| "{}".to_string())
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
        "jaquette_horizontal" => game_dir.join("jaquette_horizontal.jpg"),
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
    tokio::spawn(async {
        ytdl_manager::check_and_update_ytdlp().await;
    });
    routine().await;
    Ok(())
}

#[tauri::command]
pub async fn check_ytdlp_updates() -> Result<String, String> {
    ytdl_manager::check_and_update_ytdlp().await;
    let version = ytdl_manager::get_ytdlp_path();
    Ok(format!("yt-dlp path: {:?}", version))
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
        vec![("name", &category)],
        false,
    )
    .unwrap();
    if game_ids_from_cat.is_empty() {
        return "[]".to_string();
    }
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

#[tauri::command]
pub async fn search_metadata(game_name: String, plugin_name: String, strict: bool) -> String {
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

    let parsed_stats = _game
        .get("stats")
        .ok_or("Missing stats field")?
        .to_string()
        .replace("\\\"", "\"");

    let stats: Vec<IStats> = serde_json::from_str(&parsed_stats).map_err(|e| e.to_string())?;
    _game.remove("stats");

    let __game: HashMap<String, String> = _game
        .iter()
        .map(|(k, v)| {
            (
                k.clone(),
                v.as_str().unwrap_or("").trim_matches('"').to_string(),
            )
        })
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
    let _game_object: IGame = IGame::from_hashmap(game.unwrap().clone());
    if let Some(row) = game {
        let executable = row.get("exec_file").unwrap().clone();
        let launch_dir = row.get("game_dir").unwrap().clone();
        let args = row.get("exec_args").unwrap().clone();
        let args: Vec<String> = if !args.is_empty() {
            args.split_whitespace().map(|s| s.to_string()).collect()
        } else {
            Vec::new()
        };

        if !std::path::Path::new(&executable).exists() {
            let error_msg = format!("Executable not found: {}", executable);
            send_message_to_frontend(&format!("[LAUNCH-error]{}", error_msg));
            return Err(error_msg);
        }

        let mut cmd = Command::new(&executable)
            .current_dir(&launch_dir)
            .args(&args)
            .spawn()
            .map_err(|e| {
                let error_msg = if let Some(216) = e.raw_os_error() {
                    format!("Architecture mismatch: The game executable is not compatible with your Windows version. Try: 1) Right-click the .exe → Properties → Compatibility tab → try different Windows versions, 2) Verify/reinstall the game, 3) Check if you need to install Visual C++ Redistributables. ({})", e)
                } else {
                    format!("Failed to launch: {}", e)
                };
                send_message_to_frontend(&format!("[LAUNCH-error]{}", error_msg));
                error_msg
            })?;
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
    } else if os == "linux" || os == "macos" {
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
                        if url.is_empty()
                            || url.contains("asset.localhost")
                            || url.starts_with("asset://")
                        {
                            continue;
                        }
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
                        if url.is_empty()
                            || url.contains("asset.localhost")
                            || url.starts_with("asset://")
                        {
                            continue;
                        }
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
                || key == "jaquette_horizontal"
                || key == "logo"
                || key == "icon"
            {
                println!("Downloading: {}", url);
                if url.is_empty() || url.contains("asset.localhost") || url.starts_with("asset://")
                {
                    continue;
                }
                let file_content = cl.get(url).send().await.unwrap().bytes().await.unwrap();
                let game_dir_clone = game_dir.clone();
                let file_path = match key.as_str() {
                    "audio" => game_dir_clone.join("musics").join("theme.mp3"),
                    "background" => game_dir_clone.join("background.jpg"),
                    "jaquette" => game_dir_clone.join("jaquette.jpg"),
                    "jaquette_horizontal" => game_dir_clone.join("jaquette_horizontal.jpg"),
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
) -> Result<(), String> {
    if let Err(e) = ytdl_manager::download_video(url, &location, &name).await {
        send_message_to_frontend(
            "[Youtube Downloader Error-ERROR-3000] Cannot Download This Youtube Video",
        );
        return Err(e);
    }
    send_message_to_frontend("[Youtube Downloader-INFO-3000] Youtube Video Downloaded");
    Ok(())
}

pub async fn download_youtube_audio(url: &str, location: PathBuf) -> Result<(), String> {
    let output_path = location.to_string_lossy().to_string();
    if let Err(e) = ytdl_manager::download_audio(url, &output_path).await {
        send_message_to_frontend(
            "[Youtube Downloader Error-ERROR-3000] Cannot Download This Youtube Audio",
        );
        return Err(e);
    }
    send_message_to_frontend("[Youtube Downloader-INFO-3000] Youtube Audio Downloaded");
    Ok(())
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
    for (key, value) in &env_map {
        std::env::set_var(key, value);
    }
    write_env_file(env_map).expect("Failed to write env file");
    Ok(())
}

#[tauri::command]
pub async fn search_hltb(game_name: String) -> String {
    let client = crate::hltb_client::HltbClient::new();
    match client.search(&game_name).await {
        Ok(result) => serde_json::to_string(&result).unwrap_or_default(),
        Err(e) => {
            eprintln!("[HLTB] Search failed for '{}': {}", game_name, e);
            serde_json::to_string(&crate::hltb_client::HltbResponse::default()).unwrap_or_default()
        }
    }
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
pub fn save_launch_video(file: String) -> Result<(), String> {
    let data_dir = get_base_extra_dir().unwrap();
    let startup_video = data_dir.join("startup.mp4");
    std::fs::copy(file, startup_video).unwrap();
    Ok(())
}

#[tauri::command]
pub fn get_achievements_for_game(game_id: String) -> String {
    let conn = match establish_connection() {
        Ok(c) => c,
        Err(_) => return "[]".to_string(),
    };
    let rows = match query_data(
        &conn,
        vec!["achievements"],
        vec!["*"],
        vec![("game_id", &game_id)],
        false,
    ) {
        Ok(r) => r,
        Err(_) => return "[]".to_string(),
    };
    let trophies: Vec<ITrophy> = rows
        .into_iter()
        .map(|row| ITrophy {
            id: row.get("id").cloned().unwrap_or_default(),
            game_id: row.get("game_id").cloned().unwrap_or_default(),
            name: row.get("name").cloned().unwrap_or_default(),
            description: row.get("description").cloned().unwrap_or_default(),
            visible: row.get("visible").cloned().unwrap_or_default(),
            date_of_unlock: row.get("date_of_unlock").cloned().unwrap_or_default(),
            importer_id: row.get("importer_id").cloned().unwrap_or_default(),
            image_url_locked: row.get("image_url_locked").cloned().unwrap_or_default(),
            image_url_unlocked: row.get("image_url_unlocked").cloned().unwrap_or_default(),
            unlocked: row.get("unlocked").cloned().unwrap_or_default(),
        })
        .collect();
    serde_json::to_string(&trophies).unwrap_or_else(|_| "[]".to_string())
}

#[tauri::command]
pub async fn epic_get_downloadable_games() -> Result<String, String> {
    let games = epic_importer::get_downloadable_games().await?;
    serde_json::to_string(&games).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn epic_get_installed_games() -> Result<String, String> {
    let games = epic_importer::get_installed_epic_games().await;
    serde_json::to_string(&games).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn epic_download_game(app_name: String, install_path: String) -> Result<(), String> {
    epic_importer::download_manager::download_game(&app_name, &install_path, None).await
}

#[tauri::command]
pub async fn epic_update_game(app_name: String) -> Result<(), String> {
    epic_importer::download_manager::update_game(&app_name, None).await
}

#[tauri::command]
pub async fn epic_uninstall_game(app_name: String) -> Result<(), String> {
    epic_importer::download_manager::uninstall_game(&app_name).await
}

#[tauri::command]
pub async fn epic_launch_game(
    app_name: String,
    offline: bool,
    extra_args: Vec<String>,
) -> Result<u32, String> {
    epic_importer::game_launch::launch_epic_game(&app_name, offline, extra_args).await
}

#[tauri::command]
pub async fn epic_cloud_save_status(app_name: String) -> Result<String, String> {
    let info = epic_importer::cloud_saves::check_save_status(&app_name).await?;
    serde_json::to_string(&info).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn epic_upload_saves(app_name: String) -> Result<(), String> {
    epic_importer::cloud_saves::upload_saves(&app_name).await
}

#[tauri::command]
pub async fn epic_download_saves(app_name: String) -> Result<(), String> {
    epic_importer::cloud_saves::download_saves(&app_name).await
}

#[tauri::command]
pub async fn epic_delete_cloud_saves(app_name: String) -> Result<(), String> {
    epic_importer::cloud_saves::delete_cloud_saves(&app_name).await
}

#[tauri::command]
pub async fn epic_sync_achievements(
    game_id: String,
    app_name: String,
    namespace: String,
) -> Result<usize, String> {
    epic_importer::achievements::sync_achievements(&game_id, &app_name, &namespace).await
}

#[tauri::command]
pub async fn epic_is_logged_in() -> bool {
    epic_importer::is_logged_in().await
}

#[tauri::command]
pub async fn epic_get_display_name() -> Result<String, String> {
    epic_importer::get_display_name()
        .await
        .ok_or_else(|| "Not logged in".to_string())
}

#[tauri::command]
pub async fn epic_debug_cache_info() -> String {
    epic_importer::debug_cache_info().await
}

#[tauri::command]
pub async fn epic_reload_cache() -> Result<usize, String> {
    epic_importer::reload_installed_games_cache().await
}

#[tauri::command]
pub async fn gog_get_downloadable_games() -> Result<String, String> {
    let games = gog_importer::get_downloadable_games().await?;
    serde_json::to_string(&games).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn gog_get_installed_games() -> Result<String, String> {
    let games = gog_importer::get_installed_gog_games().await;
    serde_json::to_string(&games).map_err(|e| e.to_string())
}

#[allow(dependency_on_unit_never_type_fallback)]
#[tauri::command]
pub async fn gog_download_game(game_id: String, install_path: String) -> Result<(), String> {
    gog_importer::gog_v2::download_game_v2(&game_id, &install_path, None).await
}

#[tauri::command]
pub async fn gog_uninstall_game(game_id: String) -> Result<(), String> {
    gog_importer::download_manager::uninstall_game(&game_id).await
}

#[tauri::command]
pub async fn gog_launch_game(game_id: String, extra_args: Vec<String>) -> Result<u32, String> {
    gog_importer::game_launch::launch_gog_game(&game_id, extra_args).await
}

#[tauri::command]
pub async fn gog_cloud_save_status(
    game_id: String,
    local_save_path: Option<String>,
) -> Result<String, String> {
    let info =
        gog_importer::cloud_saves::check_cloud_saves(&game_id, local_save_path.as_deref()).await?;
    serde_json::to_string(&info).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn gog_upload_saves(game_id: String, local_save_path: String) -> Result<(), String> {
    gog_importer::cloud_saves::upload_cloud_saves(&game_id, &local_save_path).await
}

#[tauri::command]
pub async fn gog_download_saves(game_id: String, local_save_path: String) -> Result<(), String> {
    gog_importer::cloud_saves::download_cloud_saves(&game_id, &local_save_path).await
}

#[tauri::command]
pub async fn gog_sync_achievements(game_id: String, product_id: String) -> Result<usize, String> {
    gog_importer::achievements::sync_achievements(&game_id, &product_id).await
}

#[tauri::command]
pub async fn steam_sync_achievements(game_id: String, app_id: String) -> Result<usize, String> {
    steam_importer::sync_achievements(&game_id, &app_id).await
}

#[tauri::command]
pub async fn gog_is_logged_in() -> bool {
    gog_importer::is_logged_in().await
}

#[tauri::command]
pub async fn gog_get_display_name() -> Result<String, String> {
    gog_importer::get_display_name()
        .await
        .ok_or_else(|| "Not logged in".to_string())
}

#[tauri::command]
pub async fn confero_test_connection() -> Result<String, String> {
    confero_sync::test_connection().await
}

#[tauri::command]
pub async fn confero_push_games(games_json: String) -> Result<(), String> {
    let games: Vec<confero_sync::SyncGameItem> =
        serde_json::from_str(&games_json).map_err(|e| format!("Invalid games JSON: {}", e))?;
    confero_sync::push_games(games).await
}

#[tauri::command]
pub async fn confero_pull_games(since: Option<String>) -> Result<String, String> {
    let games = confero_sync::pull_games(since).await?;
    serde_json::to_string(&games).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn confero_push_stats(stats_json: String) -> Result<(), String> {
    let stats: Vec<confero_sync::SyncStatItem> =
        serde_json::from_str(&stats_json).map_err(|e| format!("Invalid stats JSON: {}", e))?;
    confero_sync::push_stats(stats).await
}

#[tauri::command]
pub async fn confero_pull_stats(since: Option<String>) -> Result<String, String> {
    let stats = confero_sync::pull_stats(since).await?;
    serde_json::to_string(&stats).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn confero_push_trophies(trophies_json: String) -> Result<(), String> {
    let trophies: Vec<confero_sync::SyncTrophyItem> = serde_json::from_str(&trophies_json)
        .map_err(|e| format!("Invalid trophies JSON: {}", e))?;
    confero_sync::push_trophies(trophies).await
}

#[tauri::command]
pub async fn confero_pull_trophies(since: Option<String>) -> Result<String, String> {
    let trophies = confero_sync::pull_trophies(since).await?;
    serde_json::to_string(&trophies).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn confero_delete_game(source_id: String) -> Result<(), String> {
    confero_sync::delete_remote_game(source_id).await
}

#[tauri::command]
pub async fn confero_full_sync() -> Result<String, String> {
    use chrono::Utc;
    use std::collections::HashSet;

    let conn = establish_connection().map_err(|e| e.to_string())?;

    let raw_categories = query_all_data(&conn, "category").unwrap_or_default();
    let favorites_cat_id: Option<String> = raw_categories
        .iter()
        .find(|c| c.get("name").map(|n| n == "Favorites").unwrap_or(false))
        .and_then(|c| c.get("id"))
        .cloned();
    let favorites_set: HashSet<String> = raw_categories
        .iter()
        .find(|c| c.get("name").map(|n| n == "Favorites").unwrap_or(false))
        .and_then(|c| c.get("games"))
        .map(|g| {
            g.split(',')
                .map(|s| s.trim().to_string())
                .filter(|s| !s.is_empty())
                .collect()
        })
        .unwrap_or_default();

    let last_pull = get_setting_db(&conn, "confero_last_pull");

    let raw_games = query_all_data(&conn, "games").map_err(|e| e.to_string())?;
    let push_time = Utc::now().to_rfc3339();

    let sync_games: Vec<confero_sync::SyncGameItem> = raw_games
        .iter()
        .filter_map(|g| {
            let game_id = g.get("id").cloned().unwrap_or_default();
            let updated_at = g.get("updated_at").cloned().unwrap_or_default();
            let confero_updated_at = g.get("confero_updated_at").cloned();
            let should_push = match &confero_updated_at {
                Some(ts) if !ts.is_empty() => {
                    let updated = chrono::DateTime::parse_from_rfc3339(&updated_at).ok();
                    let confero = chrono::DateTime::parse_from_rfc3339(ts).ok();
                    match (updated, confero) {
                        (Some(u), Some(c)) => {
                            println!("[SYNC][PUSH] Game {}: updated_at = {:?}, confero_updated_at = {:?} => {}", game_id, u, c, u > c);
                            u > c
                        },
                        (Some(u), None) => {
                            println!("[SYNC][PUSH] Game {}: updated_at = {:?}, confero_updated_at = None => true", game_id, u);
                            true
                        },
                        _ => {
                            println!("[SYNC][PUSH] Game {}: Could not parse timestamps, skipping", game_id);
                            false
                        },
                    }
                }
                _ => {
                    println!("[SYNC][PUSH] Game {}: No confero_updated_at, will push", game_id);
                    true
                }
            };
            if should_push {
                let is_favorite = favorites_set.contains(&game_id);
                Some(confero_sync::SyncGameItem {
                    source_id: game_id,
                    game_importer_id: g.get("game_importer_id").cloned().unwrap_or_default(),
                    importer_id: g.get("importer_id").cloned().unwrap_or_default(),
                    igdb_id: g.get("igdb_id").cloned().unwrap_or_default(),
                    name: g.get("name").cloned().unwrap_or_default(),
                    sort_name: g.get("sort_name").cloned().unwrap_or_default(),
                    rating: g.get("rating").cloned().unwrap_or_default(),
                    platforms: g.get("platforms").cloned().unwrap_or_default(),
                    description: g.get("description").cloned().unwrap_or_default(),
                    critic_score: g.get("critic_score").cloned().unwrap_or_default(),
                    genres: g.get("genres").cloned().unwrap_or_default(),
                    styles: g.get("styles").cloned().unwrap_or_default(),
                    release_date: g.get("release_date").cloned().unwrap_or_default(),
                    developers: g.get("developers").cloned().unwrap_or_default(),
                    editors: g.get("editors").cloned().unwrap_or_default(),
                    tags: g.get("tags").cloned().unwrap_or_default(),
                    status: g.get("status").cloned().unwrap_or_default(),
                    trophies: g.get("trophies").cloned().unwrap_or_default(),
                    trophies_unlocked: g.get("trophies_unlocked").cloned().unwrap_or_default(),
                    hidden: g.get("hidden").cloned().unwrap_or_default(),
                    favorite: is_favorite,
                    updated_at: updated_at.clone(),
                })
            } else {
                None
            }
        })
        .collect();

    let pushed_games = sync_games.len();
    if !sync_games.is_empty() {
        confero_sync::push_games(sync_games).await?;
    }

    let raw_stats = query_all_data(&conn, "stats").map_err(|e| e.to_string())?;
    let sync_stats: Vec<confero_sync::SyncStatItem> = raw_stats
        .iter()
        .map(|s| confero_sync::SyncStatItem {
            source_id: s.get("id").cloned().unwrap_or_default(),
            game_source_id: s.get("game_id").cloned().unwrap_or_default(),
            time_played: s.get("time_played").cloned().unwrap_or_default(),
            date_of_play: s.get("date_of_play").cloned().unwrap_or_default(),
        })
        .collect();

    let pushed_stats = sync_stats.len();
    if !sync_stats.is_empty() {
        confero_sync::push_stats(sync_stats).await?;
    }

    let raw_trophies = query_all_data(&conn, "achievements").map_err(|e| e.to_string())?;
    let sync_trophies: Vec<confero_sync::SyncTrophyItem> = raw_trophies
        .iter()
        .map(|t| confero_sync::SyncTrophyItem {
            source_id: t.get("id").cloned().unwrap_or_default(),
            game_source_id: t.get("game_id").cloned().unwrap_or_default(),
            name: t.get("name").cloned().unwrap_or_default(),
            description: t.get("description").cloned().unwrap_or_default(),
            visible: t.get("visible").cloned().unwrap_or_default(),
            date_of_unlock: t.get("date_of_unlock").cloned().unwrap_or_default(),
            importer_id: t.get("importer_id").cloned().unwrap_or_default(),
            image_url_locked: t.get("image_url_locked").cloned().unwrap_or_default(),
            image_url_unlocked: t.get("image_url_unlocked").cloned().unwrap_or_default(),
            unlocked: t.get("unlocked").cloned().unwrap_or_default(),
        })
        .collect();

    let pushed_trophies = sync_trophies.len();
    if !sync_trophies.is_empty() {
        confero_sync::push_trophies(sync_trophies).await?;
    }

    let library_items = confero_sync::pull_library(last_pull)
        .await
        .unwrap_or_else(|e| {
            eprintln!("[confero_sync] pull_library failed: {}", e);
            vec![]
        });

    let igdb_available = {
        let id_ok = env::var("IGDB_CLIENT_ID").is_ok();
        let secret_ok = env::var("IGDB_CLIENT_SECRET").is_ok();
        if id_ok && secret_ok {
            let cid = env::var("IGDB_CLIENT_ID").unwrap();
            let csecret = env::var("IGDB_CLIENT_SECRET").unwrap();
            crate::plugins::igdb::set_credentials(vec![cid, csecret]);
            true
        } else {
            false
        }
    };

    let mut pulled_updated: usize = 0;
    let mut pulled_inserted: usize = 0;

    for item in &library_items {
        if item.title.is_empty() && item.source_id.is_empty() {
            continue;
        }

        let local_id: Option<String> = if !item.source_id.is_empty() {
            let exists: bool = conn
                .query_row(
                    &format!(
                        "SELECT COUNT(*) FROM games WHERE id = '{}'",
                        item.source_id.replace('\'', "''")
                    ),
                    [],
                    |row| row.get(0),
                )
                .unwrap_or(false);
            if exists {
                Some(item.source_id.clone())
            } else {
                None
            }
        } else if !item.igdb_id.is_empty() {
            find_game_by_igdb_id(&conn, &item.igdb_id)
        } else {
            find_game_by_name(&conn, &item.title)
        };

        if let Some(ref local_game_id) = local_id {
            let local_confero_ts_str: Option<String> = conn
                .query_row(
                    &format!(
                        "SELECT confero_updated_at FROM games WHERE id = '{}'",
                        local_game_id.replace('\'', "''")
                    ),
                    [],
                    |row| row.get(0),
                )
                .unwrap_or(None);

            let confero_ts = chrono::DateTime::parse_from_rfc3339(&item.updated_at).ok();
            let local_ts = local_confero_ts_str
                .as_deref()
                .and_then(|s| chrono::DateTime::parse_from_rfc3339(s).ok());

            let should_apply = match (confero_ts, local_ts) {
                (Some(ct), Some(lt)) => {
                    println!("[SYNC][PULL] Game {}: confero.updated_at = {:?}, local.confero_updated_at = {:?} => {}", local_game_id, ct, lt, ct > lt);
                    ct > lt
                }
                (Some(ct), None) => {
                    println!("[SYNC][PULL] Game {}: confero.updated_at = {:?}, local.confero_updated_at = None => true", local_game_id, ct);
                    true
                }
                _ => {
                    println!(
                        "[SYNC][PULL] Game {}: Could not parse timestamps, skipping",
                        local_game_id
                    );
                    false
                }
            };

            if should_apply {
                let meteoric_status = confero_sync::map_confero_status(&item.status);
                match apply_confero_update(
                    &conn,
                    local_game_id,
                    meteoric_status,
                    &item.rating,
                    &item.hidden,
                    &item.updated_at,
                ) {
                    Ok(true) => {
                        pulled_updated += 1;
                        sync_favorites(
                            &conn,
                            local_game_id,
                            item.favorite,
                            &favorites_set,
                            &favorites_cat_id,
                        );

                        let need_enrichment =
                            match crate::file_operations::get_extra_dirs(local_game_id) {
                                Ok(game_dir) => {
                                    use std::path::Path;

                                    let has_image = |name: &str| -> bool {
                                        let exts = ["webp", "gif", "jpg", "jpeg", "png"];
                                        for ext in exts.iter() {
                                            if game_dir.join(format!("{}.{}", name, ext)).exists() {
                                                return true;
                                            }
                                        }
                                        false
                                    };
                                    let jaquette_exists =
                                        has_image("jaquette") || has_image("jaquette_horizontal");
                                    let background_exists = has_image("background");

                                    !(jaquette_exists || background_exists)
                                }
                                Err(_) => false,
                            };

                        if need_enrichment && !item.igdb_id.trim().is_empty() {
                            let _ = crate::plugins::igdb::enrich_from_igdb_id(
                                item.igdb_id.clone(),
                                local_game_id.clone(),
                            )
                            .await;
                        }
                    }
                    Ok(false) => {}
                    Err(e) => {
                        eprintln!(
                            "[confero_sync] update failed for id={}: {}",
                            local_game_id, e
                        );
                    }
                }
            }
            continue;
        }

        let game_data: Option<(String, String, String, String, String, String, String)> =
            if !item.description.is_empty() || !item.igdb_id.is_empty() {
                Some((
                    item.title.clone(),
                    item.description.clone(),
                    item.genres.clone(),
                    item.developers.clone(),
                    item.platforms.clone(),
                    item.release_date.clone(),
                    item.igdb_id.clone(),
                ))
            } else if igdb_available && !item.title.is_empty() {
                match crate::plugins::igdb::search_game(&item.title, true) {
                    Ok(results) if !results.is_empty() => {
                        let v: serde_json::Value =
                            serde_json::from_str(&results[0]).unwrap_or_default();
                        Some((
                            v["name"].as_str().unwrap_or(&item.title).to_string(),
                            v["description"].as_str().unwrap_or("").to_string(),
                            v["genres"].as_str().unwrap_or("").to_string(),
                            v["developers"].as_str().unwrap_or("").to_string(),
                            v["platforms"].as_str().unwrap_or("").to_string(),
                            v["release_date"].as_str().unwrap_or("").to_string(),
                            v["igdb_id"].as_str().unwrap_or(&item.igdb_id).to_string(),
                        ))
                    }
                    Ok(_) => Some((
                        item.title.clone(),
                        String::new(),
                        item.genres.clone(),
                        item.developers.clone(),
                        item.platforms.clone(),
                        item.release_date.clone(),
                        item.igdb_id.clone(),
                    )),
                    Err(e) => {
                        eprintln!(
                            "[confero_sync] IGDB search failed for '{}': {}",
                            item.title, e
                        );
                        Some((
                            item.title.clone(),
                            String::new(),
                            item.genres.clone(),
                            item.developers.clone(),
                            item.platforms.clone(),
                            item.release_date.clone(),
                            item.igdb_id.clone(),
                        ))
                    }
                }
            } else if !item.title.is_empty() {
                Some((
                    item.title.clone(),
                    item.description.clone(),
                    item.genres.clone(),
                    item.developers.clone(),
                    item.platforms.clone(),
                    item.release_date.clone(),
                    item.igdb_id.clone(),
                ))
            } else {
                None
            };

        if let Some((name, description, genres, developers, platforms, release_date, igdb_id)) =
            game_data
        {
            let meteoric_status = confero_sync::map_confero_status(&item.status);
            let new_game = crate::IGame {
                id: "-1".to_string(),
                game_importer_id: String::new(),
                importer_id: String::new(),
                igdb_id,
                name: name.clone(),
                sort_name: name.clone(),
                rating: item.rating.clone(),
                platforms,
                description,
                critic_score: String::new(),
                genres,
                styles: String::new(),
                release_date,
                developers,
                editors: String::new(),
                game_dir: String::new(),
                exec_file: String::new(),
                exec_args: String::new(),
                tags: String::new(),
                status: meteoric_status.to_string(),
                trophies: String::new(),
                trophies_unlocked: String::new(),
                hidden: item.hidden.clone(),
            };

            match update_game(&conn, new_game) {
                Ok(new_id) => {
                    let _ = set_confero_updated_at(&conn, &new_id, &item.updated_at);
                    sync_favorites(
                        &conn,
                        &new_id,
                        item.favorite,
                        &favorites_set,
                        &favorites_cat_id,
                    );
                    pulled_inserted += 1;
                }
                Err(e) => {
                    eprintln!("[confero_sync] insert failed for '{}': {}", name, e);
                }
            }
        }
    }

    let _ = set_settings_db(&conn, "confero_last_pull", &push_time);

    Ok(serde_json::json!({
        "pushed_games":    pushed_games,
        "pushed_stats":    pushed_stats,
        "pushed_trophies": pushed_trophies,
        "pulled_updated":  pulled_updated,
        "pulled_inserted": pulled_inserted,
    })
    .to_string())
}

fn sync_favorites(
    conn: &rusqlite::Connection,
    game_id: &str,
    is_favorite: bool,
    favorites_set: &std::collections::HashSet<String>,
    favorites_cat_id: &Option<String>,
) {
    if let Some(ref cat_id) = favorites_cat_id {
        let in_favorites = favorites_set.contains(game_id);
        if is_favorite && !in_favorites {
            let _ = add_game_to_category_db(conn, game_id.to_string(), cat_id.clone());
        } else if !is_favorite && in_favorites {
            let _ = remove_game_from_category_db(conn, game_id.to_string(), cat_id.clone());
        }
    }
}
