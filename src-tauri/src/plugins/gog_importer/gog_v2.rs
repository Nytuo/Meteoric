/// GOG Content System V2 - Modern depot-based download system
///
/// This module implements the GOG Galaxy 2.0+ content delivery system which uses:
/// - Build manifests with depot information
/// - Compressed chunk downloads from CDN
/// - Zlib decompression
/// - Direct extraction to install directory (no installer needed)
/// - Differential updates and resume support

use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fs;
use std::io::Write;
use std::path::{Path, PathBuf};

use super::{ensure_token, build_gog_client, InstalledGogGame, INSTALLED_GAMES};
use crate::send_message_to_frontend;

const GOG_CONTENT_SYSTEM: &str = "https://content-system.gog.com";
const GOG_CDN: &str = "https://gog-cdn-fastly.gog.com";

/// Converts a hash into GOG's galaxy path format: hash[0:2]/hash[2:4]/hash
fn galaxy_path(hash: &str) -> String {
    if hash.contains('/') {
        hash.to_string()
    } else {
        format!("{}/{}/{}", &hash[0..2], &hash[2..4], hash)
    }
}

// ──────────────────────────────────────────────
// API Response Types
// ──────────────────────────────────────────────

#[derive(Deserialize, Debug)]
struct BuildsResponse {
    total_count: i32,
    items: Vec<BuildItem>,
}

#[derive(Deserialize, Debug, Clone)]
struct BuildItem {
    build_id: String,
    product_id: String,
    os: String,
    branch: Option<String>,
    version_name: String,
    tags: Vec<String>,
    #[serde(default)]
    public: bool,
    date_published: String,
    generation: i32,
    link: String,
}

#[derive(Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
struct BuildMeta {
    base_product_id: String,
    #[serde(default)]
    client_id: Option<String>,
    #[serde(default)]
    client_secret: Option<String>,
    install_directory: String,
    platform: String,
    depots: Vec<DepotInfo>,
    #[serde(default)]
    dependencies: Vec<String>,
}

#[derive(Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
struct DepotInfo {
    product_id: String,
    languages: Vec<String>,
    #[serde(default)]
    os_bitness: Option<Vec<String>>,
    manifest: String,
    #[serde(default)]
    size: Option<u64>,
    #[serde(default)]
    compressed_size: Option<u64>,
}

#[derive(Deserialize, Debug)]
struct DepotManifest {
    depot: DepotManifestData,
}

#[derive(Deserialize, Debug)]
struct DepotManifestData {
    items: Vec<ManifestItem>,
}

#[derive(Deserialize, Debug)]
#[serde(untagged)]
enum ManifestItem {
    File {
        #[serde(rename = "type")]
        item_type: String,
        path: String,
        #[serde(default)]
        flags: Vec<String>,
        chunks: Vec<ChunkInfo>,
        #[serde(default)]
        md5: Option<String>,
    },
    Directory {
        #[serde(rename = "type")]
        item_type: String,
        path: String,
    },
    Link {
        #[serde(rename = "type")]
        item_type: String,
        path: String,
        target: String,
    },
}

#[derive(Deserialize, Debug, Clone)]
struct ChunkInfo {
    #[serde(rename = "compressedMd5")]
    compressed_md5: String,
    #[serde(rename = "compressedSize")]
    compressed_size: u64,
    md5: String,
    size: u64,
}

#[derive(Deserialize, Debug)]
struct SecureLinkResponse {
    #[serde(default)]
    urls: Vec<SecureLinkUrl>,
}

#[derive(Deserialize, Debug, Clone)]
struct SecureLinkUrl {
    endpoint_name: String,
    url_format: String,
    parameters: HashMap<String, serde_json::Value>,
    priority: i32,
}

impl SecureLinkUrl {
    fn build_url(&self) -> String {
        let mut url = self.url_format.clone();
        
        // Replace all {parameter} placeholders with their values
        for (key, value) in &self.parameters {
            let placeholder = format!("{{{}}}", key);
            let value_str = match value {
                serde_json::Value::String(s) => s.clone(),
                serde_json::Value::Number(n) => n.to_string(),
                _ => value.to_string(),
            };
            url = url.replace(&placeholder, &value_str);
        }
        
        url
    }
}

impl SecureLinkResponse {
    fn get_urls(self) -> Vec<String> {
        let mut urls: Vec<_> = self.urls.into_iter()
            .map(|u| (u.priority, u.build_url()))
            .collect();
        
        // Sort by priority (higher first)
        urls.sort_by(|a, b| b.0.cmp(&a.0));
        
        // Return just the URLs
        urls.into_iter().map(|(_, url)| url).collect()
    }
    
    fn get_sorted_endpoints(self) -> Vec<SecureLinkUrl> {
        let mut endpoints = self.urls;
        endpoints.sort_by(|a, b| b.priority.cmp(&a.priority));
        endpoints
    }
}

/// Build a chunk download URL by appending the galaxy_path of the chunk hash
/// to the path parameter of a secure link endpoint, then substituting all parameters.
fn build_chunk_url(endpoint: &SecureLinkUrl, chunk_hash: &str) -> String {
    let mut params = endpoint.parameters.clone();
    
    // Append the galaxy_path of the chunk to the path parameter
    if let Some(path_val) = params.get_mut("path") {
        let current_path = match path_val {
            serde_json::Value::String(s) => s.clone(),
            _ => path_val.to_string(),
        };
        *path_val = serde_json::Value::String(format!("{}/{}", current_path, galaxy_path(chunk_hash)));
    }
    
    // Build URL with modified parameters
    let mut url = endpoint.url_format.clone();
    for (key, value) in &params {
        let placeholder = format!("{{{}}}", key);
        let value_str = match value {
            serde_json::Value::String(s) => s.clone(),
            serde_json::Value::Number(n) => n.to_string(),
            _ => value.to_string(),
        };
        url = url.replace(&placeholder, &value_str);
    }
    
    url
}

// ──────────────────────────────────────────────
// Download State
// ──────────────────────────────────────────────

#[derive(Serialize, Clone)]
pub struct DownloadProgress {
    pub game_id: String,
    pub progress_percent: f64,
    pub downloaded_bytes: u64,
    pub total_bytes: u64,
    pub download_speed_bps: f64,
    pub eta_seconds: u64,
    pub current_file: String,
}

// ──────────────────────────────────────────────
// Main Download Function
// ──────────────────────────────────────────────

pub async fn download_game_v2(
    game_id: &str,
    install_path: &str,
    language: Option<String>,
) -> Result<(), String> {
    send_message_to_frontend(&format!(
        "[GOG-V2-INFO] Starting Content System v2 download for game {}...",
        game_id
    ));

    let game_id_i64: i64 = game_id
        .parse()
        .map_err(|_| "Invalid game ID".to_string())?;

    // Step 1: Get available builds
    let builds = fetch_builds(game_id_i64, "windows").await?;
    if builds.items.is_empty() {
        return Err("No builds available for this game".into());
    }

    // Use the first (latest) build
    let build = builds.items[0].clone();
    send_message_to_frontend(&format!(
        "[GOG-V2-INFO] Using build {} (version: {})",
        build.build_id, build.version_name
    ));

    // Step 2: Fetch build metadata
    let meta = fetch_build_meta(&build.link).await?;
    send_message_to_frontend(&format!(
        "[GOG-V2-INFO] Install directory: {}",
        meta.install_directory
    ));

    // Step 3: Prepare install directory
    let install_dir = PathBuf::from(install_path).join(&meta.install_directory);
    fs::create_dir_all(&install_dir)
        .map_err(|e| format!("Failed to create install directory: {}", e))?;

    // Step 4: Filter depots by language
    let target_lang = language.unwrap_or_else(|| "en-US".to_string());
    let selected_depots: Vec<_> = meta
        .depots
        .into_iter()
        .filter(|depot| {
            depot.languages.contains(&"*".to_string())
                || depot.languages.contains(&target_lang)
        })
        .collect();

    send_message_to_frontend(&format!(
        "[GOG-V2-INFO] Found {} depots for language {}",
        selected_depots.len(),
        target_lang
    ));

    // Step 5: Calculate total size
    let total_size: u64 = selected_depots
        .iter()
        .filter_map(|d| d.compressed_size)
        .sum();
    send_message_to_frontend(&format!(
        "[GOG-V2-INFO] Total download size: {:.2} GB",
        total_size as f64 / 1024.0 / 1024.0 / 1024.0
    ));

    // Step 6: Get secure links for downloading
    let secure_links = get_secure_links(game_id_i64).await?;

    // Step 7: Download and extract each depot
    let mut downloaded_bytes = 0u64;
    for (idx, depot) in selected_depots.iter().enumerate() {
        send_message_to_frontend(&format!(
            "[GOG-V2-INFO] Processing depot {}/{} ({})",
            idx + 1,
            selected_depots.len(),
            depot.product_id
        ));

        download_depot(
            &depot,
            &secure_links,
            &install_dir,
            &mut downloaded_bytes,
            total_size,
            game_id,
        )
        .await?;
    }

    // Step 8: Detect executable
    let executable = detect_executable(&install_dir).unwrap_or_default();

    // Step 9: Register as installed
    let installed_game = InstalledGogGame {
        game_id: game_id.to_string(),
        install_path: install_dir.to_string_lossy().to_string(),
        title: meta.install_directory.clone(),
        version: build.version_name,
        executable: executable.clone(),
        install_size: calculate_dir_size(&install_dir),
        platform: "windows".to_string(),
        cloud_save_folder: None,
        launch_parameters: None,
        working_dir: None,
    };

    {
        let mut games = INSTALLED_GAMES.lock().await;
        games.insert(game_id.to_string(), installed_game);
    }
    super::save_installed_games().await;

    send_message_to_frontend(&format!("[GOG-V2-COMPLETE]{}", game_id));

    Ok(())
}

// ──────────────────────────────────────────────
// Helper Functions
// ──────────────────────────────────────────────

async fn fetch_builds(game_id: i64, platform: &str) -> Result<BuildsResponse, String> {
    let url = format!(
        "{}/products/{}/os/{}/builds?generation=2",
        GOG_CONTENT_SYSTEM, game_id, platform
    );

    let token = tokio::task::block_in_place(|| ensure_token())?;
    let client = reqwest::Client::builder()
        .gzip(true)
        .build()
        .map_err(|e| format!("Failed to build HTTP client: {}", e))?;

    let response = client
        .get(&url)
        .bearer_auth(token.access_token)
        .send()
        .await
        .map_err(|e| format!("Failed to fetch builds: {}", e))?;

    if !response.status().is_success() {
        return Err(format!("Failed to fetch builds: HTTP {}", response.status()));
    }

    // Get response as bytes to handle compression
    let bytes = response
        .bytes()
        .await
        .map_err(|e| format!("Failed to read builds response body: {}", e))?;

    // Check for compression and decompress if needed
    let body = if bytes.len() >= 2 && bytes[0] == 0x1f && bytes[1] == 0x8b {
        decompress_gzip(&bytes)?
    } else if bytes.len() >= 2 && bytes[0] == 0x78 {
        let decompressed = decompress_zlib(&bytes)?;
        String::from_utf8(decompressed)
            .map_err(|e| format!("Failed to decode decompressed builds as UTF-8: {}", e))?
    } else {
        String::from_utf8(bytes.to_vec())
            .map_err(|e| format!("Failed to decode builds response as UTF-8: {}", e))?
    };

    serde_json::from_str::<BuildsResponse>(&body)
        .map_err(|e| format!("Failed to parse builds response: {}", e))
}

async fn fetch_build_meta(link: &str) -> Result<BuildMeta, String> {
    let token = tokio::task::block_in_place(|| ensure_token())?;
    
    let client = reqwest::Client::builder()
        .gzip(true)
        .build()
        .map_err(|e| format!("Failed to build HTTP client: {}", e))?;

    let response = client
        .get(link)
        .bearer_auth(&token.access_token)
        .send()
        .await
        .map_err(|e| format!("Failed to fetch build meta: {}", e))?;

    if !response.status().is_success() {
        return Err(format!("Failed to fetch build meta: HTTP {}", response.status()));
    }

    // Get response as bytes
    let bytes = response
        .bytes()
        .await
        .map_err(|e| format!("Failed to read response body: {}", e))?;

    eprintln!("[GOG V2] Response length: {} bytes", bytes.len());
    if bytes.len() >= 10 {
        eprintln!("[GOG V2] First 10 bytes: {:02x?}", &bytes[..10]);
    }

    // Check if response is gzip-compressed (starts with 0x1f 0x8b)
    let body = if bytes.len() >= 2 && bytes[0] == 0x1f && bytes[1] == 0x8b {
        eprintln!("[GOG V2] Response is gzip-compressed, decompressing...");
        decompress_gzip(&bytes)?
    } else if bytes.len() >= 2 && bytes[0] == 0x78 {
        // Zlib compression (starts with 0x78)
        eprintln!("[GOG V2] Response is zlib-compressed, decompressing...");
        let decompressed = decompress_zlib(&bytes)?;
        String::from_utf8(decompressed)
            .map_err(|e| format!("Failed to decode decompressed data as UTF-8: {}", e))?
    } else {
        eprintln!("[GOG V2] Response is not compressed, decoding as UTF-8...");
        String::from_utf8(bytes.to_vec())
            .map_err(|e| format!("Failed to decode response as UTF-8: {}", e))?
    };

    eprintln!("[GOG V2] Build meta response (first 500 chars): {}", 
        if body.len() > 500 { &body[..500] } else { &body });

    // Parse JSON
    let meta = serde_json::from_str::<BuildMeta>(&body)
        .map_err(|e| {
            eprintln!("[GOG V2] Parse error: {}", e);
            eprintln!("[GOG V2] Full response: {}", body);
            format!("Failed to parse build meta: {}", e)
        })?;
    
    eprintln!("[GOG V2] BuildMeta parsed successfully - client_id: {:?}, client_secret: {:?}", 
        meta.client_id.as_ref().map(|s| if s.len() > 8 { &s[..8] } else { s }),
        meta.client_secret.as_ref().map(|_| "***"));
    
    Ok(meta)
}

async fn get_secure_links(game_id: i64) -> Result<Vec<SecureLinkUrl>, String> {
    let url = format!(
        "{}/products/{}/secure_link?generation=2&path=/&_version=2",
        GOG_CONTENT_SYSTEM, game_id
    );

    // Try with existing token first
    let mut token = tokio::task::block_in_place(|| ensure_token())?;

    let client = reqwest::Client::builder()
        .gzip(true)
        .build()
        .map_err(|e| format!("Failed to build HTTP client: {}", e))?;

    let mut response = client
        .get(&url)
        .bearer_auth(&token.access_token)
        .send()
        .await
        .map_err(|e| format!("Failed to get secure links: {}", e))?;

    // If we get 401, try refreshing the token once
    if response.status() == 401 {
        eprintln!("[GOG V2] Token expired, attempting to refresh...");
        token = tokio::task::block_in_place(|| {
            use super::refresh_and_save_token;
            refresh_and_save_token(&token)
        })?;

        response = client
            .get(&url)
            .bearer_auth(&token.access_token)
            .send()
            .await
            .map_err(|e| format!("Failed to get secure links after token refresh: {}", e))?;
    }

    if !response.status().is_success() {
        eprintln!("[GOG V2] Secure links request failed with status: {}", response.status());
        return Err(format!(
            "Failed to get secure links: HTTP {}. Please try logging out and back in.",
            response.status()
        ));
    }

    // Get response as bytes to handle compression
    let bytes = response
        .bytes()
        .await
        .map_err(|e| format!("Failed to read secure links response body: {}", e))?;

    // Check for compression and decompress if needed
    let body = if bytes.len() >= 2 && bytes[0] == 0x1f && bytes[1] == 0x8b {
        eprintln!("[GOG V2] Secure links response is gzip-compressed, decompressing...");
        decompress_gzip(&bytes)?
    } else if bytes.len() >= 2 && bytes[0] == 0x78 {
        eprintln!("[GOG V2] Secure links response is zlib-compressed, decompressing...");
        let decompressed = decompress_zlib(&bytes)?;
        String::from_utf8(decompressed)
            .map_err(|e| format!("Failed to decode decompressed secure links as UTF-8: {}", e))?
    } else {
        String::from_utf8(bytes.to_vec())
            .map_err(|e| format!("Failed to decode secure links response as UTF-8: {}", e))?
    };

    eprintln!("[GOG V2] Secure links response: {}", body);

    let link_response = serde_json::from_str::<SecureLinkResponse>(&body)
        .map_err(|e| {
            eprintln!("[GOG V2] Failed to parse secure links JSON: {}", e);
            format!("Failed to parse secure link response: {}", e)
        })?;

    let endpoints = link_response.get_sorted_endpoints();
    eprintln!("[GOG V2] Got {} secure link endpoints", endpoints.len());
    for (i, ep) in endpoints.iter().enumerate() {
        eprintln!("[GOG V2] Endpoint {}: {} (priority {})", i + 1, ep.endpoint_name, ep.priority);
    }

    Ok(endpoints)
}

async fn download_depot(
    depot: &DepotInfo,
    secure_links: &[SecureLinkUrl],
    install_dir: &Path,
    downloaded_bytes: &mut u64,
    total_bytes: u64,
    game_id: &str,
) -> Result<(), String> {
    // Manifests are fetched directly from the CDN meta path (no auth needed)
    let manifest_url = format!(
        "{}/content-system/v2/meta/{}",
        GOG_CDN,
        galaxy_path(&depot.manifest)
    );
    
    eprintln!("[GOG V2] Fetching manifest from: {}", manifest_url);
    let manifest = fetch_depot_manifest(&manifest_url).await?;

    // Process each file in the manifest
    for item in manifest.depot.items {
        match item {
            ManifestItem::File {
                path,
                chunks,
                flags,
                ..
            } => {
                if flags.contains(&"support".to_string()) {
                    continue; // Skip support files
                }

                let file_path = install_dir.join(path.replace("\\", "/"));
                if let Some(parent) = file_path.parent() {
                    fs::create_dir_all(parent).ok();
                }

                download_and_assemble_file(&file_path, &chunks, &secure_links, downloaded_bytes, total_bytes, game_id).await?;
            }
            ManifestItem::Directory { path, .. } => {
                let dir_path = install_dir.join(path.replace("\\", "/"));
                fs::create_dir_all(dir_path).ok();
            }
            ManifestItem::Link { .. } => {
                // Skip symlinks for now
            }
        }
    }

    Ok(())
}

async fn fetch_depot_manifest(url: &str) -> Result<DepotManifest, String> {
    let client = reqwest::Client::builder()
        .gzip(true)
        .build()
        .map_err(|e| format!("Failed to build HTTP client: {}", e))?;
    let response = client
        .get(url)
        .send()
        .await
        .map_err(|e| format!("Failed to fetch depot manifest: {}", e))?;

    let status = response.status();
    eprintln!("[GOG V2] Manifest response status: {}", status);
    
    let bytes = response
        .bytes()
        .await
        .map_err(|e| format!("Failed to read manifest bytes: {}", e))?;

    eprintln!("[GOG V2] Manifest response size: {} bytes", bytes.len());
    if !bytes.is_empty() {
        let preview = &bytes[..bytes.len().min(20)];
        eprintln!("[GOG V2] Manifest first bytes: {:02x?}", preview);
    }

    // Check if data is compressed
    let decompressed = if bytes.len() >= 2 && bytes[0] == 0x78 {
        eprintln!("[GOG V2] Manifest is zlib compressed");
        decompress_zlib(&bytes)?
    } else if bytes.len() >= 2 && bytes[0] == 0x1f && bytes[1] == 0x8b {
        eprintln!("[GOG V2] Manifest is gzip compressed");
        let decompressed_str = decompress_gzip(&bytes)?;
        decompressed_str.into_bytes()
    } else {
        eprintln!("[GOG V2] Manifest is not compressed");
        bytes.to_vec()
    };

    // Parse JSON
    serde_json::from_slice::<DepotManifest>(&decompressed)
        .map_err(|e| {
            // Show first part of response for debugging
            let preview = String::from_utf8_lossy(&decompressed[..decompressed.len().min(500)]);
            format!("Failed to parse depot manifest: {}\nResponse preview: {}", e, preview)
        })
}

async fn download_and_assemble_file(
    file_path: &Path,
    chunks: &[ChunkInfo],
    secure_links: &[SecureLinkUrl],
    downloaded_bytes: &mut u64,
    total_bytes: u64,
    game_id: &str,
) -> Result<(), String> {
    let mut file = fs::File::create(file_path)
        .map_err(|e| format!("Failed to create file {:?}: {}", file_path, e))?;

    let client = reqwest::Client::builder()
        .gzip(true)
        .build()
        .map_err(|e| format!("Failed to build HTTP client: {}", e))?;

    for chunk in chunks {
        // Construct chunk URL by copying the endpoint and appending galaxy_path to the path parameter
        let chunk_url = build_chunk_url(&secure_links[0], &chunk.compressed_md5);

        // Download chunk
        let response = client
            .get(&chunk_url)
            .send()
            .await
            .map_err(|e| format!("Failed to download chunk: {}", e))?;

        let compressed_data = response
            .bytes()
            .await
            .map_err(|e| format!("Failed to read chunk data: {}", e))?;

        // Decompress chunk
        let decompressed = decompress_zlib(&compressed_data)?;

        // Write to file
        file.write_all(&decompressed)
            .map_err(|e| format!("Failed to write chunk to file: {}", e))?;

        // Update progress
        *downloaded_bytes += chunk.compressed_size;
        let progress = (*downloaded_bytes as f64 / total_bytes as f64) * 100.0;

        send_message_to_frontend(&format!(
            "[GOG-V2-PROGRESS]{}|{:.1}|{}",
            game_id,
            progress,
            file_path.file_name().unwrap_or_default().to_string_lossy()
        ));
    }

    Ok(())
}

fn decompress_zlib(data: &[u8]) -> Result<Vec<u8>, String> {
    use flate2::read::ZlibDecoder;
    use std::io::Read;

    let mut decoder = ZlibDecoder::new(data);
    let mut decompressed = Vec::new();
    decoder
        .read_to_end(&mut decompressed)
        .map_err(|e| format!("Failed to decompress zlib data: {}", e))?;

    Ok(decompressed)
}

fn decompress_gzip(data: &[u8]) -> Result<String, String> {
    use flate2::read::GzDecoder;
    use std::io::Read;

    let mut decoder = GzDecoder::new(data);
    let mut decompressed = String::new();
    decoder
        .read_to_string(&mut decompressed)
        .map_err(|e| format!("Failed to decompress gzip data: {}", e))?;

    Ok(decompressed)
}

fn detect_executable(dir: &Path) -> Option<String> {
    // Look for .exe files in the root directory
    if let Ok(entries) = fs::read_dir(dir) {
        for entry in entries.flatten() {
            if let Some(name) = entry.file_name().to_str() {
                if name.ends_with(".exe") && !name.to_lowercase().contains("unins") {
                    return Some(name.to_string());
                }
            }
        }
    }
    None
}

fn calculate_dir_size(dir: &Path) -> u64 {
    walkdir::WalkDir::new(dir)
        .into_iter()
        .filter_map(|e| e.ok())
        .filter_map(|e| e.metadata().ok())
        .filter(|m| m.is_file())
        .map(|m| m.len())
        .sum()
}
