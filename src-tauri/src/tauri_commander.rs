use std::collections::HashMap;
use std::env;
use std::path::PathBuf;
use std::time::Duration;

use rusty_ytdl::{
    Video, VideoError, VideoOptions, VideoQuality, VideoSearchOptions,
};
use tokio::process::Command;
use tokio::task;
use tokio::time::Instant;

use crate::{IGame, routine, send_message_to_frontend};
use crate::database::{
    add_category, add_game_to_category_db, establish_connection, get_all_fields, query_all_data, query_data, remove_game_from_category_db, update_game,
};
use crate::file_operations::{
    create_extra_dirs, get_all_files_in_dir_for, get_all_files_in_dir_for_parsed, get_extra_dirs,
    remove_file,
};
use crate::plugins::{epic_importer, gog_importer, igdb, steam_grid, steam_importer, ytdl};

#[tauri::command]
pub fn get_all_games() -> String {
    let conn = establish_connection().unwrap();
    let games = query_all_data(&conn, "games")
        .unwrap()
        .iter()
        .map(|row| format!("{:?}", row))
        .collect::<Vec<String>>()
        .join(",");
    format!("[{}]", games)
}

#[tauri::command]
pub fn get_all_categories() -> String {
    let conn = establish_connection().unwrap();
    let category = query_all_data(&conn, "universe")
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
pub async fn add_game_to_category(
    game_id: String,
    category_id: String,
) -> Result<(), String> {
    let conn = establish_connection().unwrap();
    println!("Game id: {}, Category id: {}", game_id, category_id);
    let _ = add_game_to_category_db(&conn, game_id, category_id);
    Ok(())
}

#[tauri::command]
pub async fn remove_game_from_category(
    game_id: String,
    category_id: String,
) -> Result<(), String> {
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
pub async fn upload_csv_to_db(data: Vec<HashMap<String, String>>) -> Result<(), String> {
    println!("{:?}", data);
    let conn = establish_connection().unwrap();
    for row in data {
        let json_map: serde_json::Map<String, serde_json::Value> = row
            .into_iter()
            .map(|(k, v)| (k, serde_json::Value::String(v)))
            .collect();
        println!("{:?}", json_map);
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
        println!("{:?}", game);
        update_game(&conn, game).expect("Error updating game");
    }
    Ok(())
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
    if type_of != "screenshot"
        && type_of != "video"
        && type_of != "audio"
        && type_of != "background"
        && type_of != "jaquette"
        && type_of != "logo"
        && type_of != "icon"
    {
        return Err("Type of is not valid".to_string());
    }
    if id.contains("/") || id.contains("\\") {
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
        return Err("Game id is empty".to_string());
    }
    if type_of.is_empty() {
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
        return Err("Type of is not valid".to_string());
    }
    if id.contains("/") || id.contains("\\") {
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
        return Err("File does not exist".to_string());
    }

    if let Err(e) = remove_file(&file_path.to_str().unwrap()) {
        return Err(format!("Error removing file: {:?}", e));
    }

    Ok(())
}

#[tauri::command]
pub fn get_games_by_category(category: String) -> String {
    let conn = establish_connection().unwrap();
    let game_ids_from_cat = query_data(
        &conn,
        vec!["universe"],
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
    )
    .unwrap()
    .iter()
    .map(|row| format!("{:?}", row))
    .collect::<Vec<String>>()
    .join(",");
    format!("[{}]", games)
}

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
        _ => {
            "Plugin not found".to_string()
        }
    }
}

#[tauri::command]
pub async fn import_library(plugin_name: String, creds: Vec<String>) {
    // ADD API HERE
    match plugin_name.as_str() {
        "epic_importer" => {
            epic_importer::set_credentials(creds).await;
            epic_importer::get_games_from_user().await.expect("Failed to get games");
        }
        "steam_importer" => {
            let api_key = env::var("STEAM_API_KEY").expect("STEAM_API_KEY not found");
            let mut creds_temp = Vec::new();
            for i in creds {
                creds_temp.push(i.clone());
            }
            creds_temp.push(api_key.clone());
            steam_importer::set_credentials(creds_temp).await;
            steam_importer::get_games_from_user().await.expect("Failed to get games");
        }
        "gog_importer" => {
            gog_importer::set_credentials(creds).await;
            gog_importer::get_games_from_user().await.expect("Failed to get games");
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
    format!("[{}]", game)
}

#[tauri::command]
pub fn post_game(game: String) -> Result<String, String> {
    let conn = establish_connection().unwrap();
    let game: IGame = serde_json::from_str(&game).map_err(|e| e.to_string())?;

    let id = update_game(&conn, game).expect("Error updating game");
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
        send_message_to_frontend(&format!("O-GL-{:?}", pid));
        let date = chrono::Local::now().format("%Y-%m-%d %H:%M:%S").to_string();
        game_object.last_time_played = date;
        let _ = update_game(&conn, game_object.clone());
        // add a timer to count the time played
        let mut game_timer = GameTimer::new();
        game_timer.start();
        let _ = cmd.wait().await;
        game_timer.stop();
        let played_time_u128: u128 = game_timer.get_total_time_played().as_millis();
        let time_played_db: u128 = game_object.time_played.parse().unwrap_or(0);
        let time_played = time_played_db + played_time_u128;
        game_object.time_played = time_played.to_string();
        let _ = update_game(&conn, game_object.clone());
        send_message_to_frontend(&format!("O-GL-END-{}", pid));
        Ok(pid)
    } else {
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
        Ok(())
    } else {
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
        Ok(())
    } else {
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
        return Err("Game name is empty".to_string());
    }
    if game.is_empty() {
        return Err("Urls are empty".to_string());
    }
    if id.contains("/") || id.contains("\\") {
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
                            "screenshot-".to_string()
                                + &get_nb_of_screenshots.to_string()
                                + ".jpg",
                        );
                        let file_content = cl.get(url).send().await.unwrap().bytes().await.unwrap();
                        if let Err(e) = std::fs::write(&file_path, &file_content) {
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
                                Ok(_) => println!("Youtube video downloaded"),
                                Err(e) => println!("Error downloading youtube video: {:?}", e),
                            }
                        } else {
                            let file_content =
                                cl.get(url).send().await.unwrap().bytes().await.unwrap();
                            if let Err(e) = std::fs::write(&file_path, &file_content) {
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
        return Err("Game name is empty".to_string());
    }
    if url.is_empty() {
        return Err("Url is empty".to_string());
    }
    if id.contains("/") || id.contains("\\") {
        return Err("Game name is not valid".to_string());
    }

    create_extra_dirs(&id).unwrap();
    let game_dir = get_extra_dirs(&id)
        .unwrap()
        .join("musics")
        .join("theme.mp3");

    send_message_to_frontend("YT_BG_MUSIC: Begin");
    if let Err(e) = download_youtube_audio(&url, game_dir).await {
        return Err(format!("Error downloading youtube audio: {:?}", e));
    }
    send_message_to_frontend("YT_BG_MUSIC: Done");

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
        Ok(_) => Ok(()),
        Err(err) => {
            println!("Error downloading video: {}", err);
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
        Ok(_) => Ok(()),
        Err(err) => {
            println!("Error downloading video: {}", err);
            Err(VideoError::DownloadError(err.to_string()))
        }
    }
}
