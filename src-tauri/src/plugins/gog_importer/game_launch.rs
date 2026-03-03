/// GOG game launcher — handles launching GOG games.
///
/// GOG games are DRM-free so no authentication tokens are needed for launch.
/// Game launch info comes from goggame-{id}.info files in the install directory.
use std::path::PathBuf;

use serde::{Deserialize, Serialize};

use super::INSTALLED_GAMES;
use crate::send_message_to_frontend;

// ──────────────────────────────────────────────
// Launch parameters
// ──────────────────────────────────────────────

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct GogLaunchParams {
    pub executable: String,
    pub working_directory: String,
    pub game_args: Vec<String>,
}

/// PlayTask from goggame-{id}.info
#[derive(Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
struct GogGameInfo {
    #[serde(default)]
    play_tasks: Vec<PlayTask>,
}

#[derive(Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
struct PlayTask {
    #[serde(default)]
    is_primary: bool,
    #[serde(default)]
    path: String,
    #[serde(default)]
    arguments: Option<String>,
    #[serde(default)]
    working_dir: Option<String>,
    #[serde(default)]
    name: Option<String>,
    #[serde(rename = "type")]
    #[serde(default)]
    task_type: Option<String>,
}

// ──────────────────────────────────────────────
// Build launch parameters
// ──────────────────────────────────────────────

pub async fn get_launch_parameters(game_id: &str) -> Result<GogLaunchParams, String> {
    let installed = {
        let mut games = INSTALLED_GAMES.lock().await;

        if games.is_empty() {
            drop(games);
            super::load_installed_games().await;
            games = INSTALLED_GAMES.lock().await;
        }

        games.get(game_id).cloned()
    };

    let installed = installed.ok_or_else(|| format!("Game '{}' is not installed", game_id))?;
    let install_path = PathBuf::from(&installed.install_path);

    // Try to find launch info from goggame-{id}.info
    let info_file = install_path.join(format!("goggame-{}.info", game_id));
    if info_file.exists() {
        if let Ok(contents) = std::fs::read_to_string(&info_file) {
            if let Ok(info) = serde_json::from_str::<GogGameInfo>(&contents) {
                // Find the primary play task, or the first FileExecute task
                let task = info
                    .play_tasks
                    .iter()
                    .find(|t| t.is_primary)
                    .or_else(|| {
                        info.play_tasks.iter().find(|t| {
                            t.task_type.as_deref() != Some("URLTask") && !t.path.is_empty()
                        })
                    });

                if let Some(task) = task {
                    let exe_path = install_path.join(&task.path);
                    let working_dir = if let Some(ref wd) = task.working_dir {
                        install_path.join(wd).to_string_lossy().to_string()
                    } else {
                        exe_path
                            .parent()
                            .map(|p| p.to_string_lossy().to_string())
                            .unwrap_or_else(|| install_path.to_string_lossy().to_string())
                    };

                    let mut args = Vec::new();
                    if let Some(ref task_args) = task.arguments {
                        args.extend(task_args.split_whitespace().map(|s| s.to_string()));
                    }

                    return Ok(GogLaunchParams {
                        executable: exe_path.to_string_lossy().to_string(),
                        working_directory: working_dir,
                        game_args: args,
                    });
                }
            }
        }
    }

    // Fallback to the stored executable
    if !installed.executable.is_empty() {
        let exe_path = install_path.join(&installed.executable);
        let working_dir = if let Some(ref wd) = installed.working_dir {
            wd.clone()
        } else {
            exe_path
                .parent()
                .map(|p| p.to_string_lossy().to_string())
                .unwrap_or_else(|| install_path.to_string_lossy().to_string())
        };

        let mut args = Vec::new();
        if let Some(ref params) = installed.launch_parameters {
            args.extend(params.split_whitespace().map(|s| s.to_string()));
        }

        return Ok(GogLaunchParams {
            executable: exe_path.to_string_lossy().to_string(),
            working_directory: working_dir,
            game_args: args,
        });
    }

    Err(format!(
        "No executable found for game '{}'. The game may not be installed correctly.",
        game_id
    ))
}

/// Launch a GOG game. Returns the process ID.
pub async fn launch_gog_game(
    game_id: &str,
    extra_args: Vec<String>,
) -> Result<u32, String> {
    let params = get_launch_parameters(game_id).await?;

    send_message_to_frontend(&format!("[GOG-LAUNCH] Launching {}...", game_id));

    // Build argument list
    let mut all_args = Vec::new();
    all_args.extend(params.game_args);
    all_args.extend(extra_args);

    // Validate executable exists
    if !std::path::Path::new(&params.executable).exists() {
        return Err(format!(
            "Executable not found: {}. The game may not be installed correctly.",
            params.executable
        ));
    }

    // Launch the process
    let mut cmd = tokio::process::Command::new(&params.executable);
    cmd.current_dir(&params.working_directory);
    cmd.args(&all_args);

    let child = cmd.spawn().map_err(|e| {
        if let Some(216) = e.raw_os_error() {
            format!(
                "Failed to launch game: Architecture/compatibility error (os error 216). The game executable is not compatible with your system.\n\nTechnical: {}",
                e
            )
        } else {
            format!("Failed to launch game: {}", e)
        }
    })?;

    let pid = child.id().ok_or("Failed to get process ID")?;

    send_message_to_frontend(&format!("GL-{}", pid));

    // Track the game process in the background for playtime
    let game_id_owned = game_id.to_string();
    tokio::spawn(async move {
        let mut child = child;
        let start = std::time::Instant::now();
        let date = chrono::Local::now()
            .format("%Y-%m-%d %H:%M:%S")
            .to_string();
        let _ = child.wait().await;
        let elapsed_ms = start.elapsed().as_millis();

        // Record play time
        let conn = crate::database::establish_connection().unwrap();
        let db_games = crate::database::query_data(
            &conn,
            vec!["games"],
            vec!["*"],
            vec![("importer_id", "gog")],
            false,
        );

        if let Ok(db_games) = db_games {
            for game_row in &db_games {
                let exec_args = game_row.get("exec_args").cloned().unwrap_or_default();
                if exec_args.contains(&game_id_owned) {
                    let db_id = game_row.get("id").cloned().unwrap_or_default();
                    crate::database::insert_stat_db(
                        &conn,
                        db_id,
                        elapsed_ms.to_string(),
                        date.clone(),
                    );
                    break;
                }
            }
        }

        send_message_to_frontend(&format!("GL-END-{}", pid));
    });

    Ok(pid)
}
