use anyhow::Context;
use clap::Parser;
use std::collections::HashMap;
use std::fs;
use std::io::prelude::*;

use directories::ProjectDirs;
use std::fs::File;
use std::path::{Path, PathBuf};
use walkdir::WalkDir;

use crate::database::establish_connection;
use crate::database::query_all_data;
use crate::tauri_commander::download_youtube_video;
use crate::IGame;
use crate::Metadata;

mod test;

pub fn create_extra_dirs(id: &str) -> Result<(), Box<dyn std::error::Error>> {
    let id = id;
    let extra_content_dir = create_extra_content_dir()?;
    let game_dir = extra_content_dir.join(id);
    if !game_dir.exists() {
        fs::create_dir_all(game_dir.clone()).unwrap();
    }
    let screenshots_dir = game_dir.join("screenshots");
    if !screenshots_dir.exists() {
        fs::create_dir_all(screenshots_dir).unwrap();
    }

    let videos_dir = game_dir.join("videos");
    if !videos_dir.exists() {
        fs::create_dir_all(videos_dir).unwrap();
    }

    let music_dir = game_dir.join("musics");
    if !music_dir.exists() {
        fs::create_dir_all(music_dir).unwrap();
    }
    Ok(())
}

pub fn remove_file(file_path: &str) -> Result<(), Box<dyn std::error::Error>> {
    match fs::remove_file(file_path) {
        Ok(_) => Ok(()),
        Err(e) => Err(format!("Error removing file: {}", e).into()),
    }
}

pub fn get_extra_dirs(id: &str) -> Result<std::path::PathBuf, Box<dyn std::error::Error>> {
    let game_name = id;
    let extra_content_dir = create_extra_content_dir()?;
    let game_dir = extra_content_dir.join(game_name);
    Ok(game_dir)
}

pub fn get_base_extra_dir() -> Result<std::path::PathBuf, Box<dyn std::error::Error>> {
    let extra_content_dir = create_extra_content_dir()?;
    Ok(extra_content_dir)
}

pub fn read_extra_dirs_for(
    id: &str,
    extra_dir: &str,
) -> Result<std::path::PathBuf, Box<dyn std::error::Error>> {
    let game_name = id;
    let extra_content_dir = create_extra_content_dir()?;
    let game_dir = extra_content_dir.join(game_name);
    let extra_dir = game_dir.join(extra_dir);
    Ok(extra_dir)
}

fn get_all_files_in_dir(
    dir: &std::path::PathBuf,
) -> Result<Vec<std::path::PathBuf>, Box<dyn std::error::Error>> {
    match fs::read_dir(dir) {
        Ok(files) => {
            let mut files_vec = Vec::new();
            for file in files {
                let file = file?;
                files_vec.push(file.path());
            }
            Ok(files_vec)
        }
        Err(e) => Err(e.into()),
    }
}

pub fn get_all_files_in_dir_for(
    id: &str,
    extra_dir: &str,
) -> Result<Vec<std::path::PathBuf>, Box<dyn std::error::Error>> {
    match get_all_files_in_dir(&read_extra_dirs_for(id, extra_dir)?) {
        Ok(files) => Ok(files),
        Err(e) => Err(e.into()),
    }
}

pub fn get_all_files_in_dir_for_parsed(id: &str, extra_dir: &str) -> String {
    let paths = get_all_files_in_dir_for(&id, &extra_dir).unwrap();
    let final_paths = paths
        .iter()
        .map(|path| {
            format!(
                "\"{}\"",
                path.to_str()
                    .unwrap()
                    .replace(get_base_extra_dir().unwrap().to_str().unwrap(), "")
                    .replace("\\", "/")
            )
        })
        .collect::<Vec<String>>()
        .join(",");
    format!("[{}]", final_paths)
}

fn create_extra_content_dir() -> Result<std::path::PathBuf, Box<dyn std::error::Error>> {
    let proj_dirs = ProjectDirs::from("fr", "Nytuo", "Meteoric").unwrap();
    let extra_content_dir = proj_dirs.config_dir().join("meteoric_extra_content");
    if !extra_content_dir.exists() {
        fs::create_dir_all(extra_content_dir.clone()).unwrap();
    }
    Ok(extra_content_dir)
}

pub fn is_folder_empty_recursive(dir: &Path) -> bool {
    let mut files = Vec::new();
    let exclusions = vec![".", "..", "musics", "videos", "screenshots"];
    if fs::read_dir(&dir).is_err() {
        return true;
    }
    for entry in fs::read_dir(dir).unwrap() {
        match entry {
            Ok(entry) => files.push(entry),
            Err(_) => (),
        }
    }
    for file in files.iter() {
        let path = file.path();
        if !exclusions.contains(&path.file_name().unwrap().to_str().unwrap()) {
            return false;
        }
    }
    true
}

pub async fn download_media_files(
    id: &str,
    game: HashMap<String, serde_json::Value>,
) -> Result<(), String> {
    let game_dir = get_extra_dirs(id).unwrap();
    let cl = reqwest::Client::new();

    for (key, value) in game.iter() {
        if value.is_null() || key.is_empty() {
            continue;
        }

        if value.is_array() {
            if key == "screenshots" {
                download_screenshots(&game_dir, &cl, value.as_array().unwrap()).await?;
            } else if key == "videos" {
                download_videos(&game_dir, &cl, value.as_array().unwrap()).await?;
            }
        } else {
            download_single_file(&game_dir, &cl, key, value).await?;
        }
    }

    println!("Game saved");
    Ok(())
}

async fn download_screenshots(
    game_dir: &PathBuf,
    cl: &reqwest::Client,
    screenshots: &Vec<serde_json::Value>,
) -> Result<(), String> {
    let mut get_nb_of_screenshots = fs::read_dir(&game_dir.clone().join("screenshots"))
        .unwrap()
        .count();
    for i in screenshots {
        println!("Downloading: {}", i);
        let url = i.as_str().unwrap();
        get_nb_of_screenshots = get_nb_of_screenshots + 1;
        let file_path = game_dir
            .join("screenshots")
            .join("screenshot-".to_string() + &get_nb_of_screenshots.to_string() + ".jpg");
        let file_content = cl.get(url).send().await.unwrap().bytes().await.unwrap();
        if let Err(e) = fs::write(&file_path, &file_content) {
            return Err(format!("Error writing file: {:?}", e));
        }
    }

    Ok(())
}

async fn download_videos(
    game_dir: &PathBuf,
    cl: &reqwest::Client,
    videos: &Vec<serde_json::Value>,
) -> Result<(), String> {
    let mut get_nb_of_videos = fs::read_dir(&game_dir.clone().join("videos"))
        .unwrap()
        .count();
    for i in videos {
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
            let file_content = cl.get(url).send().await.unwrap().bytes().await.unwrap();
            if let Err(e) = fs::write(&file_path, &file_content) {
                return Err(format!("Error writing file: {:?}", e));
            }
        }
    }
    Ok(())
}

async fn download_single_file(
    game_dir: &PathBuf,
    cl: &reqwest::Client,
    key: &str,
    value: &serde_json::Value,
) -> Result<(), String> {
    let url = value.as_str().unwrap();

    if key == "audio" || key == "background" || key == "jaquette" || key == "logo" || key == "icon"
    {
        println!("Downloading: {}", url);
        if url.is_empty() {
            return Err("Url is empty".to_string());
        }
        let file_content = cl.get(url).send().await.unwrap().bytes().await.unwrap();
        let game_dir_clone = game_dir.clone();
        let file_path = match key {
            "audio" => game_dir_clone.join("musics").join("theme.mp3"),
            "background" => game_dir_clone.join("background.jpg"),
            "jaquette" => game_dir_clone.join("jaquette.jpg"),
            "logo" => game_dir_clone.join("logo.png"),
            "icon" => game_dir_clone.join("icon.png"),
            _ => game_dir_clone,
        };
        if let Err(e) = fs::write(&file_path, &file_content) {
            return Err(format!("Error writing file: {:?}", e));
        }
    }
    Ok(())
}

pub async fn save_media_to_external_storage(id: String, game: Metadata) -> Result<(), String> {
    let game: HashMap<String, serde_json::Value> =
        serde_json::from_str(&serde_json::to_string(&game).unwrap()).map_err(|e| e.to_string())?;
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

    download_media_files(&id, game).await?;

    println!("Game saved");
    Ok(())
}

pub fn have_no_metadata(games: Vec<IGame>) -> Vec<IGame> {
    let mut missing = Vec::new();
    for game in &games {
        let proj_dirs = ProjectDirs::from("fr", "Nytuo", "Meteoric").unwrap();
        let extra_content_dir = proj_dirs.config_dir().join("meteoric_extra_content");
        let game_dir = extra_content_dir.join(game.clone().id);
        let have_content = !is_folder_empty_recursive(game_dir.as_path());
        let have_content_on_db = game.check_if_game_has_minimum_requirements();
        println!("{:?}: {}", game.name, have_content_on_db);
        if !have_content || !have_content_on_db {
            missing.push(game.clone());
        }
    }
    missing
}

fn zip_dir<T, P>(
    it: &mut dyn Iterator<Item = walkdir::DirEntry>,
    prefix: P,
    writer: T,
    method: zip::CompressionMethod,
) -> Result<(), Box<dyn std::error::Error>>
where
    T: Write + Seek,
    P: AsRef<Path>,
{
    let mut zip = zip::ZipWriter::new(writer);
    let options = zip::write::SimpleFileOptions::default()
        .compression_method(method)
        .unix_permissions(0o755);
    let prefix = prefix.as_ref();

    let mut buffer = Vec::new();
    for entry in it {
        let path = entry.path();
        let name = path
            .strip_prefix(prefix)?
            .components()
            .map(|x| x.as_os_str())
            .collect::<Vec<_>>()
            .join(std::ffi::OsStr::new("/"))
            .to_str()
            .context("normalize path in UTF-8 format")?
            .to_string();
        if path.is_file() {
            zip.start_file(name, options)?;
            let mut f = File::open(path)?;
            f.read_to_end(&mut buffer)?;
            zip.write_all(&buffer)?;
            buffer.clear();
        } else if !name.is_empty() {
            zip.add_directory(name, options)?;
        }
    }
    zip.finish()?;
    println!("Zip file created");
    Ok(())
}

fn copy_dir_all(src: impl AsRef<Path>, dst: impl AsRef<Path>) -> anyhow::Result<()> {
    fs::create_dir_all(&dst)?;
    for entry in fs::read_dir(src)? {
        let entry = entry?;
        let ty = entry.file_type()?;
        if ty.is_dir() {
            copy_dir_all(entry.path(), dst.as_ref().join(entry.file_name()))?;
        } else {
            fs::copy(entry.path(), dst.as_ref().join(entry.file_name()))?;
        }
    }
    Ok(())
}

pub fn archive_db_and_extra_content(path: String) -> Result<(), Box<dyn std::error::Error>> {
    let proj_dirs = ProjectDirs::from("fr", "Nytuo", "Meteoric").unwrap();
    let extra_content_dir = proj_dirs.config_dir().join("meteoric_extra_content");
    let archive_dir = proj_dirs.config_dir().join("meteoric_archive");
    if !archive_dir.exists() {
        fs::create_dir_all(archive_dir.clone()).unwrap();
    }
    let db_path = proj_dirs.config_dir().join("meteoric.db");
    let db_archive_path = archive_dir.join("meteoric.db");
    let extra_content_archive_path = archive_dir.join("meteoric_extra_content");
    fs::copy(db_path, db_archive_path)?;
    copy_dir_all(extra_content_dir, extra_content_archive_path)?;

    let path = Path::new(&path);
    let file = File::create(path)?;

    let walkdir = WalkDir::new(&archive_dir);
    let it = walkdir.into_iter();
    zip_dir(
        &mut it.filter_map(|e| e.ok()),
        &archive_dir,
        file,
        zip::CompressionMethod::Stored,
    )?;
    fs::remove_dir_all(&archive_dir)?;
    Ok(())
}

pub fn read_env_file() -> Result<HashMap<String, String>, Box<dyn std::error::Error>> {
    let proj_dirs = ProjectDirs::from("fr", "Nytuo", "Meteoric").unwrap();
    let env_file = proj_dirs.config_dir().join("Meteoric.env");
    if !env_file.exists() {
        return Ok(HashMap::new());
    }
    let mut env_vars = HashMap::new();
    let file = File::open(env_file)?;
    let reader = std::io::BufReader::new(file);
    for line in reader.lines() {
        let line = line?;
        let line = line.trim();
        if line.starts_with("#") || line.is_empty() {
            continue;
        }
        let parts: Vec<&str> = line.split('=').collect();
        env_vars.insert(parts[0].to_string(), parts[1].to_string());
    }
    Ok(env_vars)
}

pub fn write_env_file(env_vars: HashMap<String, String>) -> Result<(), Box<dyn std::error::Error>> {
    let proj_dirs = ProjectDirs::from("fr", "Nytuo", "Meteoric").unwrap();
    let env_file = proj_dirs.config_dir().join("Meteoric.env");
    let mut file = File::create(env_file)?;
    for (key, value) in env_vars.iter() {
        writeln!(file, "{}={}", key, value)?;
    }
    Ok(())
}
