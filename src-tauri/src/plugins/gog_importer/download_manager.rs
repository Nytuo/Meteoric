use std::fs;
use std::path::{Path, PathBuf};

use serde::{Deserialize, Serialize};

use super::{
    build_gog_client, ensure_token, get_gog_data_dir, save_installed_games, InstalledGogGame,
    INSTALLED_GAMES,
};
use crate::database::establish_connection;
use crate::send_message_to_frontend;

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct DownloadProgress {
    pub game_id: String,
    pub progress_percent: f64,
    pub downloaded_bytes: u64,
    pub total_bytes: u64,
    pub download_speed_bps: f64,
    pub eta_seconds: u64,
    pub status: DownloadStatus,
    pub current_file: String,
}

#[derive(Serialize, Deserialize, Debug, Clone, PartialEq)]
pub enum DownloadStatus {
    Queued,
    FetchingManifest,
    Downloading,
    Extracting,
    Complete,
    Failed,
    Cancelled,
}

pub async fn download_game(game_id: &str, install_path: &str) -> Result<(), String> {
    send_message_to_frontend(&format!(
        "[GOG-DL-INFO] Starting download for game {}...",
        game_id
    ));

    let game_id_i64: i64 = game_id.parse().map_err(|_| "Invalid game ID".to_string())?;
    let install_path = install_path.to_string();
    let install_path_clone = install_path.clone();
    let game_id_str = game_id.to_string();

    let result =
        tokio::task::block_in_place(move || -> Result<(String, String, PathBuf), String> {
            let token = ensure_token()?;
            let gog = build_gog_client(token);

            let details = gog
                .get_game_details(game_id_i64)
                .map_err(|e| format!("Failed to get game details: {:?}", e))?;

            let title = details.title.clone();

            let install_dir = PathBuf::from(&install_path).join(&sanitize_dirname(&title));
            fs::create_dir_all(&install_dir)
                .map_err(|e| format!("Failed to create install dir: {}", e))?;

            let is_linux = cfg!(target_os = "linux");
            let downloads = details.all(is_linux);

            if downloads.is_empty() {
                return Err("No downloads available for this game on your platform".into());
            }

            send_message_to_frontend(&format!(
                "[GOG-DL-INFO] Downloading {} parts for {}...",
                downloads.len(),
                title
            ));

            let responses = gog.download_game(downloads.clone());
            let download_dir = get_gog_data_dir().join("downloads");
            fs::create_dir_all(&download_dir).ok();

            let mut downloaded_files = Vec::new();
            for (idx, response_result) in responses.into_iter().enumerate() {
                match response_result {
                    Ok(response) => {
                        let filename = format!("{}_{}.bin", game_id_str, idx);
                        let file_path = download_dir.join(&filename);

                        let bytes = response
                            .bytes()
                            .map_err(|e| format!("Failed to read download response: {}", e))?;

                        fs::write(&file_path, &bytes)
                            .map_err(|e| format!("Failed to write installer file: {}", e))?;

                        downloaded_files.push(file_path);

                        send_message_to_frontend(&format!(
                            "[GOG-DL-PROGRESS] Part {}/{} downloaded ({:.2} MB)",
                            idx + 1,
                            downloads.len(),
                            bytes.len() as f64 / 1_048_576.0
                        ));
                    }
                    Err(e) => {
                        return Err(format!("Download failed for part {}: {:?}", idx, e));
                    }
                }
            }

            let version = downloads
                .first()
                .and_then(|d| d.version.clone())
                .unwrap_or_else(|| "unknown".to_string());

            send_message_to_frontend(&format!(
                "[GOG-DL-INFO] Installers downloaded to: {}",
                download_dir.display()
            ));

            send_message_to_frontend(&format!(
                "[GOG-DL-INFO] Please run the installer manually to complete installation: {}",
                downloaded_files
                    .first()
                    .map(|p| p.display().to_string())
                    .unwrap_or_default()
            ));

            Ok((title, version, download_dir))
        });

    let (title, version, installer_dir) = result?;

    send_message_to_frontend(&format!(
        "[GOG-DL-COMPLETE]{}|{}|{}",
        game_id,
        title,
        installer_dir.display()
    ));

    Ok(())
}

pub async fn uninstall_game(game_id: &str) -> Result<(), String> {
    let installed = {
        let mut games = INSTALLED_GAMES.lock().await;
        games.remove(game_id)
    };

    if let Some(game) = installed {
        if Path::new(&game.install_path).exists() {
            fs::remove_dir_all(&game.install_path)
                .map_err(|e| format!("Failed to remove install dir: {}", e))?;
        }

        save_installed_games().await;

        let conn = establish_connection().unwrap();
        let db_games = crate::database::query_data(
            &conn,
            vec!["games"],
            vec!["*"],
            vec![("importer_id", "gog")],
            false,
        );

        if let Ok(db_games) = db_games {
            for game_row in &db_games {
                let game_importer_id = game_row
                    .get("game_importer_id")
                    .cloned()
                    .unwrap_or_default();
                if game_importer_id == game_id {
                    let db_game_id = game_row.get("id").cloned().unwrap_or_default();
                    let sql = format!(
                        "UPDATE games SET exec_file = '', game_dir = '' WHERE id = '{}'",
                        db_game_id
                    );
                    let _ = conn.execute(&sql, []);
                    break;
                }
            }
        }

        send_message_to_frontend(&format!("[GOG-DL-UNINSTALL]{}", game_id));
        Ok(())
    } else {
        Err(format!("Game {} is not installed", game_id))
    }
}

fn extract_installer(file_path: &Path, dest_dir: &Path) -> Result<(), String> {
    let file = fs::File::open(file_path).map_err(|e| format!("Failed to open installer: {}", e))?;

    match zip::ZipArchive::new(file) {
        Ok(mut archive) => {
            for i in 0..archive.len() {
                let mut entry = archive
                    .by_index(i)
                    .map_err(|e| format!("Failed to read archive entry: {}", e))?;

                let entry_path = match entry.enclosed_name() {
                    Some(path) => path.to_path_buf(),
                    None => continue,
                };

                let output_path = dest_dir.join(&entry_path);

                if entry.is_dir() {
                    fs::create_dir_all(&output_path).ok();
                } else {
                    if let Some(parent) = output_path.parent() {
                        fs::create_dir_all(parent).ok();
                    }
                    let mut outfile = fs::File::create(&output_path)
                        .map_err(|e| format!("Failed to create file: {}", e))?;
                    std::io::copy(&mut entry, &mut outfile)
                        .map_err(|e| format!("Failed to extract file: {}", e))?;
                }
            }
            Ok(())
        }
        Err(_) => Err("Not a zip archive, copying installer directly".into()),
    }
}

fn sanitize_dirname(name: &str) -> String {
    name.chars()
        .map(|c| match c {
            '/' | '\\' | ':' | '*' | '?' | '"' | '<' | '>' | '|' => '_',
            _ => c,
        })
        .collect()
}

fn detect_executable(install_dir: &Path) -> Option<String> {
    if let Ok(entries) = fs::read_dir(install_dir) {
        for entry in entries.flatten() {
            let name = entry.file_name().to_string_lossy().to_string();
            if name.starts_with("goggame-") && name.ends_with(".info") {
                if let Ok(contents) = fs::read_to_string(entry.path()) {
                    if let Ok(info) = serde_json::from_str::<serde_json::Value>(&contents) {
                        if let Some(play_tasks) = info.get("playTasks").and_then(|v| v.as_array()) {
                            for task in play_tasks {
                                if let Some(path) = task.get("path").and_then(|v| v.as_str()) {
                                    return Some(path.to_string());
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    #[cfg(target_os = "windows")]
    {
        if let Ok(entries) = walkdir::WalkDir::new(install_dir)
            .max_depth(2)
            .into_iter()
            .collect::<Result<Vec<_>, _>>()
        {
            for entry in entries {
                let path = entry.path();
                if path.extension().map(|e| e == "exe").unwrap_or(false) {
                    let name = path.file_name().unwrap_or_default().to_string_lossy();

                    let lower = name.to_lowercase();
                    if lower.contains("unins")
                        || lower.contains("setup")
                        || lower.contains("install")
                        || lower.contains("redist")
                    {
                        continue;
                    }
                    if let Ok(rel) = path.strip_prefix(install_dir) {
                        return Some(rel.to_string_lossy().to_string());
                    }
                }
            }
        }
    }

    None
}

fn dir_size(path: &Path) -> u64 {
    walkdir::WalkDir::new(path)
        .into_iter()
        .filter_map(|e| e.ok())
        .filter(|e| e.file_type().is_file())
        .filter_map(|e| e.metadata().ok())
        .map(|m| m.len())
        .sum()
}
