use std::fs;
use std::io::{Read, Write};
use std::path::{Path, PathBuf};

use directories::UserDirs;
use flate2::read::GzDecoder;
use flate2::write::GzEncoder;
use flate2::Compression;
use reqwest::header::{AUTHORIZATION, CONTENT_TYPE};
use serde::{Deserialize, Serialize};

use super::{build_gog_client, ensure_token, get_platform};
use crate::send_message_to_frontend;

const AUTH_URL: &str = "https://auth.gog.com";
const CONTENT_SYSTEM_URL: &str = "https://content-system.gog.com";
const CLOUDSTORAGE_URL: &str = "https://cloudstorage.gog.com";

#[derive(Serialize, Deserialize, Debug, Clone, PartialEq)]
pub enum SaveGameStatus {
    NoSave,
    LocalNewer,
    RemoteNewer,
    SameAge,
    Conflict,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct CloudSaveInfo {
    pub game_id: String,
    pub local_save_path: Option<String>,
    pub remote_save_exists: bool,
    pub status: SaveGameStatus,
    pub local_timestamp: Option<String>,
    pub remote_timestamp: Option<String>,
}

#[derive(Deserialize, Debug)]
struct BuildsResponse {
    items: Vec<BuildItem>,
}

#[derive(Deserialize, Debug)]
struct BuildItem {
    build_id: String,
    #[serde(default)]
    generation: i32,
    link: String,
}

#[derive(Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
struct BuildMeta {
    #[serde(default)]
    client_id: Option<String>,
    #[serde(default)]
    client_secret: Option<String>,
    #[serde(default)]
    cloud_saves: Option<Vec<CloudSaveDef>>,
}

#[derive(Deserialize, Debug)]
struct CloudSaveDef {
    name: String,
    location: String,
}

#[derive(Deserialize, Debug)]
struct CloudTokenResponse {
    access_token: String,
    #[allow(dead_code)]
    expires_in: i64,
    #[allow(dead_code)]
    user_id: String,
}

async fn get_cloud_meta(
    game_id: &str,
    access_token: &str,
) -> Result<(String, String, Vec<CloudSaveDef>), String> {
    let platform = get_platform();
    let url = format!(
        "{}/products/{}/os/{}/builds?generation=2",
        CONTENT_SYSTEM_URL, game_id, platform
    );

    let client = reqwest::Client::builder()
        .gzip(true)
        .build()
        .map_err(|e| format!("Failed to build HTTP client: {}", e))?;
    let resp = client
        .get(&url)
        .header(AUTHORIZATION, format!("Bearer {}", access_token))
        .send()
        .await
        .map_err(|e| format!("Failed to get builds: {}", e))?;

    let builds: BuildsResponse = resp
        .json()
        .await
        .map_err(|e| format!("Failed to parse builds response: {}", e))?;

    let build = builds
        .items
        .first()
        .ok_or("No builds found for this game")?;

    eprintln!(
        "[GOG-CLOUD] Using build: {} (link: {})",
        build.build_id, build.link
    );

    let resp = client
        .get(&build.link)
        .header(AUTHORIZATION, format!("Bearer {}", access_token))
        .send()
        .await
        .map_err(|e| format!("Failed to get build meta: {}", e))?;

    let bytes = resp
        .bytes()
        .await
        .map_err(|e| format!("Failed to read response body: {}", e))?;

    // Check if response is gzip-compressed (starts with 0x1f 0x8b) or zlib (starts with 0x78)
    let body = if bytes.len() >= 2 && bytes[0] == 0x1f && bytes[1] == 0x8b {
        let decompressed_bytes = decompress_gzip(&bytes)?;
        String::from_utf8(decompressed_bytes)
            .map_err(|e| format!("Failed to decode decompressed data as UTF-8: {}", e))?
    } else if bytes.len() >= 2 && bytes[0] == 0x78 {
        // Zlib compression (starts with 0x78)
        let decompressed_bytes = decompress_zlib_to_vec(&bytes)?;
        String::from_utf8(decompressed_bytes)
            .map_err(|e| format!("Failed to decode decompressed data as UTF-8: {}", e))?
    } else {
        String::from_utf8(bytes.to_vec())
            .map_err(|e| format!("Failed to decode response as UTF-8: {}", e))?
    };

    eprintln!(
        "[GOG-CLOUD] Build meta response length: {} bytes",
        body.len()
    );

    if body.contains("\"cloudSaves\"") {
        eprintln!("[GOG-CLOUD] Found 'cloudSaves' field in response");

        if let Some(start) = body.find("\"cloudSaves\"") {
            let snippet = &body[start..std::cmp::min(start + 300, body.len())];
            eprintln!("[GOG-CLOUD] cloudSaves section: {}", snippet);
        }
    } else {
        eprintln!("[GOG-CLOUD] No 'cloudSaves' field found in response");
    }

    let meta: BuildMeta = serde_json::from_str(&body).map_err(|e| {
        let preview = if body.len() > 500 {
            &body[..500]
        } else {
            &body
        };
        eprintln!("[GOG-CLOUD] Parse error: {}", e);
        format!("Failed to parse build meta: {}. Response: {}", e, preview)
    })?;

    eprintln!("[GOG-CLOUD] BuildMeta parsed - client_id: {:?}, client_secret: {:?}, cloud_saves: {} items",
        meta.client_id.as_ref().map(|s| if s.len() > 8 { &s[..8] } else { s }),
        meta.client_secret.as_ref().map(|_| "***"),
        meta.cloud_saves.as_ref().map(|v| v.len()).unwrap_or(0));

    let client_id = meta
        .client_id
        .ok_or("Game does not have cloud save support (no client_id)")?;
    let client_secret = meta
        .client_secret
        .ok_or("Game does not have cloud save support (no client_secret)")?;
    let cloud_saves = meta.cloud_saves.unwrap_or_default();

    Ok((client_id, client_secret, cloud_saves))
}

async fn get_cloud_token(
    user_refresh_token: &str,
    client_id: &str,
    client_secret: &str,
) -> Result<CloudTokenResponse, String> {
    let client = reqwest::Client::builder()
        .gzip(true)
        .build()
        .map_err(|e| format!("Failed to build HTTP client: {}", e))?;
    let resp = client
        .get(&format!("{}/token", AUTH_URL))
        .query(&[
            ("grant_type", "refresh_token"),
            ("client_id", client_id),
            ("client_secret", client_secret),
            ("refresh_token", user_refresh_token),
            ("without_new_session", "1"),
        ])
        .send()
        .await
        .map_err(|e| format!("Failed to get cloud token: {}", e))?;

    resp.json()
        .await
        .map_err(|e| format!("Failed to parse cloud token response: {}", e))
}

pub async fn check_cloud_saves(
    game_id: &str,
    local_save_path: Option<&str>,
) -> Result<CloudSaveInfo, String> {
    let token = tokio::task::block_in_place(|| ensure_token())?;

    let token_json =
        serde_json::to_string(&token).map_err(|e| format!("Failed to serialize token: {}", e))?;
    let token_val: serde_json::Value =
        serde_json::from_str(&token_json).map_err(|e| format!("Failed to parse token: {}", e))?;

    let access_token = token_val["access_token"]
        .as_str()
        .ok_or("Missing access_token")?
        .to_string();
    let refresh_token = token_val["refresh_token"]
        .as_str()
        .ok_or("Missing refresh_token")?
        .to_string();

    let gog = tokio::task::block_in_place(|| build_gog_client(token));
    let user_id = tokio::task::block_in_place(|| gog.uid());

    let (client_id, client_secret, cloud_defs) = match get_cloud_meta(game_id, &access_token).await
    {
        Ok(meta) => meta,
        Err(_) => {
            return Ok(CloudSaveInfo {
                game_id: game_id.to_string(),
                local_save_path: local_save_path.map(|s| s.to_string()),
                remote_save_exists: false,
                status: SaveGameStatus::NoSave,
                local_timestamp: None,
                remote_timestamp: None,
            });
        }
    };

    let cloud_token = get_cloud_token(&refresh_token, &client_id, &client_secret).await?;

    let list_url = format!("{}/v1/{}/{}", CLOUDSTORAGE_URL, user_id, client_id);
    let client = reqwest::Client::builder()
        .gzip(true)
        .build()
        .map_err(|e| format!("Failed to build HTTP client: {}", e))?;
    let resp = client
        .get(&list_url)
        .header(
            AUTHORIZATION,
            format!("Bearer {}", cloud_token.access_token),
        )
        .send()
        .await;

    let remote_save_exists = match resp {
        Ok(r) => r.status().is_success(),
        Err(_) => false,
    };

    let resolved_path = local_save_path.map(|s| s.to_string()).or_else(|| {
        cloud_defs
            .first()
            .map(|def| resolve_cloud_path(&def.location))
    });

    let local_exists = resolved_path
        .as_ref()
        .map(|p| Path::new(p).exists())
        .unwrap_or(false);

    let status = match (local_exists, remote_save_exists) {
        (false, false) => SaveGameStatus::NoSave,
        (true, false) => SaveGameStatus::LocalNewer,
        (false, true) => SaveGameStatus::RemoteNewer,
        (true, true) => SaveGameStatus::Conflict,
    };

    Ok(CloudSaveInfo {
        game_id: game_id.to_string(),
        local_save_path: resolved_path,
        remote_save_exists,
        status,
        local_timestamp: None,
        remote_timestamp: None,
    })
}

pub async fn upload_cloud_saves(game_id: &str, local_save_path: &str) -> Result<(), String> {
    let token = tokio::task::block_in_place(|| ensure_token())?;
    let token_json =
        serde_json::to_string(&token).map_err(|e| format!("Failed to serialize token: {}", e))?;
    let token_val: serde_json::Value =
        serde_json::from_str(&token_json).map_err(|e| format!("Failed to parse token: {}", e))?;

    let access_token = token_val["access_token"]
        .as_str()
        .ok_or("Missing access_token")?
        .to_string();
    let refresh_token = token_val["refresh_token"]
        .as_str()
        .ok_or("Missing refresh_token")?
        .to_string();

    let gog = tokio::task::block_in_place(|| build_gog_client(token));
    let user_id = tokio::task::block_in_place(|| gog.uid());

    let (client_id, client_secret, _) = get_cloud_meta(game_id, &access_token).await?;
    let cloud_token = get_cloud_token(&refresh_token, &client_id, &client_secret).await?;

    let save_path = Path::new(local_save_path);
    if !save_path.exists() {
        return Err(format!(
            "Local save path does not exist: {}",
            local_save_path
        ));
    }

    let http_client = reqwest::Client::builder()
        .gzip(true)
        .build()
        .map_err(|e| format!("Failed to build HTTP client: {}", e))?;

    let files = collect_files(save_path)?;
    let total = files.len();

    for (idx, file_path) in files.iter().enumerate() {
        let relative = file_path
            .strip_prefix(save_path)
            .map_err(|e| e.to_string())?;
        let relative_str = relative.to_string_lossy().replace('\\', "/");

        let mut raw = Vec::new();
        fs::File::open(file_path)
            .map_err(|e| format!("Failed to open file: {}", e))?
            .read_to_end(&mut raw)
            .map_err(|e| format!("Failed to read file: {}", e))?;

        let mut encoder = GzEncoder::new(Vec::new(), Compression::default());
        encoder
            .write_all(&raw)
            .map_err(|e| format!("Failed to compress: {}", e))?;
        let compressed = encoder
            .finish()
            .map_err(|e| format!("Failed to finish compression: {}", e))?;

        let upload_url = format!(
            "{}/v1/{}/{}/{}",
            CLOUDSTORAGE_URL, user_id, client_id, relative_str
        );

        http_client
            .put(&upload_url)
            .header(
                AUTHORIZATION,
                format!("Bearer {}", cloud_token.access_token),
            )
            .header(CONTENT_TYPE, "application/octet-stream")
            .body(compressed)
            .send()
            .await
            .map_err(|e| format!("Failed to upload {}: {}", relative_str, e))?;

        send_message_to_frontend(&format!(
            "[GOG-CLOUD] Uploaded {}/{}: {}",
            idx + 1,
            total,
            relative_str
        ));
    }

    send_message_to_frontend(&format!(
        "[GOG-CLOUD] Upload complete: {} files for game {}",
        total, game_id
    ));

    Ok(())
}

pub async fn download_cloud_saves(game_id: &str, local_save_path: &str) -> Result<(), String> {
    let resolved_save_path = if local_save_path.is_empty() {
        let user_dirs = UserDirs::new().ok_or("Could not determine user directories")?;
        let docs = user_dirs
            .document_dir()
            .ok_or("Could not determine Documents folder")?;
        let default_path = docs.join("GOG Cloud Saves").join(game_id);
        eprintln!(
            "[GOG-CLOUD] No save path provided, using default: {}",
            default_path.display()
        );
        default_path.to_string_lossy().to_string()
    } else {
        local_save_path.to_string()
    };

    let token = tokio::task::block_in_place(|| ensure_token())?;
    let token_json =
        serde_json::to_string(&token).map_err(|e| format!("Failed to serialize token: {}", e))?;
    let token_val: serde_json::Value =
        serde_json::from_str(&token_json).map_err(|e| format!("Failed to parse token: {}", e))?;

    let access_token = token_val["access_token"]
        .as_str()
        .ok_or("Missing access_token")?
        .to_string();
    let refresh_token = token_val["refresh_token"]
        .as_str()
        .ok_or("Missing refresh_token")?
        .to_string();

    let gog = tokio::task::block_in_place(|| build_gog_client(token));
    let user_id = tokio::task::block_in_place(|| gog.uid());

    let (client_id, client_secret, _) = get_cloud_meta(game_id, &access_token).await?;
    let cloud_token = get_cloud_token(&refresh_token, &client_id, &client_secret).await?;

    let http_client = reqwest::Client::builder()
        .gzip(true)
        .build()
        .map_err(|e| format!("Failed to build HTTP client: {}", e))?;

    let list_url = format!("{}/v1/{}/{}", CLOUDSTORAGE_URL, user_id, client_id);
    let resp = http_client
        .get(&list_url)
        .header(
            AUTHORIZATION,
            format!("Bearer {}", cloud_token.access_token),
        )
        .send()
        .await
        .map_err(|e| format!("Failed to list cloud saves: {}", e))?;

    eprintln!("[GOG-CLOUD] List response status: {}", resp.status());

    let bytes = resp
        .bytes()
        .await
        .map_err(|e| format!("Failed to read list response: {}", e))?;

    eprintln!("[GOG-CLOUD] List response length: {} bytes", bytes.len());
    if bytes.len() >= 10 {
        eprintln!("[GOG-CLOUD] First 10 bytes: {:02x?}", &bytes[..10]);
    }

    let body = if bytes.len() >= 2 && bytes[0] == 0x1f && bytes[1] == 0x8b {
        eprintln!("[GOG-CLOUD] List response is gzip-compressed");
        let decompressed = decompress_gzip(&bytes)?;
        String::from_utf8(decompressed)
            .map_err(|e| format!("Failed to decode decompressed list data: {}", e))?
    } else if bytes.len() >= 2 && bytes[0] == 0x78 {
        eprintln!("[GOG-CLOUD] List response is zlib-compressed");
        let decompressed = decompress_zlib_to_vec(&bytes)?;
        String::from_utf8(decompressed)
            .map_err(|e| format!("Failed to decode decompressed list data: {}", e))?
    } else {
        String::from_utf8(bytes.to_vec())
            .map_err(|e| format!("Failed to decode list response as UTF-8: {}", e))?
    };

    eprintln!(
        "[GOG-CLOUD] List response body (first 500 chars): {}",
        if body.len() > 500 {
            &body[..500]
        } else {
            &body
        }
    );

    let file_list: Vec<String> = body
        .lines()
        .map(|s| s.trim())
        .filter(|s| !s.is_empty())
        .map(|s| s.to_string())
        .collect();

    eprintln!(
        "[GOG-CLOUD] Found {} files in cloud storage",
        file_list.len()
    );

    let save_dir = Path::new(local_save_path);
    fs::create_dir_all(save_dir).map_err(|e| format!("Failed to create save dir: {}", e))?;

    let total = file_list.len();
    for (idx, remote_path) in file_list.iter().enumerate() {
        let download_url = format!(
            "{}/v1/{}/{}/{}",
            CLOUDSTORAGE_URL, user_id, client_id, remote_path
        );

        let resp = http_client
            .get(&download_url)
            .header(
                AUTHORIZATION,
                format!("Bearer {}", cloud_token.access_token),
            )
            .send()
            .await
            .map_err(|e| format!("Failed to download {}: {}", remote_path, e))?;

        let compressed = resp
            .bytes()
            .await
            .map_err(|e| format!("Failed to read download response: {}", e))?;

        let decompressed =
            decompress_gzip(&compressed).unwrap_or_else(|_| compressed.as_ref().to_vec());

        let local_path = save_dir.join(remote_path);
        if let Some(parent) = local_path.parent() {
            fs::create_dir_all(parent).ok();
        }
        fs::write(&local_path, &decompressed)
            .map_err(|e| format!("Failed to write save file: {}", e))?;

        send_message_to_frontend(&format!(
            "[GOG-CLOUD] Downloaded {}/{}: {}",
            idx + 1,
            total,
            remote_path
        ));
    }

    send_message_to_frontend(&format!(
        "[GOG-CLOUD] Download complete: {} files for game {}",
        total, game_id
    ));

    Ok(())
}

fn resolve_cloud_path(location: &str) -> String {
    let mut path = location.replace('\\', "/");

    #[cfg(target_os = "windows")]
    {
        let local_appdata = std::env::var("LOCALAPPDATA").unwrap_or_default();
        let appdata = std::env::var("APPDATA").unwrap_or_default();
        let userprofile = std::env::var("USERPROFILE").unwrap_or_default();
        let public = std::env::var("PUBLIC").unwrap_or_default();
        path = path.replace("<%LOCAL_APPDATA%>", &local_appdata);
        path = path.replace(
            "<%APPLICATION_DATA_LOCAL_LOW%>",
            &format!("{}/AppData/LocalLow", userprofile),
        );
        path = path.replace("<%APPLICATION_DATA%>", &appdata);
        path = path.replace("<%SAVED_GAMES%>", &format!("{}/Saved Games", userprofile));
        path = path.replace("<%DOCUMENTS%>", &format!("{}/Documents", userprofile));
        path = path.replace("<%USER_DIR%>", &userprofile);
        path = path.replace("<%PUBLIC_DOCUMENTS%>", &format!("{}/Documents", public));
    }

    #[cfg(target_os = "linux")]
    {
        let home = std::env::var("HOME").unwrap_or_default();
        path = path.replace("<%LOCAL_APPDATA%>", &home);
        path = path.replace("<%APPLICATION_DATA_LOCAL_LOW%>", &home);
        path = path.replace("<%APPLICATION_DATA%>", &home);
        path = path.replace("<%SAVED_GAMES%>", &home);
        path = path.replace("<%DOCUMENTS%>", &format!("{}/Documents", home));
        path = path.replace("<%USER_DIR%>", &home);
    }

    #[cfg(target_os = "macos")]
    {
        let home = std::env::var("HOME").unwrap_or_default();
        path = path.replace(
            "<%LOCAL_APPDATA%>",
            &format!("{}/Library/Application Support", home),
        );
        path = path.replace(
            "<%APPLICATION_DATA_LOCAL_LOW%>",
            &format!("{}/Library/Application Support", home),
        );
        path = path.replace(
            "<%APPLICATION_DATA%>",
            &format!("{}/Library/Application Support", home),
        );
        path = path.replace(
            "<%SAVED_GAMES%>",
            &format!("{}/Library/Application Support", home),
        );
        path = path.replace("<%DOCUMENTS%>", &format!("{}/Documents", home));
        path = path.replace("<%USER_DIR%>", &home);
    }

    path
}

fn collect_files(dir: &Path) -> Result<Vec<PathBuf>, String> {
    let mut files = Vec::new();
    if dir.is_file() {
        files.push(dir.to_path_buf());
        return Ok(files);
    }
    for entry in walkdir::WalkDir::new(dir)
        .into_iter()
        .filter_map(|e| e.ok())
    {
        if entry.file_type().is_file() {
            files.push(entry.into_path());
        }
    }
    Ok(files)
}

fn decompress_gzip(data: &[u8]) -> Result<Vec<u8>, String> {
    let mut decoder = GzDecoder::new(data);
    let mut decompressed = Vec::new();
    decoder
        .read_to_end(&mut decompressed)
        .map_err(|e| format!("Gzip decompression failed: {}", e))?;
    Ok(decompressed)
}

fn decompress_zlib_to_vec(data: &[u8]) -> Result<Vec<u8>, String> {
    use flate2::read::ZlibDecoder;
    let mut decoder = ZlibDecoder::new(data);
    let mut decompressed = Vec::new();
    decoder
        .read_to_end(&mut decompressed)
        .map_err(|e| format!("Zlib decompression failed: {}", e))?;
    Ok(decompressed)
}
