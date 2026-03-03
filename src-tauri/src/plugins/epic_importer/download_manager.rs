/// Epic Games download manager — handles downloading, installing, and updating games.
///
/// Based on the legendary Python project's download architecture, rewritten in Rust.
/// Uses egs-api for manifest fetching, then handles chunk downloading and file assembly.
use std::collections::HashMap;
use std::fs;
use std::io::Write;
use std::path::{Path, PathBuf};

use serde::{Deserialize, Serialize};
use tokio::sync::mpsc;

use super::{
    ensure_logged_in, get_manifests_dir, save_installed_games, InstalledEpicGame, EPIC,
    INSTALLED_GAMES,
};
use crate::database::establish_connection;
use crate::send_message_to_frontend;

// ──────────────────────────────────────────────
// Download progress types
// ──────────────────────────────────────────────

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct DownloadProgress {
    pub app_name: String,
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
    Writing,
    Verifying,
    Complete,
    Failed,
    Cancelled,
}

// ──────────────────────────────────────────────
// Chunk management
// ──────────────────────────────────────────────

/// Returns the chunk directory name for a given manifest version (matches legendary's get_chunk_dir).
fn chunk_dir_for_version(version: u128) -> &'static str {
    if version >= 15 { "ChunksV4" }
    else if version >= 6 { "ChunksV3" }
    else if version >= 3 { "ChunksV2" }
    else { "Chunks" }
}

/// Builds a fallback CDN URL when the manifest binary does not embed a SourceURL/BaseUrl.
/// Format matches egs-api's download_links(): {base}/{chunk_dir}/{group:02}/{hash:016X}_{GUID}.chunk
fn build_fallback_chunk_url(base: &str, chunk_dir: &str, group: u128, hash: u128, guid: &str) -> String {
    let (path, query) = match base.find('?') {
        Some(pos) => (&base[..pos], Some(&base[pos..])),
        None => (base, None),
    };
    let url = format!(
        "{}/{}/{:02}/{:016X}_{}.chunk",
        path.trim_end_matches('/'),
        chunk_dir,
        group,
        hash,
        guid.to_uppercase()
    );
    match query {
        Some(q) => format!("{}{}", url, q),
        None => url,
    }
}

// ──────────────────────────────────────────────
// Download & Install
// ──────────────────────────────────────────────

/// Download and install a game given its app_name and install directory.
/// Sends progress events to the frontend via `send_message_to_frontend`.
pub async fn download_game(
    app_name: &str,
    install_path: &str,
    progress_sender: Option<mpsc::Sender<DownloadProgress>>,
) -> Result<(), String> {
    ensure_logged_in().await?;

    send_progress(
        &progress_sender,
        app_name,
        DownloadStatus::FetchingManifest,
        0.0,
        0,
        0,
        0.0,
        0,
        "Fetching manifest...",
    )
    .await;

    send_message_to_frontend(&format!(
        "[EPIC-DL-INFO] Fetching manifest for {}...",
        app_name
    ));

    // 1. Get the asset from cache or fetch it
    let asset = {
        let cache = super::ASSET_CACHE.lock().await;
        cache.get(app_name).cloned()
    };

    let asset = match asset {
        Some(a) => a,
        None => {
            // Try fetching assets list
            let assets = super::fetch_assets().await?;
            assets
                .into_iter()
                .find(|a| a.app_name == app_name)
                .ok_or_else(|| format!("Asset not found for {}", app_name))?
        }
    };

    // 2. Get the download manifest via egs-api
    let (download_manifest, base_urls, asset_info) = {
        let mut client = EPIC.lock().await;
        let platform = super::get_platform();

        // Get asset manifest (contains CDN URLs)
        // Platform is "Windows" (64-bit) for Windows, "Mac" for macOS.
        // Most games support "Windows" platform. Very old games might only have "Win32"
        // but those are rare and would require manual --platform override.
        let asset_manifest = client
            .asset_manifest(
                Some(platform),
                None,
                Some(asset.namespace.clone()),
                Some(asset.catalog_item_id.clone()),
                Some(asset.app_name.clone()),
            )
            .await;

        let asset_manifest = asset_manifest
            .ok_or_else(|| {
                format!(
                    "Failed to get asset manifest for {} (platform: {}). \
                     The game may not be available for this platform, or the download metadata is missing.",
                    app_name, super::get_platform()
                )
            })?;

        // Extract base URLs from manifests
        let mut base_urls: Vec<String> = Vec::new();
        for element in &asset_manifest.elements {
            for manifest in &element.manifests {
                let mut url_str = manifest.uri.to_string();
                // Remove the manifest filename from the URL to get the base
                if let Some(pos) = url_str.rfind('/') {
                    url_str.truncate(pos);
                }
                // Add query params if present
                let query_string: String = manifest
                    .query_params
                    .iter()
                    .map(|qp| format!("{}={}", qp.name, qp.value))
                    .collect::<Vec<_>>()
                    .join("&");
                if !query_string.is_empty() {
                    url_str = format!("{}?{}", url_str, query_string);
                }
                base_urls.push(url_str);
            }
        }

        // Download the actual manifest binary
        let download_manifests = client.asset_download_manifests(asset_manifest).await;

        if download_manifests.is_empty() {
            return Err(format!("No download manifests found for {}", app_name));
        }

        // Get asset info for metadata
        let info = client.asset_info(&asset).await;

        (download_manifests[0].clone(), base_urls, info)
    };

    // 3. Parse manifest and compute download
    let files = download_manifest.files();
    let total_size = download_manifest.total_download_size() as u64;
    let total_install_size = download_manifest.total_size() as u64;

    send_message_to_frontend(&format!(
        "[EPIC-DL-INFO] {} — {} files, {:.2} MB download, {:.2} MB installed",
        app_name,
        files.len(),
        total_size as f64 / 1_048_576.0,
        total_install_size as f64 / 1_048_576.0
    ));

    // 4. Create install directory
    let install_dir = PathBuf::from(install_path).join(app_name);
    fs::create_dir_all(&install_dir).map_err(|e| format!("Failed to create install dir: {}", e))?;

    // 5. Collect all chunks we need to download
    // chunk_to_files: guid -> [(filename, chunk_offset, file_offset, size)]
    // chunk_offset = where to read from within the decompressed 1MiB chunk
    // file_offset = where to write to within the destination file
    // size = how many bytes to copy
    let mut chunk_to_files: HashMap<String, Vec<(String, u64, u64, u64)>> = HashMap::new();
    let mut all_chunks: HashMap<String, ChunkInfo> = HashMap::new();

    // chunk_part.link is pre-built by egs-api using SourceURL/BaseUrl from the manifest binary
    // (same Akamai CDN as legendary uses — no auth tokens needed).
    // Fall back to building the URL from the asset_manifest CDN URI when link is absent.
    let chunk_dir = chunk_dir_for_version(download_manifest.manifest_file_version);
    let fallback_base = base_urls.first().cloned().unwrap_or_default();

    for (filename, file_manifest) in &files {
        let mut file_offset: u64 = 0; // Track cumulative position in destination file
        for chunk_part in &file_manifest.file_chunk_parts {
            let guid = chunk_part.guid.clone();
            let chunk_offset = chunk_part.offset as u64; // Offset within the chunk
            let size = chunk_part.size as u64;
            
            let entry = chunk_to_files.entry(guid.clone()).or_default();
            entry.push((filename.clone(), chunk_offset, file_offset, size));
            
            file_offset += size; // Advance file position for next chunk part

            if !all_chunks.contains_key(&guid) {
                let url = if let Some(link) = &chunk_part.link {
                    // Primary: use the URL already built by egs-api (correct format, Akamai CDN)
                    link.to_string()
                } else {
                    // Fallback: build from the manifest CDN URI with the correct path format
                    let hash = download_manifest.chunk_hash_list.get(&guid).copied().unwrap_or(0);
                    let group = download_manifest.data_group_list.get(&guid).copied().unwrap_or(0);
                    build_fallback_chunk_url(&fallback_base, chunk_dir, group, hash, &guid)
                };
                all_chunks.insert(guid, ChunkInfo { url });
            }
        }
    }

    // 6. Pre-create all files
    for (filename, file_manifest) in &files {
        let file_path = install_dir.join(filename.replace('\\', "/"));
        if let Some(parent) = file_path.parent() {
            fs::create_dir_all(parent)
                .map_err(|e| format!("Failed to create dir for {}: {}", filename, e))?;
        }
        // Create/truncate file with correct size
        let size = file_manifest.size() as u64;
        let f = fs::File::create(&file_path)
            .map_err(|e| format!("Failed to create {}: {}", filename, e))?;
        f.set_len(size)
            .map_err(|e| format!("Failed to set size for {}: {}", filename, e))?;
    }

    // 7. Download chunks and write to files
    let http_client = reqwest::Client::builder()
        .user_agent("EpicGamesLauncher/11.0.1-14907503+++Portal+Release-Live Windows/10.0.19041.1.256.64bit")
        .timeout(std::time::Duration::from_secs(60))
        .build()
        .map_err(|e| format!("Failed to create HTTP client: {}", e))?;

    let total_chunks = all_chunks.len() as u64;
    let mut completed_chunks: u64 = 0;
    let mut downloaded_bytes: u64 = 0;
    let start_time = std::time::Instant::now();

    // Process chunks in batches for parallelism
    let chunk_list: Vec<(String, ChunkInfo)> = all_chunks.into_iter().collect();
    let batch_size = 8; // concurrent downloads

    for batch in chunk_list.chunks(batch_size) {
        let mut download_tasks = Vec::new();

        for (guid, chunk_info) in batch {
            let url = chunk_info.url.clone();
            let client = http_client.clone();
            let guid = guid.clone();

            download_tasks.push(tokio::spawn(async move {
                let mut retries = 0;
                loop {
                    match client.get(&url).send().await {
                        Ok(response) => {
                            if response.status().is_success() {
                                match response.bytes().await {
                                    Ok(bytes) => {
                                        // EGS chunks may be zlib-compressed
                                        let raw_size = bytes.len() as u64; // Track actual downloaded bytes
                                        let data = decompress_chunk(&bytes);
                                        return Ok((guid, data, raw_size));
                                    }
                                    Err(e) if retries < 5 => {
                                        retries += 1;
                                        tokio::time::sleep(std::time::Duration::from_millis(
                                            500 * retries as u64,
                                        ))
                                        .await;
                                        continue;
                                    }
                                    Err(e) => {
                                        return Err(format!(
                                            "Failed to download chunk {}: {}",
                                            guid, e
                                        ));
                                    }
                                }
                            } else if retries < 5 {
                                retries += 1;
                                tokio::time::sleep(std::time::Duration::from_millis(
                                    500 * retries as u64,
                                ))
                                .await;
                                continue;
                            } else {
                                return Err(format!(
                                    "Failed to download chunk {}: HTTP {}",
                                    guid,
                                    response.status()
                                ));
                            }
                        }
                        Err(e) if retries < 5 => {
                            retries += 1;
                            tokio::time::sleep(std::time::Duration::from_millis(
                                500 * retries as u64,
                            ))
                            .await;
                            continue;
                        }
                        Err(e) => {
                            return Err(format!("Failed to download chunk {}: {}", guid, e));
                        }
                    }
                }
            }));
        }

        // Await all downloads in this batch
        for task in download_tasks {
            let result: Result<(String, Vec<u8>, u64), String> = task
                .await
                .map_err(|e| format!("Task join error: {}", e))?;
            let (guid, data, raw_size) = result?;

            // Write chunk data to all files that need it
            if let Some(file_refs) = chunk_to_files.get(&guid) {
                for (filename, chunk_offset, file_offset, size) in file_refs {
                    eprintln!(
                        "[DEBUG] ChunkPart for {}: chunk_offset={}, file_offset={}, size={}, actual_chunk_size={}",
                        filename, chunk_offset, file_offset, size, data.len()
                    );
                    let file_path = install_dir.join(filename.replace('\\', "/"));
                    write_chunk_to_file(&file_path, &data, *chunk_offset, *file_offset, *size)?;
                }
            }

            completed_chunks += 1;
            downloaded_bytes += raw_size; // Use actual downloaded bytes, not padded size

            // Send progress
            let elapsed = start_time.elapsed().as_secs_f64();
            let speed = if elapsed > 0.0 {
                downloaded_bytes as f64 / elapsed
            } else {
                0.0
            };
            let progress = (completed_chunks as f64 / total_chunks as f64) * 100.0;
            let eta = if speed > 0.0 {
                ((total_size - downloaded_bytes) as f64 / speed) as u64
            } else {
                0
            };

            send_progress(
                &progress_sender,
                app_name,
                DownloadStatus::Downloading,
                progress,
                downloaded_bytes,
                total_size,
                speed,
                eta,
                &format!("Chunk {}/{}", completed_chunks, total_chunks),
            )
            .await;

            // Send frontend message every 10 chunks
            if completed_chunks % 10 == 0 {
                send_message_to_frontend(&format!(
                    "[EPIC-DL-PROGRESS]{:.1}%|{:.2} MB/s|ETA: {}s|{}",
                    progress,
                    speed / 1_048_576.0,
                    eta,
                    app_name
                ));
            }
        }
    }

    // 8. Save the manifest locally
    let manifest_path = get_manifests_dir().join(format!("{}.manifest", app_name));
    let manifest_bytes = download_manifest.to_vec();
    fs::write(&manifest_path, &manifest_bytes)
        .map_err(|e| format!("Failed to save manifest: {}", e))?;

    // 9. Register the installed game
    let executable = download_manifest.launch_exe_string.clone();
    let launch_cmd = download_manifest.launch_command.clone();

    // Get cloud save folder from custom fields
    let cloud_save_folder = download_manifest.custom_field("CloudSaveFolder");
    let cloud_save_folder_mac = download_manifest.custom_field("CloudSaveFolder_MAC");

    let installed_game = InstalledEpicGame {
        app_name: app_name.to_string(),
        install_path: install_dir.to_string_lossy().to_string(),
        title: asset_info
            .as_ref()
            .and_then(|i| i.title.clone())
            .unwrap_or_else(|| app_name.to_string()),
        version: download_manifest.build_version_string.clone(),
        executable: executable.clone(),
        install_size: total_install_size,
        manifest_path: manifest_path.to_string_lossy().to_string(),
        namespace: asset_info
            .as_ref()
            .map(|i| i.namespace.clone())
            .unwrap_or_default(),
        catalog_item_id: asset_info
            .as_ref()
            .map(|i| i.id.clone())
            .unwrap_or_default(),
        can_run_offline: true, // Default, may be overridden
        requires_ownership_token: false,
        platform: super::get_platform(),
        cloud_save_folder,
        cloud_save_folder_mac,
        launch_parameters: if launch_cmd.is_empty() {
            None
        } else {
            Some(launch_cmd)
        },
    };

    // Register in installed games
    {
        let mut games = INSTALLED_GAMES.lock().await;
        games.insert(app_name.to_string(), installed_game);
    }
    save_installed_games().await;

    // Update the game in the database with install info
    let conn = establish_connection().unwrap();
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
            if exec_args.contains(app_name) {
                let game_id = game_row.get("id").cloned().unwrap_or_default();
                let exec_file_path = install_dir
                    .join(executable.replace('\\', "/"))
                    .to_string_lossy()
                    .to_string();
                let install_dir_str = install_dir.to_string_lossy().to_string();

                // Update exec_file and game_dir
                let sql = format!(
                    "UPDATE games SET exec_file = '{}', game_dir = '{}' WHERE id = '{}'",
                    exec_file_path.replace('\'', "''"),
                    install_dir_str.replace('\'', "''"),
                    game_id
                );
                let _ = conn.execute(&sql, []);
                break;
            }
        }
    }

    send_progress(
        &progress_sender,
        app_name,
        DownloadStatus::Complete,
        100.0,
        total_size,
        total_size,
        0.0,
        0,
        "Complete",
    )
    .await;

    send_message_to_frontend(&format!("[EPIC-DL-COMPLETE]{}", app_name));

    Ok(())
}

/// Update a game by downloading only changed chunks.
pub async fn update_game(
    app_name: &str,
    progress_sender: Option<mpsc::Sender<DownloadProgress>>,
) -> Result<(), String> {
    // For now, update = full reinstall. Delta updates can be added later.
    let installed = {
        let games = INSTALLED_GAMES.lock().await;
        games.get(app_name).cloned()
    };

    let install_path = match installed {
        Some(ig) => {
            // Get parent directory of the app_name folder
            let p = PathBuf::from(&ig.install_path);
            p.parent()
                .map(|p| p.to_string_lossy().to_string())
                .unwrap_or(ig.install_path.clone())
        }
        None => return Err(format!("Game {} is not installed", app_name)),
    };

    download_game(app_name, &install_path, progress_sender).await
}

/// Uninstall a game by removing its files and metadata.
pub async fn uninstall_game(app_name: &str) -> Result<(), String> {
    let installed = {
        let mut games = INSTALLED_GAMES.lock().await;
        games.remove(app_name)
    };

    if let Some(game) = installed {
        // Remove install directory
        if Path::new(&game.install_path).exists() {
            fs::remove_dir_all(&game.install_path)
                .map_err(|e| format!("Failed to remove install dir: {}", e))?;
        }

        // Remove manifest
        let manifest_path = get_manifests_dir().join(format!("{}.manifest", app_name));
        if manifest_path.exists() {
            let _ = fs::remove_file(manifest_path);
        }

        save_installed_games().await;

        // Update database: clear exec_file and game_dir
        let conn = establish_connection().unwrap();
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
                if exec_args.contains(app_name) {
                    let game_id = game_row.get("id").cloned().unwrap_or_default();
                    let sql = format!(
                        "UPDATE games SET exec_file = '', game_dir = '' WHERE id = '{}'",
                        game_id
                    );
                    let _ = conn.execute(&sql, []);
                    break;
                }
            }
        }

        send_message_to_frontend(&format!("[EPIC-DL-UNINSTALL]{}", app_name));
        Ok(())
    } else {
        Err(format!("Game {} is not installed", app_name))
    }
}

// ──────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────

struct ChunkInfo {
    url: String,
}

/// Decompress EGS chunk data. Chunks can be zlib-compressed.
/// The chunk format has a header that we need to parse.
/// Chunks should be padded to 1 MiB (1048576 bytes) with null bytes if smaller.
fn decompress_chunk(data: &[u8]) -> Vec<u8> {
    eprintln!("[DEBUG] decompress_chunk: input size = {}", data.len());
    
    if data.len() < 8 {
        eprintln!("[DEBUG] Too small for header, returning as-is");
        return data.to_vec();
    }

    // EGS Chunk magic: 0xB1FE3AA2 (little-endian)
    let magic = u32::from_le_bytes([data[0], data[1], data[2], data[3]]);
    eprintln!("[DEBUG] Chunk magic: 0x{:08X}", magic);
    
    if magic != 0xB1FE3AA2 {
        eprintln!("[DEBUG] Not a valid chunk header, trying raw zlib");
        // Not a valid chunk header, try as raw zlib
        if let Ok(decompressed) = try_zlib_decompress(data) {
            eprintln!("[DEBUG] Raw zlib decompressed to {} bytes", decompressed.len());
            return decompressed;
        }
        eprintln!("[DEBUG] Not zlib either, returning as-is");
        return data.to_vec();
    }

    // Parse chunk header
    // Offset 0: magic (4 bytes)
    // Offset 4: header_version (4 bytes)
    // Offset 8: header_size (4 bytes)
    // Offset 12: compressed_size (4 bytes)
    // Offset 16: guid (16 bytes)
    // Offset 32: hash (8 bytes)
    // Offset 40: stored_as (1 byte)
    // Offset 41: sha_hash (20 bytes, if version >= 2)
    // Offset 61: hash_type (1 byte, if version >= 2)
    // Offset 62: uncompressed_size (4 bytes, if version >= 3)

    if data.len() < 12 {
        eprintln!("[DEBUG] Too small for full header intro");
        return data.to_vec();
    }

    let header_version = u32::from_le_bytes([data[4], data[5], data[6], data[7]]);
    let header_size = u32::from_le_bytes([data[8], data[9], data[10], data[11]]) as usize;
    eprintln!("[DEBUG] Header version: {}, size: {}", header_version, header_size);

    if data.len() < header_size {
        eprintln!("[DEBUG] Data too small for header_size, returning as-is");
        return data.to_vec();
    }

    // Check if compressed (stored_as byte in header)
    // Header layout (see legendary's chunk.py):
    // compressed_size (4 bytes at offset 12)
    // guid (16 bytes at offset 16)
    // hash (8 bytes at offset 32)
    // stored_as (1 byte at offset 40)
    // [if version >= 2] sha_hash (20 bytes at offset 41)
    // [if version >= 2] hash_type (1 byte at offset 61)
    // [if version >= 3] uncompressed_size (4 bytes at offset 62)
    
    if data.len() < 41 {
        eprintln!("[DEBUG] Header too small for stored_as field");
        return data.to_vec();
    }
    
    let stored_as = data[40];
    eprintln!("[DEBUG] stored_as: {} (compressed: {})", stored_as, stored_as & 0x1 != 0);
    
    // Get uncompressed_size if version >= 3
    let uncompressed_size = if header_version >= 3 && data.len() >= 66 {
        let size = u32::from_le_bytes([data[62], data[63], data[64], data[65]]) as usize;
        eprintln!("[DEBUG] uncompressed_size from header: {}", size);
        size
    } else {
        // Default to 1 MiB if no size info
        eprintln!("[DEBUG] No uncompressed_size in header, defaulting to 1 MiB");
        1024 * 1024
    };

    let payload = &data[header_size..];
    eprintln!("[DEBUG] Payload size: {}", payload.len());
    
    // stored_as & 0x1 means compressed (bitwise flag from legendary)
    if stored_as & 0x1 != 0 {
        // Compressed: zlib decompress
        if let Ok(mut decompressed) = try_zlib_decompress(payload) {
            eprintln!(
                "[DEBUG] Decompressed {} bytes, uncompressed_size header says {}",
                decompressed.len(),
                uncompressed_size
            );
            // Pad to uncompressed_size if decompression returned less than expected
            if decompressed.len() < uncompressed_size {
                decompressed.resize(uncompressed_size, 0);
            }
            eprintln!("[DEBUG] Final chunk size: {}", decompressed.len());
            return decompressed;
        }
        // If decompression failed, log warning but continue
        eprintln!(
            "[WARN] Chunk claims to be compressed (stored_as={}) but zlib decompression failed, returning raw",
            stored_as
        );
    }
    // Uncompressed data - pad to uncompressed_size if needed
    let mut result = payload.to_vec();
    if result.len() < uncompressed_size {
        result.resize(uncompressed_size, 0);
    }
    eprintln!("[DEBUG] Uncompressed chunk final size: {}", result.len());
    result
}

fn try_zlib_decompress(data: &[u8]) -> Result<Vec<u8>, String> {
    use flate2::read::ZlibDecoder;
    use std::io::Read;
    let mut decoder = ZlibDecoder::new(data);
    let mut buf = Vec::new();
    decoder
        .read_to_end(&mut buf)
        .map_err(|e| format!("Zlib decompression failed: {}", e))?;
    Ok(buf)
}

/// Write a slice of chunk data to a specific position in a file.
/// 
/// # Arguments
/// * `file_path` - Destination file path
/// * `chunk_data` - The full decompressed chunk (size varies, not always 1 MiB)
/// * `chunk_offset` - Where to start reading from within chunk_data
/// * `file_offset` - Where to write to within the destination file
/// * `size` - Number of bytes to copy
fn write_chunk_to_file(
    file_path: &Path,
    chunk_data: &[u8],
    chunk_offset: u64,
    file_offset: u64,
    size: u64,
) -> Result<(), String> {
    use std::io::{Seek, SeekFrom, Write};
    
    let chunk_offset = chunk_offset as usize;
    let size = size as usize;
    
    // Verify the chunk has enough data
    if chunk_offset + size > chunk_data.len() {
        return Err(format!(
            "Chunk slice out of bounds: tried to read {}..{} from chunk of size {}",
            chunk_offset,
            chunk_offset + size,
            chunk_data.len()
        ));
    }
    
    // Extract the slice we need from the chunk
    let chunk_slice = &chunk_data[chunk_offset..(chunk_offset + size)];
    
    // Open file and seek to the destination position
    let mut file = fs::OpenOptions::new()
        .write(true)
        .open(file_path)
        .map_err(|e| format!("Failed to open {}: {}", file_path.display(), e))?;
    
    file.seek(SeekFrom::Start(file_offset))
        .map_err(|e| format!("Failed to seek in {}: {}", file_path.display(), e))?;
    
    // Write the chunk slice to the file
    file.write_all(chunk_slice)
        .map_err(|e| format!("Failed to write to {}: {}", file_path.display(), e))?;
    
    Ok(())
}

async fn send_progress(
    sender: &Option<mpsc::Sender<DownloadProgress>>,
    app_name: &str,
    status: DownloadStatus,
    progress: f64,
    downloaded: u64,
    total: u64,
    speed: f64,
    eta: u64,
    current_file: &str,
) {
    if let Some(tx) = sender {
        let _ = tx
            .send(DownloadProgress {
                app_name: app_name.to_string(),
                progress_percent: progress,
                downloaded_bytes: downloaded,
                total_bytes: total,
                download_speed_bps: speed,
                eta_seconds: eta,
                status,
                current_file: current_file.to_string(),
            })
            .await;
    }
}
