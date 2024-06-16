use std::collections::HashMap;
use std::env;
use rusty_dl::Downloader;
use rusty_dl::errors::DownloadError;
use rusty_dl::youtube::YoutubeDownloader;
use crate::{IGame};
use crate::database::{establish_connection, query_all_data, query_data, update_game};
use crate::file_operations::{create_extra_dirs, get_all_files_in_dir_for, get_all_files_in_dir_for_parsed, get_extra_dirs, remove_file};
use crate::plugins::{igdb, ytdl};

#[tauri::command]
pub fn get_all_games() -> String {
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
pub fn get_all_categories() -> String {
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
pub fn upload_file(file_content: Vec<u8>, type_of: String, id: String) -> Result<(), String> {
    let id = &id;
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
    if type_of != "screenshot" && type_of != "video" && type_of != "audio" && type_of != "background" && type_of != "jaquette" && type_of != "logo" && type_of != "icon" {
        return Err("Type of is not valid".to_string());
    }
    if id.contains("/") || id.contains("\\") {
        return Err("Game name is not valid".to_string());
    }

    create_extra_dirs(&id).unwrap();
    let game_dir = get_extra_dirs(&id).unwrap();

    let get_nb_of_screenshots = std::fs::read_dir(&game_dir.join("screenshots")).unwrap().count() + 1;
    let get_nb_of_videos = std::fs::read_dir(&game_dir.join("videos")).unwrap().count() + 1;
    let file_path = match type_of.as_str() {
        "screenshot" => game_dir.join("screenshots").join("screenshot-".to_string() + &get_nb_of_screenshots.to_string() + ".jpg"),
        "video" => game_dir.join("videos").join("video-".to_string() + &get_nb_of_videos.to_string() + ".mp4"),
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
pub fn delete_element(type_of: String, id: String) -> Result<(), String> {
    let id = &id;
    if id.is_empty() {
        return Err("Game name is empty".to_string());
    }
    if type_of.is_empty() {
        return Err("Type of is empty".to_string());
    }
    if type_of != "screenshot" && type_of != "video" && type_of != "audio" && type_of != "background" && type_of != "jaquette" && type_of != "logo" && type_of != "icon" {
        return Err("Type of is not valid".to_string());
    }
    if id.contains("/") || id.contains("\\") {
        return Err("Game name is not valid".to_string());
    }

    create_extra_dirs(&id).unwrap();
    let game_dir = get_extra_dirs(&id).unwrap();
    let get_nb_of_screenshots = std::fs::read_dir(&game_dir.join("screenshots")).unwrap().count();
    let get_nb_of_videos = std::fs::read_dir(&game_dir.join("videos")).unwrap().count();
    let file_path = match type_of.as_str() {
        "screenshot" => game_dir.join("screenshots").join("screenshot-".to_string() + &get_nb_of_screenshots.to_string() + ".jpg"),
        "video" => game_dir.join("videos").join("video-".to_string() + &get_nb_of_videos.to_string() + ".mp4"),
        "audio" => game_dir.join("musics").join("theme.mp3"),
        _ => game_dir,
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
    let game_ids_from_cat = query_data(&conn, vec!["universe"], vec!["DISTINCT games"], vec![("name", &*("'".to_string() + &category + "'"))], false).unwrap();
    let games = query_data(&conn, vec!["games"], vec!["*"], vec![("id", &game_ids_from_cat[0]["games"])], true).unwrap()
        .iter()
        .map(|row| {
            format!("{:?}", row)
        })
        .collect::<Vec<String>>()
        .join(",");
    format!("[{}]", games)
}

#[tauri::command]
pub fn search_metadata(game_name: String, plugin_name: String) -> String {
    match plugin_name.as_str() {
        "ytdl" => {
            let result = ytdl::search_game(&game_name).unwrap();
            format!("{:?}", result)
        }
        "igdb" => {
            let client_id = env::var("IGDB_CLIENT_ID").expect("IGDB_CLIENT_ID not found");
            let client_secret = env::var("IGDB_CLIENT_SECRET").expect("IGDB_CLIENT_SECRET not found");
            igdb::set_credentials(Vec::from([client_id, client_secret]));
            let result = igdb::search_game(&game_name).unwrap();
            format!("{:?}", result)
        }
        _ => {
            format!("Plugin not found")
        }
    }
}

#[tauri::command]
pub fn get_games_by_id(id: String) -> String {
    let conn = establish_connection().unwrap();
    let game = query_data(&conn, vec!["games"], vec!["*"], vec![("id", &id)], false).unwrap()
        .iter()
        .map(|row| {
            format!("{:?}", row)
        })
        .collect::<Vec<String>>()
        .join(",");
    format!("[{}]", game)
}


#[tauri::command]
pub fn post_game(game: String) -> Result<(), String> {
    let conn = establish_connection().unwrap();
    let game: IGame = serde_json::from_str(&game).map_err(|e| e.to_string())?;

    update_game(&conn, game).expect("Error updating game");
    Ok(())
}


#[tauri::command]
pub async fn save_media_to_external_storage(id: String, game: String) -> Result<(), String> {
    let game: HashMap<String, serde_json::Value> = serde_json::from_str(&game).map_err(|e| e.to_string())?;
    let is_game_id_found = id != "" && id != "undefined" && id != "null" && id != "-1";
    let mut id = &id;
    let new_game_id;
    if !is_game_id_found {
        let latest_game_id = query_all_data(&establish_connection().unwrap(), "games").unwrap().last().unwrap().get("id").unwrap().to_string();
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

    let mut get_nb_of_screenshots = std::fs::read_dir(&game_dir.clone().join("screenshots")).unwrap().count();
    let mut get_nb_of_videos = std::fs::read_dir(&game_dir.clone().join("videos")).unwrap().count();

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
                        let file_path = game_dir.join("screenshots").join("screenshot-".to_string() + &(get_nb_of_screenshots).to_string() + ".jpg");
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
                        let file_path = game_dir.join("videos").join("video-".to_string() + &(get_nb_of_videos).to_string() + ".mp4");
                        let is_youtube = url.contains("youtube.com");

                        if is_youtube {
                            match download_youtube_video(url, video_path.to_str().unwrap().to_string(), "video-".to_string() + &(get_nb_of_videos).to_string()).await {
                                Ok(_) => println!("Youtube video downloaded"),
                                Err(e) => println!("Error downloading youtube video: {:?}", e),
                            }
                        } else {
                            let file_content = cl.get(url).send().await.unwrap().bytes().await.unwrap();
                            if let Err(e) = std::fs::write(&file_path, &file_content) {
                                return Err(format!("Error writing file: {:?}", e));
                            }
                        }
                    }
                }
            }
        } else {
            let url = value.as_str().unwrap();

            if key == "audio" || key == "background" || key == "jaquette" || key == "logo" || key == "icon" {
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
    let game_dir = get_extra_dirs(&id).unwrap().join("musics");

    if let Err(e) = download_youtube_audio(&url, game_dir.to_str().unwrap().to_string(), "theme".to_string()).await {
        return Err(format!("Error downloading youtube audio: {:?}", e));
    }
    Ok(())
}


pub async fn download_youtube_video(url: &str, location: String, name: String) -> Result<(), DownloadError> {
    let downloader = YoutubeDownloader::new(url);
    downloader?.print_dl_status().rename_with_underscores().with_name(name).download_to(&location).await?;
    Ok(())
}

pub async fn download_youtube_audio(url: &str, location: String, name: String) -> Result<(), DownloadError> {
    let downloader = YoutubeDownloader::new(url);
    downloader?.print_dl_status().rename_with_underscores().with_name(name).only_audio().download_to(&location).await?;
    Ok(())
}