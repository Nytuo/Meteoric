use directories::ProjectDirs;

pub fn create_extra_dirs(game: &str) -> Result<(), Box<dyn std::error::Error>> {
    let mut game_name = parse_game_name(game);
    let extra_content_dir = create_extra_content_dir()?;
    let game_dir = extra_content_dir.join(game_name.clone());
    if !game_dir.exists() {
        std::fs::create_dir_all(game_dir.clone()).unwrap();
    }
    let screenshots_dir = game_dir.join("screenshots");
    if !screenshots_dir.exists() {
        std::fs::create_dir_all(screenshots_dir).unwrap();
    }

    let videos_dir = game_dir.join("videos");
    if !videos_dir.exists() {
        std::fs::create_dir_all(videos_dir).unwrap();
    }

    let music_dir = game_dir.join("musics");
    if !music_dir.exists() {
        std::fs::create_dir_all(music_dir).unwrap();
    }
    Ok(())
}

pub fn remove_file(file_path: &str) -> Result<(), Box<dyn std::error::Error>> {
    match std::fs::remove_file(file_path) {
        Ok(_) => {
            Ok(())
        },
        Err(e) => {
            Err(format!("Error removing file: {}", e).into())
        }
    }
}

pub fn get_extra_dirs(game: &str) -> Result<std::path::PathBuf, Box<dyn std::error::Error>> {
    let mut game_name = parse_game_name(game);
    let extra_content_dir = create_extra_content_dir()?;
    let game_dir = extra_content_dir.join(game_name.clone());
    Ok(game_dir)
}

pub fn parse_game_name(game: &str) -> String {
    let mut game_name = game.to_string();
    game_name = game_name.replace(" ", "_");
    game_name = game_name.replace(":", "_");
    game_name = game_name.to_lowercase();
    game_name
}

pub fn get_base_extra_dir() -> Result<std::path::PathBuf, Box<dyn std::error::Error>> {
    let extra_content_dir = create_extra_content_dir()?;
    Ok(extra_content_dir)
}

pub fn read_extra_dirs_for(game: &str, extra_dir: &str) -> Result<std::path::PathBuf, Box<dyn std::error::Error>> {
    let mut game_name = parse_game_name(game);
    let extra_content_dir = create_extra_content_dir()?;
    let game_dir = extra_content_dir.join(game_name.clone());
    let extra_dir = game_dir.join(extra_dir);
    Ok(extra_dir)
}

fn get_all_files_in_dir(dir: &std::path::PathBuf) -> Result<Vec<std::path::PathBuf>, Box<dyn std::error::Error>> {
    match  std::fs::read_dir(dir) {
        Ok(files) => {
            let mut files_vec = Vec::new();
            for file in files {
                let file = file?;
                files_vec.push(file.path());
            }
            Ok(files_vec)
        },
        Err(e) => {
            Err(e.into())
        }
    }
}

pub fn get_all_files_in_dir_for(game: &str, extra_dir: &str) -> Result<Vec<std::path::PathBuf>, Box<dyn std::error::Error>> {
    match get_all_files_in_dir(&read_extra_dirs_for(game, extra_dir)?) {
        Ok(files) => {
            Ok(files)
        },
        Err(e) => {
            Err(e.into())
        }
    }
}

pub fn get_all_files_in_dir_for_parsed(game: &str, extra_dir: &str) -> String {
    let paths = get_all_files_in_dir_for(&game, &extra_dir).unwrap();
    let final_paths = paths
        .iter()
        .map(|path| {
            format!("\"{}\"", path.to_str().unwrap().replace(get_base_extra_dir().unwrap().to_str().unwrap(), "").replace("\\", "/"))
        })
        .collect::<Vec<String>>()
        .join(",");
    format!("[{}]", final_paths)
}

fn create_extra_content_dir() -> Result<std::path::PathBuf, Box<dyn std::error::Error>> {
    let proj_dirs = ProjectDirs::from("fr", "Nytuo", "universe").unwrap();
    let extra_content_dir = proj_dirs.config_dir().join("universe_extra_content");
    if !extra_content_dir.exists() {
        std::fs::create_dir_all(extra_content_dir.clone()).unwrap();
    }
    Ok(extra_content_dir)
}