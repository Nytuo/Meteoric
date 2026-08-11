mod litedb;

use std::collections::HashMap;
use std::fs;
use std::path::{Path, PathBuf};

use chrono::{DateTime, Utc};
use once_cell::sync::Lazy;

use crate::database::{establish_connection, first_time_stat, update_game_nodup};
use crate::plugins::igdb;
use crate::file_operations::{
    create_extra_dirs, get_extra_dirs, save_image_optimized, strip_html,
};
use crate::{send_message_to_frontend, IGame};
use litedb::{LiteDocument, LiteValue};

fn dotnet_guid_bytes(canonical: &str) -> [u8; 16] {
    let hex: Vec<u8> = canonical
        .bytes()
        .filter(|b| *b != b'-')
        .collect::<Vec<u8>>()
        .chunks(2)
        .filter_map(|pair| {
            std::str::from_utf8(pair)
                .ok()
                .and_then(|s| u8::from_str_radix(s, 16).ok())
        })
        .collect();
    let mut b = [0u8; 16];
    if hex.len() == 16 {
        b.copy_from_slice(&hex);
    }
    [
        b[3], b[2], b[1], b[0],
        b[5], b[4],
        b[7], b[6],
        b[8], b[9], b[10], b[11], b[12], b[13], b[14], b[15],
    ]
}

fn guid_key_of(canonical: &str) -> String {
    let bytes = dotnet_guid_bytes(canonical);
    bytes.iter().map(|b| format!("{:02x}", b)).collect()
}

static STEAM_PLUGIN_KEY: Lazy<String> = Lazy::new(|| guid_key_of("CB91DFC9-B977-43BF-8E70-55F46E410FAB"));
static GOG_PLUGIN_KEY: Lazy<String> = Lazy::new(|| guid_key_of("AEBE8B7C-6DC3-4A66-AF31-E7375C6B5E9E"));
static EPIC_PLUGIN_KEY: Lazy<String> = Lazy::new(|| guid_key_of("00000002-DBD1-46C6-B5D0-B1BA559D10E4"));

struct Lookups {
    genres: HashMap<String, String>,
    companies: HashMap<String, String>,
    tags: HashMap<String, String>,
    features: HashMap<String, String>,
    categories: HashMap<String, String>,
    platforms: HashMap<String, String>,
    completion_statuses: HashMap<String, String>,
}

struct ResolvedExport {
    library_dir: PathBuf,
    libraryfiles_dir: PathBuf,
    _temp: Option<tempfile::TempDir>,
}

#[derive(serde::Serialize)]
pub struct CompletionStatusEntry {
    name: String,
    suggested: String,
}

pub fn list_completion_statuses(export_path: String) -> Result<Vec<CompletionStatusEntry>, String> {
    let export_path = export_path.trim();
    if export_path.is_empty() {
        return Err("No Playnite export selected".to_string());
    }

    let resolved = resolve_export(Path::new(export_path))?;
    let mut names: Vec<String> = load_lookup(&resolved.library_dir, "completionstatuses.db")
        .into_values()
        .collect();
    names.sort();
    names.dedup();

    Ok(names
        .into_iter()
        .map(|name| {
            let suggested = map_completion_status(&name).unwrap_or("").to_string();
            CompletionStatusEntry { name, suggested }
        })
        .collect())
}

pub async fn import(
    export_path: String,
    status_overrides: HashMap<String, String>,
) -> Result<(), String> {
    let export_path = export_path.trim();
    if export_path.is_empty() {
        return Err("No Playnite export selected".to_string());
    }

    send_message_to_frontend("[PLAYNITE-IMPORT-INFO]Reading Playnite export...");

    let resolved = resolve_export(Path::new(export_path))?;
    let games_path = resolved.library_dir.join("games.db");
    let games_bytes = fs::read(&games_path).map_err(|e| {
        format!(
            "Could not read {}: {}. This doesn't look like a valid Playnite library backup.",
            games_path.display(),
            e
        )
    })?;

    let games_docs = litedb::read_all_documents(&games_bytes)
        .map_err(|e| format!("Could not read Playnite's games database: {}", e))?;

    if games_docs.is_empty() {
        send_message_to_frontend("[PLAYNITE-IMPORT-DONE]0|0|0|0");
        return Ok(());
    }

    let lookups = Lookups {
        genres: load_lookup(&resolved.library_dir, "genres.db"),
        companies: load_lookup(&resolved.library_dir, "companies.db"),
        tags: load_lookup(&resolved.library_dir, "tags.db"),
        features: load_lookup(&resolved.library_dir, "features.db"),
        categories: load_lookup(&resolved.library_dir, "categories.db"),
        platforms: load_lookup(&resolved.library_dir, "platforms.db"),
        completion_statuses: load_lookup(&resolved.library_dir, "completionstatuses.db"),
    };

    let total = games_docs.len();
    let mut imported = 0usize;
    let mut already_present = 0usize;
    let mut needs_relink = 0usize;
    let mut newly_imported: Vec<(String, String)> = Vec::new();

    for (i, doc) in games_docs.iter().enumerate() {
        let name = doc
            .get("Name")
            .and_then(|v| v.as_str())
            .unwrap_or("Unknown game")
            .to_string();

        send_message_to_frontend(&format!(
            "[PLAYNITE-IMPORT-PROGRESS]{}|{}|{}|{}",
            ((i + 1) as f64 / total as f64 * 100.0).round() as u32,
            i + 1,
            total,
            name.replace('|', " ")
        ));

        let mapped = map_game(doc, &lookups, &resolved.libraryfiles_dir, &status_overrides);
        if mapped.game.name.trim().is_empty() {
            continue;
        }
        if mapped.exec_file.is_none() && !mapped.install_dir.is_empty() {
            needs_relink += 1;
        }

        let conn = match establish_connection() {
            Ok(c) => c,
            Err(e) => {
                send_message_to_frontend(&format!(
                    "[PLAYNITE-IMPORT-WARN]Database unavailable: {}",
                    e
                ));
                continue;
            }
        };

        let existing_before = find_existing(&conn, &mapped.game);

        let id = match update_game_nodup(&conn, mapped.game.clone()) {
            Ok(id) => id,
            Err(e) => {
                send_message_to_frontend(&format!(
                    "[PLAYNITE-IMPORT-WARN]Skipped \"{}\": {}",
                    name, e
                ));
                continue;
            }
        };

        if existing_before {
            already_present += 1;
            continue;
        }
        imported += 1;
        if mapped.game.igdb_id.trim().is_empty() {
            newly_imported.push((id.clone(), name.clone()));
        }

        let extra_dirs_ready = create_extra_dirs(&id).is_ok();
        let game_dir: Option<PathBuf> = if extra_dirs_ready {
            get_extra_dirs(&id).ok()
        } else {
            None
        };
        if !extra_dirs_ready {
            send_message_to_frontend(&format!(
                "[PLAYNITE-IMPORT-WARN]Could not prepare media folder for \"{}\"",
                name
            ));
        } else if let Some(game_dir) = game_dir {
            copy_cover_art(&game_dir, &mapped).await;
        }

        if mapped.playtime_ms > 0 {
            let _ = first_time_stat(
                &conn,
                id.clone(),
                mapped.playtime_ms.to_string(),
                mapped
                    .last_activity
                    .clone()
                    .unwrap_or_else(|| Utc::now().format("%Y-%m-%d %H:%M:%S").to_string()),
            );
        }
    }

    send_message_to_frontend(&format!(
        "[PLAYNITE-IMPORT-DONE]{}|{}|{}|{}",
        imported, already_present, needs_relink, total
    ));

    enrich_with_igdb(newly_imported).await;

    Ok(())
}

async fn enrich_with_igdb(games: Vec<(String, String)>) {
    if games.is_empty() {
        return;
    }

    let client_id = std::env::var("IGDB_CLIENT_ID");
    let client_secret = std::env::var("IGDB_CLIENT_SECRET");
    let (client_id, client_secret) = match (client_id, client_secret) {
        (Ok(id), Ok(secret)) if !id.is_empty() && !secret.is_empty() => (id, secret),
        _ => {
            send_message_to_frontend(
                "[PLAYNITE-IMPORT-WARN]Skipped IGDB lookup: no IGDB API key configured \
                 in Settings > API Keys. Games were imported, but won't have an igdb_id \
                 until one is set and you sync/import again.",
            );
            return;
        }
    };
    igdb::set_credentials(vec![client_id, client_secret]);

    send_message_to_frontend(&format!(
        "[PLAYNITE-IMPORT-INFO]Looking up IGDB data for {} games...",
        games.len()
    ));

    let total = games.len();
    let (matched, _attempted, error) = igdb::bulk_enrich_missing_igdb_ids(games).await;

    if let Some(error) = error {
        send_message_to_frontend(&format!("[PLAYNITE-IMPORT-WARN]IGDB lookup failed: {}", error));
        return;
    }

    send_message_to_frontend(&format!(
        "[PLAYNITE-IMPORT-INFO]Matched {}/{} games to IGDB",
        matched, total
    ));
}

fn find_existing(conn: &rusqlite::Connection, game: &IGame) -> bool {
    conn.query_row(
        "SELECT id FROM games WHERE game_importer_id = ?1 AND importer_id = ?2",
        rusqlite::params![game.game_importer_id, game.importer_id],
        |row| row.get::<_, i64>(0),
    )
    .is_ok()
}

fn resolve_export(input: &Path) -> Result<ResolvedExport, String> {
    if input.is_file() {
        let ext = input
            .extension()
            .and_then(|e| e.to_str())
            .unwrap_or_default()
            .to_lowercase();
        if ext != "zip" {
            return Err(
                "Please select either the PlayniteBackup-*.zip file or the extracted backup folder.".to_string(),
            );
        }
        return extract_backup_zip(input);
    }

    if !input.is_dir() {
        return Err(format!("{} does not exist", input.display()));
    }

    if input.join("library").join("games.db").is_file() {
        return Ok(ResolvedExport {
            library_dir: input.join("library"),
            libraryfiles_dir: input.join("libraryfiles"),
            _temp: None,
        });
    }
    if input.join("games.db").is_file() {
        let parent = input.parent().unwrap_or(input);
        return Ok(ResolvedExport {
            library_dir: input.to_path_buf(),
            libraryfiles_dir: parent.join("libraryfiles"),
            _temp: None,
        });
    }

    Err("This doesn't look like a Playnite library backup (no library/games.db found).".to_string())
}

fn extract_backup_zip(zip_path: &Path) -> Result<ResolvedExport, String> {
    let file = fs::File::open(zip_path).map_err(|e| format!("Failed to open backup zip: {}", e))?;
    let mut archive =
        zip::ZipArchive::new(file).map_err(|e| format!("Failed to read backup zip: {}", e))?;

    let temp = tempfile::tempdir().map_err(|e| format!("Failed to create temp folder: {}", e))?;
    let dest = temp.path();

    let mut found_games_db = false;

    for i in 0..archive.len() {
        let mut entry = match archive.by_index(i) {
            Ok(e) => e,
            Err(_) => continue,
        };
        let entry_path = match entry.enclosed_name() {
            Some(p) => p.to_path_buf(),
            None => continue,
        };
        let mut components = entry_path.components();
        let top = components.next().and_then(|c| c.as_os_str().to_str());
        let is_wanted = matches!(top, Some("library") | Some("libraryfiles"));
        if !is_wanted {
            continue;
        }

        let output_path = dest.join(&entry_path);
        if entry.is_dir() {
            let _ = fs::create_dir_all(&output_path);
            continue;
        }
        if let Some(parent) = output_path.parent() {
            let _ = fs::create_dir_all(parent);
        }
        let mut outfile = fs::File::create(&output_path)
            .map_err(|e| format!("Failed to extract {}: {}", entry_path.display(), e))?;
        std::io::copy(&mut entry, &mut outfile)
            .map_err(|e| format!("Failed to extract {}: {}", entry_path.display(), e))?;

        if entry_path == Path::new("library").join("games.db") {
            found_games_db = true;
        }
    }

    if !found_games_db {
        return Err(
            "This zip doesn't look like a Playnite library backup (no library/games.db found)."
                .to_string(),
        );
    }

    Ok(ResolvedExport {
        library_dir: dest.join("library"),
        libraryfiles_dir: dest.join("libraryfiles"),
        _temp: Some(temp),
    })
}

fn load_lookup(library_dir: &Path, filename: &str) -> HashMap<String, String> {
    let mut map = HashMap::new();
    let path = library_dir.join(filename);
    let bytes = match fs::read(&path) {
        Ok(b) => b,
        Err(_) => return map,
    };
    let docs = match litedb::read_all_documents(&bytes) {
        Ok(d) => d,
        Err(_) => return map,
    };
    for doc in docs {
        let id = doc.get("_id").and_then(|v| v.guid_key());
        let name = doc.get("Name").and_then(|v| v.as_str());
        if let (Some(id), Some(name)) = (id, name) {
            map.insert(id, name.to_string());
        }
    }
    map
}

fn guid_array_keys(doc: &LiteDocument, key: &str) -> Vec<String> {
    doc.get(key)
        .and_then(|v| v.as_array())
        .map(|arr| arr.iter().filter_map(|v| v.guid_key()).collect())
        .unwrap_or_default()
}

fn join_names(ids: &[String], lookup: &HashMap<String, String>) -> String {
    ids.iter()
        .filter_map(|id| lookup.get(id).cloned())
        .collect::<Vec<_>>()
        .join(", ")
}

fn ms_to_date_ddmmyyyy(ms: i64) -> Option<String> {
    DateTime::<Utc>::from_timestamp_millis(ms).map(|d| d.format("%d/%m/%Y").to_string())
}

fn ms_to_datetime(ms: i64) -> Option<String> {
    DateTime::<Utc>::from_timestamp_millis(ms).map(|d| d.format("%Y-%m-%d %H:%M:%S").to_string())
}

fn format_ddmmyyyy(year: i64, month: i64, day: i64) -> String {
    format!("{:02}/{:02}/{:04}", day.clamp(1, 31), month.clamp(1, 12), year)
}

fn release_date_string(doc: &LiteDocument) -> String {
    match doc.get("ReleaseDate") {
        Some(LiteValue::String(s)) => {
            let parts: Vec<&str> = s.split('-').collect();
            if parts.len() == 3 {
                if let (Ok(y), Ok(m), Ok(d)) =
                    (parts[0].parse::<i64>(), parts[1].parse::<i64>(), parts[2].parse::<i64>())
                {
                    return format_ddmmyyyy(y, m, d);
                }
            }
            String::new()
        }
        Some(LiteValue::DateTime(ms)) => ms_to_date_ddmmyyyy(*ms).unwrap_or_default(),
        Some(LiteValue::Document(inner)) => {
            if let Some(year) = inner.get("Year").and_then(|v| v.as_i64()) {
                let month = inner.get("Month").and_then(|v| v.as_i64()).unwrap_or(1);
                let day = inner.get("Day").and_then(|v| v.as_i64()).unwrap_or(1);
                format_ddmmyyyy(year, month, day)
            } else {
                inner
                    .get("Date")
                    .and_then(|v| v.as_datetime_ms())
                    .and_then(ms_to_date_ddmmyyyy)
                    .unwrap_or_default()
            }
        }
        _ => String::new(),
    }
}

fn map_completion_status(name: &str) -> Option<&'static str> {
    let n = name.to_lowercase();
    if n.contains("platinum") {
        Some("Platinum")
    } else if n.contains("plan to play") || n.contains("backlog") || n.contains("not played") || n.contains("unplayed") {
        Some("Not started")
    } else if n.contains("playing") || n.contains("in progress") {
        Some("In progress")
    } else if n.contains("hold") {
        Some("On hold")
    } else if n.contains("abandon") || n.contains("dropped") {
        Some("Dropped")
    } else if n.contains("beaten") || n.contains("completed") || n.contains("finished") {
        Some("Completed")
    } else {
        None
    }
}

fn resolve_play_action(doc: &LiteDocument, install_dir: &str) -> (Option<String>, String) {
    let actions: Vec<&LiteDocument> = match doc.get("GameActions").and_then(|v| v.as_array()) {
        Some(arr) => arr.iter().filter_map(|v| v.as_document()).collect(),
        None => return (None, String::new()),
    };

    let chosen = actions
        .iter()
        .find(|a| a.get("IsPlayAction").and_then(|v| v.as_bool()).unwrap_or(false))
        .or_else(|| actions.first());

    let chosen = match chosen {
        Some(c) => *c,
        None => return (None, String::new()),
    };

    let action_type = chosen.get("Type").and_then(|v| v.as_str()).unwrap_or("File");
    if !action_type.eq_ignore_ascii_case("File") {
        return (None, String::new());
    }

    let raw_path = chosen.get("Path").and_then(|v| v.as_str()).unwrap_or("");
    let raw_args = chosen.get("Arguments").and_then(|v| v.as_str()).unwrap_or("");
    let expanded = raw_path.replace("{InstallDir}", install_dir);

    if expanded.is_empty() || !Path::new(&expanded).is_file() {
        return (None, String::new());
    }

    (Some(expanded), raw_args.to_string())
}

fn resolve_media_path(libraryfiles_dir: &Path, value: &str) -> Option<PathBuf> {
    if value.is_empty() || value.starts_with("http://") || value.starts_with("https://") {
        return None;
    }
    let candidate = libraryfiles_dir.join(value.replace('\\', "/"));
    if candidate.is_file() {
        Some(candidate)
    } else {
        None
    }
}

struct MappedGame {
    game: IGame,
    icon: Option<PathBuf>,
    cover: Option<PathBuf>,
    background: Option<PathBuf>,
    playtime_ms: i64,
    last_activity: Option<String>,
    exec_file: Option<String>,
    install_dir: String,
}

fn map_game(
    doc: &LiteDocument,
    lookups: &Lookups,
    libraryfiles_dir: &Path,
    status_overrides: &HashMap<String, String>,
) -> MappedGame {
    let mut game = IGame::new();
    game.id = "-1".to_string();

    let id_key = doc.get("_id").and_then(|v| v.guid_key()).unwrap_or_default();

    let plugin_key = doc.get("PluginId").and_then(|v| v.guid_key()).unwrap_or_default();
    let native_game_id = doc.get("GameId").and_then(|v| v.as_str()).unwrap_or("").trim().to_string();

    if !native_game_id.is_empty() && plugin_key == *STEAM_PLUGIN_KEY {
        game.importer_id = "steam".to_string();
        game.game_importer_id = native_game_id;
        game.metadata_source = "playnite".to_string();
    } else if !native_game_id.is_empty() && plugin_key == *GOG_PLUGIN_KEY {
        game.importer_id = "gog".to_string();
        game.game_importer_id = native_game_id;
        game.metadata_source = "playnite".to_string();
    } else {
        game.importer_id = "playnite".to_string();
        game.game_importer_id = id_key;
    }

    game.name = doc.get("Name").and_then(|v| v.as_str()).unwrap_or("").trim().to_string();
    let sorting = doc.get("SortingName").and_then(|v| v.as_str()).unwrap_or("");
    game.sort_name = if sorting.trim().is_empty() {
        game.name.to_lowercase()
    } else {
        sorting.to_lowercase()
    };

    game.igdb_id = String::new();
    game.description = doc
        .get("Description")
        .and_then(|v| v.as_str())
        .map(strip_html)
        .unwrap_or_default();

    game.genres = join_names(&guid_array_keys(doc, "GenreIds"), &lookups.genres);
    game.developers = join_names(&guid_array_keys(doc, "DeveloperIds"), &lookups.companies);
    game.editors = join_names(&guid_array_keys(doc, "PublisherIds"), &lookups.companies);
    game.platforms = join_names(&guid_array_keys(doc, "PlatformIds"), &lookups.platforms);

    let mut tags = guid_array_keys(doc, "TagIds")
        .iter()
        .filter_map(|id| lookups.tags.get(id).cloned())
        .collect::<Vec<_>>();
    tags.extend(
        guid_array_keys(doc, "CategoryIds")
            .iter()
            .filter_map(|id| lookups.categories.get(id).cloned()),
    );
    game.tags = tags.join(", ");

    game.styles = join_names(&guid_array_keys(doc, "FeatureIds"), &lookups.features);

    game.release_date = release_date_string(doc);

    game.critic_score = doc
        .get("CriticScore")
        .and_then(|v| v.as_i64())
        .or_else(|| doc.get("CommunityScore").and_then(|v| v.as_i64()))
        .map(|v| v.to_string())
        .unwrap_or_default();

    game.hidden = doc.get("Hidden").and_then(|v| v.as_bool()).unwrap_or(false).to_string();

    game.status = doc
        .get("CompletionStatusId")
        .and_then(|v| v.guid_key())
        .and_then(|id| lookups.completion_statuses.get(&id))
        .map(|name| {
            status_overrides
                .get(name)
                .cloned()
                .unwrap_or_else(|| map_completion_status(name).unwrap_or("").to_string())
        })
        .unwrap_or_default();

    let install_dir = doc.get("InstallDirectory").and_then(|v| v.as_str()).unwrap_or("").to_string();
    game.game_dir = if !install_dir.is_empty() && Path::new(&install_dir).is_dir() {
        install_dir.clone()
    } else {
        String::new()
    };

    let (exec_file, exec_args) = resolve_play_action(doc, &install_dir);
    game.exec_file = exec_file.clone().unwrap_or_default();
    game.exec_args = if exec_file.is_some() { exec_args } else { String::new() };

    if game.importer_id == "gog" {
        game.exec_args = format!("gog:{}", game.game_importer_id);
    }

    let playtime_seconds = doc.get("Playtime").and_then(|v| v.as_i64()).unwrap_or(0).max(0);
    let playtime_ms = playtime_seconds.saturating_mul(1000);

    let last_activity = doc
        .get("LastActivity")
        .and_then(|v| v.as_datetime_ms())
        .and_then(ms_to_datetime);

    let icon = doc
        .get("Icon")
        .and_then(|v| v.as_str())
        .and_then(|p| resolve_media_path(libraryfiles_dir, p));
    let cover = doc
        .get("CoverImage")
        .and_then(|v| v.as_str())
        .and_then(|p| resolve_media_path(libraryfiles_dir, p));
    let background = doc
        .get("BackgroundImage")
        .and_then(|v| v.as_str())
        .and_then(|p| resolve_media_path(libraryfiles_dir, p));

    MappedGame {
        game,
        icon,
        cover,
        background,
        playtime_ms,
        last_activity,
        exec_file,
        install_dir,
    }
}

async fn copy_cover_art(game_dir: &Path, mapped: &MappedGame) {
    if let Some(icon) = &mapped.icon {
        if let Ok(bytes) = fs::read(icon) {
            let _ = save_image_optimized(&game_dir.join("icon"), &bytes).await;
        }
    }
    if let Some(cover) = &mapped.cover {
        if let Ok(bytes) = fs::read(cover) {
            let _ = save_image_optimized(&game_dir.join("jaquette"), &bytes).await;
        }
    }
    if let Some(background) = &mapped.background {
        if let Ok(bytes) = fs::read(background) {
            let _ = save_image_optimized(&game_dir.join("background"), &bytes).await;
        }
    }
}
