use directories::ProjectDirs;
use tauri::utils::html::parse;
use crate::IGame;
use crate::database::{establish_connection, query_all_data, query_data, update_game};
use crate::file_operations::{create_extra_dirs, get_all_files_in_dir_for, get_all_files_in_dir_for_parsed, get_base_extra_dir, parse_game_name, get_extra_dirs, read_extra_dirs_for, write_file, remove_file};

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
pub fn get_all_images_location(game_name: String) -> String {
    if get_all_files_in_dir_for(&game_name, "screenshots").is_err() {
        create_extra_dirs(&game_name).unwrap();
    }
    get_all_files_in_dir_for_parsed(&game_name, "screenshots")
}

#[tauri::command]
pub fn get_all_videos_location(game_name: String) -> String {
    if get_all_files_in_dir_for(&game_name, "videos").is_err() {
        create_extra_dirs(&game_name).unwrap();
    }
    get_all_files_in_dir_for_parsed(&game_name, "videos")
}

#[tauri::command]
pub fn upload_file(file_content: Vec<u8>, type_of: String, game_name: String) -> Result<(), String> {
    let mut game_name =  parse_game_name(&game_name);
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

    create_extra_dirs(&game_name).unwrap();
    let game_dir = get_extra_dirs(&game_name).unwrap();

    let get_nb_of_screenshots = std::fs::read_dir(&game_dir.join("screenshots")).unwrap().count() + 1;
    let get_nb_of_videos = std::fs::read_dir(&game_dir.join("videos")).unwrap().count() + 1;
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

    if let Err(e) = write_file(&file_path, &file_content) {
        return Err(format!("Error writing file: {:?}", e));
    }
    Ok(())
}

#[tauri::command]
pub fn delete_element(type_of: String, game_name: String, element_name: String) -> Result<(), String> {
    let mut game_name = parse_game_name(&game_name);
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

    create_extra_dirs(&game_name).unwrap();
    let game_dir = get_extra_dirs(&game_name).unwrap();
    let get_nb_of_screenshots = std::fs::read_dir(&game_dir.join("screenshots")).unwrap().count();
    let get_nb_of_videos = std::fs::read_dir(&game_dir.join("videos")).unwrap().count();
    let file_path = match type_of.as_str() {
        "screenshot" => game_dir.join("screenshots").join("screenshot-".to_string() + &get_nb_of_screenshots.to_string() + ".jpg"),
        "video" => game_dir.join("videos").join("video-".to_string() + &get_nb_of_videos.to_string() + ".mp4"),
        "audio" => game_dir.join("music").join("theme.mp3"),
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