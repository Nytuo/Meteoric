use directories::ProjectDirs;
use reqwest::Client;
use std::env;
use std::fs;
use std::path::PathBuf;

// ---------------------------------------------------------------------------
// Binary path helpers
// ---------------------------------------------------------------------------

pub fn get_ytdlp_path() -> PathBuf {
    let proj_dirs = ProjectDirs::from("fr", "Nytuo", "Meteoric")
        .expect("Cannot resolve project directories");
    let binary_name = if cfg!(target_os = "windows") {
        "yt-dlp.exe"
    } else {
        "yt-dlp"
    };
    proj_dirs.config_dir().join(binary_name)
}

// ---------------------------------------------------------------------------
// Version helpers
// ---------------------------------------------------------------------------

/// Fetches the latest yt-dlp release tag from GitHub (e.g. "2024.04.09").
async fn get_latest_version(client: &Client) -> Result<String, Box<dyn std::error::Error>> {
    let resp = client
        .get("https://api.github.com/repos/yt-dlp/yt-dlp/releases/latest")
        .header("User-Agent", "Meteoric/1.0")
        .send()
        .await?;
    let json: serde_json::Value = resp.json().await?;
    let tag = json["tag_name"]
        .as_str()
        .ok_or("GitHub response missing tag_name")?
        .to_string();
    Ok(tag)
}

/// Returns the installed yt-dlp version string, or `None` if the binary is
/// absent or fails to run.
async fn get_installed_version() -> Option<String> {
    let path = get_ytdlp_path();
    if !path.exists() {
        return None;
    }
    let output = tokio::process::Command::new(&path)
        .arg("--version")
        .output()
        .await
        .ok()?;
    let version = String::from_utf8(output.stdout)
        .ok()?
        .trim()
        .to_string();
    if version.is_empty() {
        None
    } else {
        Some(version)
    }
}

// ---------------------------------------------------------------------------
// Download / install
// ---------------------------------------------------------------------------

/// Downloads the yt-dlp binary for the current platform and saves it to the
/// config directory.
async fn download_ytdlp(client: &Client, tag: &str) -> Result<(), Box<dyn std::error::Error>> {
    let os = env::consts::OS;
    let asset_name = match os {
        "windows" => "yt-dlp.exe",
        "macos" => "yt-dlp_macos",
        _ => "yt-dlp",
    };

    let url = format!(
        "https://github.com/yt-dlp/yt-dlp/releases/download/{}/{}",
        tag, asset_name
    );

    println!("[yt-dlp] Downloading from {}", url);

    let response = client.get(&url).send().await?;
    if !response.status().is_success() {
        return Err(format!(
            "Failed to download yt-dlp: HTTP {}",
            response.status()
        )
        .into());
    }
    let bytes = response.bytes().await?;

    let path = get_ytdlp_path();
    // Ensure parent directory exists
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent)?;
    }
    fs::write(&path, &bytes)?;

    // Make the binary executable on Unix platforms
    #[cfg(unix)]
    {
        use std::os::unix::fs::PermissionsExt;
        let mut perms = fs::metadata(&path)?.permissions();
        perms.set_mode(0o755);
        fs::set_permissions(&path, perms)?;
    }

    println!("[yt-dlp] Installed to {:?}", path);
    Ok(())
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/// Called at application start-up.
/// - If yt-dlp is absent  → downloads the latest release.
/// - If yt-dlp is present → checks the installed version against the latest  
///   GitHub release and updates if out-of-date.
///
/// Errors are non-fatal and are printed to stdout.
pub async fn check_and_update_ytdlp() {
    let client = Client::builder()
        .timeout(std::time::Duration::from_secs(30))
        .build()
        .unwrap_or_default();

    let latest = match get_latest_version(&client).await {
        Ok(v) => v,
        Err(e) => {
            eprintln!("[yt-dlp] Could not fetch latest version: {}", e);
            return;
        }
    };

    let installed = get_installed_version().await;

    match installed {
        None => {
            println!("[yt-dlp] Binary not found – downloading version {}", latest);
            if let Err(e) = download_ytdlp(&client, &latest).await {
                eprintln!("[yt-dlp] Download failed: {}", e);
            }
        }
        Some(ref v) if v == &latest => {
            println!("[yt-dlp] Already up-to-date ({})", v);
        }
        Some(ref v) => {
            println!("[yt-dlp] Updating {} → {}", v, latest);
            if let Err(e) = download_ytdlp(&client, &latest).await {
                eprintln!("[yt-dlp] Update failed: {}", e);
            }
        }
    }
}

/// Download a YouTube (or any yt-dlp-supported) URL as an MP3 audio file.
///
/// `output_path` should be the **full file path** including the `.mp3`
/// extension (e.g. `.../musics/theme.mp3`).
pub async fn download_audio(
    url: &str,
    output_path: &str,
) -> Result<(), String> {
    let ytdlp = get_ytdlp_path();
    if !ytdlp.exists() {
        return Err("yt-dlp binary not found. Please restart the app to trigger the download.".to_string());
    }

    let output = tokio::process::Command::new(&ytdlp)
        .args([
            "-x",
            "--audio-format", "mp3",
            "--audio-quality", "0",
            "--no-playlist",
            "-o", output_path,
            url,
        ])
        .output()
        .await
        .map_err(|e| format!("Failed to spawn yt-dlp: {}", e))?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(format!("yt-dlp audio error: {}", stderr));
    }
    println!("[yt-dlp] Audio downloaded to {}", output_path);
    Ok(())
}

/// Download a YouTube (or any yt-dlp-supported) URL as an MP4 video file.
///
/// `output_dir` is the directory; `name` is the file stem (without extension).
pub async fn download_video(
    url: &str,
    output_dir: &str,
    name: &str,
) -> Result<(), String> {
    let ytdlp = get_ytdlp_path();
    if !ytdlp.exists() {
        return Err("yt-dlp binary not found. Please restart the app to trigger the download.".to_string());
    }

    // Build the output template so yt-dlp writes <name>.mp4
    let output_template = format!("{}/{}.%(ext)s", output_dir, name);

    let output = tokio::process::Command::new(&ytdlp)
        .args([
            "-S", "res:480,+codec:h264",
            "--merge-output-format", "mp4",
            "--no-playlist",
            "-o", &output_template,
            url,
        ])
        .output()
        .await
        .map_err(|e| format!("Failed to spawn yt-dlp: {}", e))?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(format!("yt-dlp video error: {}", stderr));
    }
    println!("[yt-dlp] Video downloaded to {}/{}.mp4", output_dir, name);
    Ok(())
}
