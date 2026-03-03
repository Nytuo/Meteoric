/// Epic Games game launcher — handles launching games with proper EGS authentication.
///
/// Based on legendary's launch_game logic, rewritten in Rust.
/// Uses egs-api for game token and ownership token generation.
use std::path::PathBuf;

use serde::{Deserialize, Serialize};

use super::{ensure_logged_in, get_epic_data_dir, EPIC, INSTALLED_GAMES};
use crate::send_message_to_frontend;

// ──────────────────────────────────────────────
// Launch parameters
// ──────────────────────────────────────────────

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct EpicLaunchParams {
    pub executable: String,
    pub working_directory: String,
    pub game_args: Vec<String>,
    pub egl_args: Vec<String>,
    pub environment: Vec<(String, String)>,
}

// ──────────────────────────────────────────────
// Build launch parameters
// ──────────────────────────────────────────────

/// Build the full set of launch parameters for an Epic game, including
/// authentication exchange code, ownership token, and EGL parameters.
pub async fn get_launch_parameters(
    app_name: &str,
    offline: bool,
) -> Result<EpicLaunchParams, String> {
    println!("[EPIC LAUNCH] ========================================");
    println!("[EPIC LAUNCH] Getting launch parameters for '{}'", app_name);
    
    // 1. Get installed game info
    let installed = {
        let mut games = INSTALLED_GAMES.lock().await;
        println!("[EPIC LAUNCH] INSTALLED_GAMES cache contains {} games", games.len());
        
        if games.is_empty() {
            println!("[EPIC LAUNCH WARNING] INSTALLED_GAMES cache is empty!");
            println!("[EPIC LAUNCH] Attempting to reload cache from disk...");
            drop(games); // Release lock before calling load
            super::load_installed_games().await;
            games = INSTALLED_GAMES.lock().await;
            println!("[EPIC LAUNCH] After reload: cache contains {} games", games.len());
        } else {
            println!("[EPIC LAUNCH] Games in cache:");
            for key in games.keys() {
                println!("[EPIC LAUNCH]   - {}", key);
            }
        }
        
        games.get(app_name).cloned()
    };

    let installed = installed.ok_or_else(|| {
        let err_msg = format!("Game '{}' is not in INSTALLED_GAMES cache", app_name);
        eprintln!("[EPIC LAUNCH ERROR] {}", err_msg);
        println!("[EPIC LAUNCH] ========================================");
        err_msg
    })?;
    
    println!("[EPIC LAUNCH] Found game in cache: install_path={}, executable={}", 
             installed.install_path, installed.executable);
    println!("[EPIC LAUNCH] ========================================");

    let install_path = PathBuf::from(&installed.install_path);
    let game_exe = installed.executable.replace('\\', "/");
    let exe_path = install_path.join(&game_exe);
    let working_dir = exe_path
        .parent()
        .map(|p| p.to_string_lossy().to_string())
        .unwrap_or_else(|| install_path.to_string_lossy().to_string());

    // 2. Game parameters from manifest
    let mut game_args = Vec::new();
    if let Some(ref params) = installed.launch_parameters {
        if !params.is_empty() {
            game_args.extend(
                params
                    .split_whitespace()
                    .map(|s| s.to_string()),
            );
        }
    }

    // 3. EGL authentication parameters
    let mut egl_args = Vec::new();
    let mut game_token = String::new();

    if !offline {
        ensure_logged_in().await?;

        let mut client = EPIC.lock().await;

        // Get exchange code for game authentication
        match client.game_token().await {
            Some(token) => {
                game_token = token.code.clone();
            }
            None => {
                println!("[EPIC-LAUNCH] Warning: Failed to get game token, game may not work online");
            }
        }

        // Get user details
        let ud = client.user_details();
        let account_id = ud.account_id.clone().unwrap_or_default();
        let display_name = ud.display_name.clone().unwrap_or_default();

        egl_args.extend(vec![
            "-AUTH_LOGIN=unused".to_string(),
            format!("-AUTH_PASSWORD={}", game_token),
            "-AUTH_TYPE=exchangecode".to_string(),
            format!("-epicapp={}", app_name),
            "-epicenv=Prod".to_string(),
            "-EpicPortal".to_string(),
            format!("-epicusername={}", display_name),
            format!("-epicuserid={}", account_id),
            format!("-epiclocale={}", "en"),
            format!("-epicsandboxid={}", installed.namespace),
        ]);

        // Ownership token for DRM-protected games
        if installed.requires_ownership_token {
            // Get asset for ownership token
            let asset = {
                let cache = super::ASSET_CACHE.lock().await;
                cache.get(app_name).cloned()
            };

            if let Some(asset) = asset {
                if let Some(ovt) = client.ownership_token(&asset).await {
                    let ovt_dir = get_epic_data_dir().join("ovt");
                    std::fs::create_dir_all(&ovt_dir).ok();
                    let ovt_path = ovt_dir.join(format!(
                        "{}{}.ovt",
                        installed.namespace, installed.catalog_item_id
                    ));
                    let _ = std::fs::write(&ovt_path, ovt.as_bytes());
                    egl_args.push(format!("-epicovt={}", ovt_path.to_string_lossy()));
                }
            }
        }
    } else {
        // Offline mode: still set some parameters
        egl_args.extend(vec![
            "-AUTH_LOGIN=unused".to_string(),
            "-AUTH_PASSWORD=".to_string(),
            "-AUTH_TYPE=exchangecode".to_string(),
            format!("-epicapp={}", app_name),
            "-epicenv=Prod".to_string(),
            "-EpicPortal".to_string(),
        ]);
    }

    Ok(EpicLaunchParams {
        executable: exe_path.to_string_lossy().to_string(),
        working_directory: working_dir,
        game_args,
        egl_args,
        environment: Vec::new(),
    })
}

/// Launch an Epic game. Returns the process ID.
pub async fn launch_epic_game(
    app_name: &str,
    offline: bool,
    extra_args: Vec<String>,
) -> Result<u32, String> {
    let params = get_launch_parameters(app_name, offline).await?;

    send_message_to_frontend(&format!("[EPIC-LAUNCH] Launching {}...", app_name));

    // Build the full argument list
    let mut all_args = Vec::new();
    all_args.extend(params.game_args);
    all_args.extend(extra_args);
    all_args.extend(params.egl_args);

    // Validate executable exists
    if !std::path::Path::new(&params.executable).exists() {
        return Err(format!("Executable not found: {}. The game may not be installed correctly.", params.executable));
    }

    // Launch the process
    let mut cmd = tokio::process::Command::new(&params.executable);
    cmd.current_dir(&params.working_directory);
    cmd.args(&all_args);

    // Set environment variables
    for (key, value) in &params.environment {
        cmd.env(key, value);
    }

    let child = cmd
        .spawn()
        .map_err(|e| {
            if let Some(216) = e.raw_os_error() {
                format!(
                    "Failed to launch {}: Architecture/compatibility error (os error 216). The game executable is not compatible with your Windows version.\n\nSolutions:\n1) Right-click {} → Properties → Compatibility → try Windows 7/8/10 mode\n2) Verify/reinstall the game to fix corrupted files\n3) Install Visual C++ Redistributables (2015-2022)\n4) Check if the game requires 32-bit or 64-bit Windows\n\nTechnical: {}",
                    app_name,
                    params.executable,
                    e
                )
            } else {
                format!("Failed to launch {}: {}", app_name, e)
            }
        })?;

    let pid = child.id().ok_or("Failed to get process ID")?;;

    send_message_to_frontend(&format!("GL-{}", pid));

    // Track the game process in the background
    let app_name_owned = app_name.to_string();
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
        // Find the game by matching exec_args containing the app_name
        let db_games = crate::database::query_data(
            &conn,
            vec!["games"],
            vec!["*"],
            vec![("importer_id", "epic")],
            false,
        );

        if let Ok(db_games) = db_games {
            for game_row in &db_games {
                let exec_args = game_row.get("exec_args").cloned().unwrap_or_default();
                if exec_args.contains(&app_name_owned) {
                    let game_id = game_row.get("id").cloned().unwrap_or_default();
                    crate::database::insert_stat_db(
                        &conn,
                        game_id,
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
