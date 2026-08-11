use std::collections::HashMap;
use std::sync::Mutex;

use crate::database::{establish_connection, get_game_by_id, set_igdb_id, update_game};
use crate::file_operations::save_media_to_external_storage;
use crate::{send_message_to_frontend, Metadata};
use chrono::{DateTime, NaiveDateTime, Utc};
use directories::ProjectDirs;
use reqwest::header::HeaderMap;
use std::fs::File;
use tokio::fs::OpenOptions;
use tokio::io::{AsyncBufReadExt, AsyncWriteExt};
use tokio::task;

pub async fn calculate_igdb_token(
    client_id: String,
    client_secret: String,
) -> Result<HashMap<String, serde_json::Value>, Box<dyn std::error::Error>> {
    let url = "https://id.twitch.tv/oauth2/token?client_id=".to_string()
        + &*client_id
        + "&client_secret="
        + &*client_secret
        + "&grant_type=client_credentials";
    let client = reqwest::Client::new();
    let response = client.post(url).send().await?;
    let json: HashMap<String, serde_json::Value> = response.json().await?;
    if let Some(msg) = json.get("message").and_then(|v| v.as_str()) {
        if msg == "invalid client" {
            return Err("Error while getting token: invalid client".into());
        }
    }
    Ok(json)
}

pub(crate) async fn fetch_game_by_igdb_id(
    igdb_id: &str,
) -> Result<Vec<String>, Box<dyn std::error::Error>> {
    let client_id = CLIENT_ID
        .lock()
        .unwrap_or_else(|e| e.into_inner())
        .to_string();
    let client_secret = CLIENT_SECRET
        .lock()
        .unwrap_or_else(|e| e.into_inner())
        .to_string();
    let mut access_token = ACCESS_TOKEN.lock().unwrap_or_else(|e| e.into_inner());
    let mut expiration = TOKEN_EXPIRATION.lock().unwrap_or_else(|e| e.into_inner());

    if expiration.is_empty()
        || Utc::now() > chrono::DateTime::parse_from_rfc3339(&*expiration)?.with_timezone(&Utc)
    {
        let d = calculate_igdb_token(client_id.clone(), client_secret.clone()).await?;
        let token = d
            .get("access_token")
            .ok_or("IGDB token response missing 'access_token'")?
            .to_string()
            .replace("\"", "");
        let expires = d
            .get("expires_in")
            .and_then(|v| v.as_i64())
            .ok_or("IGDB token response missing 'expires_in'")?;
        *access_token = token;
        *expiration = Utc::now()
            .checked_add_signed(chrono::Duration::seconds(expires))
            .unwrap_or_else(Utc::now)
            .to_rfc3339();
    }

    let fields = "name,cover.image_id,genres.name,platforms.*,release_dates.date,summary,screenshots.image_id,aggregated_rating,artworks.image_id,category,first_release_date,franchise.name,game_engines.*,involved_companies.company.url,involved_companies.company.start_date,involved_companies.company.name,involved_companies.company.description,involved_companies.company.country,involved_companies.company.logo.image_id,involved_companies.developer,involved_companies.publisher,player_perspectives.name,rating,remakes.name,remasters.name,standalone_expansions.name,storyline,videos.video_id,themes.name,external_games.media,external_games.uid";
    let body = format!("fields {}; limit 1; where id = {};", fields, igdb_id);

    let mut headers = HeaderMap::new();
    headers.insert("Client-ID", client_id.parse().unwrap());
    headers.insert(
        "Authorization",
        format!("Bearer {}", *access_token).parse().unwrap(),
    );
    headers.insert("Accept", "application/json".parse().unwrap());

    let response = reqwest::Client::new()
        .post("https://api.igdb.com/v4/games")
        .body(body)
        .headers(headers)
        .send()
        .await?;

    let text = response.text().await?;
    let mut games: Vec<serde_json::Value> = serde_json::from_str(&text)?;

    for i in 0..games.len() {
        if games[i]["cover"].is_object() {
            let cover_id = games[i]["cover"]["image_id"].as_str().unwrap_or("");
            games[i]["cover"] = serde_json::Value::String(format!(
                "https://images.igdb.com/igdb/image/upload/t_cover_big_2x/{}.jpg",
                cover_id
            ));
        }
        if games[i]["screenshots"].is_array() {
            for j in 0..games[i]["screenshots"].as_array().unwrap().len() {
                let sid = games[i]["screenshots"][j]["image_id"]
                    .as_str()
                    .unwrap_or("");
                games[i]["screenshots"][j] = serde_json::Value::String(format!(
                    "https://images.igdb.com/igdb/image/upload/t_screenshot_huge/{}.jpg",
                    sid
                ));
            }
        }
        if games[i]["artworks"].is_array() {
            for j in 0..games[i]["artworks"].as_array().unwrap().len() {
                let aid = games[i]["artworks"][j]["image_id"].as_str().unwrap_or("");
                games[i]["artworks"][j] = serde_json::Value::String(format!(
                    "https://images.igdb.com/igdb/image/upload/t_screenshot_huge/{}.jpg",
                    aid
                ));
            }
        }
        if games[i]["videos"].is_array() {
            for j in 0..games[i]["videos"].as_array().unwrap().len() {
                let vid = games[i]["videos"][j]["video_id"].as_str().unwrap_or("");
                games[i]["videos"][j] =
                    serde_json::Value::String(format!("https://www.youtube.com/watch?v={}", vid));
            }
        }
        games[i]["background"] = games[i]["screenshots"][0].clone();
        games[i]["platforms"] = serde_json::Value::String("Other".to_string());

        let summary = games[i]["summary"].as_str();
        let storyline = games[i]["storyline"].as_str();
        games[i]["description"] = serde_json::Value::String(match (summary, storyline) {
            (Some(s), Some(st)) => format!("{} {}", s, st),
            (Some(s), None) => s.to_string(),
            (None, Some(st)) => st.to_string(),
            (None, None) => "No description found".to_string(),
        });

        if let Some(genres) = games[i]["genres"].as_array() {
            if !genres.is_empty() {
                let names: Vec<&str> = genres.iter().filter_map(|g| g["name"].as_str()).collect();
                games[i]["genres"] = serde_json::Value::String(names.join(", "));
            }
        }
        if let Some(themes) = games[i]["themes"].as_array() {
            if !themes.is_empty() {
                let names: Vec<&str> = themes.iter().filter_map(|t| t["name"].as_str()).collect();
                games[i]["styles"] = serde_json::Value::String(names.join(", "));
            }
        }
        if let Some(companies) = games[i]["involved_companies"].as_array().cloned() {
            let mut devs: Vec<&str> = vec![];
            let mut pubs: Vec<&str> = vec![];
            for c in &companies {
                if let Some(name) = c["company"]["name"].as_str() {
                    if c["developer"].as_bool() == Some(true) {
                        devs.push(name);
                    } else if c["publisher"].as_bool() == Some(true) {
                        pubs.push(name);
                    }
                }
            }
            games[i]["developers"] = serde_json::Value::String(devs.join(", "));
            games[i]["editors"] = serde_json::Value::String(pubs.join(", "));
        }
        games[i]["critic_score"] = games[i]["aggregated_rating"].clone();
        if let Some(ts) = games[i]["first_release_date"].as_i64() {
            let dt = DateTime::<Utc>::from_utc(NaiveDateTime::from_timestamp(ts, 0), Utc);
            games[i]["release_date"] = serde_json::Value::String(dt.format("%d/%m/%Y").to_string());
        }
        if let Some(id_val) = games[i].get("id").cloned() {
            games[i]["igdb_id"] = serde_json::Value::String(id_val.to_string());
        }
        if let Some(obj) = games[i].as_object_mut() {
            obj.remove("id");
            obj.remove("rating");
            obj.remove("release_dates");
            obj.remove("external_games");
            obj.remove("category");
            obj.remove("dlcs");
            obj.remove("involved_companies");
            obj.remove("player_perspectives");
        }
    }

    Ok(games.iter().map(|g| g.to_string()).collect())
}

pub async fn enrich_from_igdb_id(
    igdb_id: String,
    db_id: String,
) -> Result<(), Box<dyn std::error::Error>> {
    let games = task::block_in_place(|| {
        let rt = tokio::runtime::Runtime::new().unwrap();
        rt.block_on(fetch_game_by_igdb_id(&igdb_id))
    });

    let games = match games {
        Ok(g) if !g.is_empty() => g,
        _ => {
            let conn = establish_connection()?;
            let igame = get_game_by_id(&conn, &db_id)?;
            let name = remove_odds_in_string(&igame.name);
            if name.is_empty() {
                return Ok(());
            }
            task::block_in_place(|| {
                let rt = tokio::runtime::Runtime::new().unwrap();
                rt.block_on(search_game_igdb(&name, true))
            })?
        }
    };

    if games.is_empty() {
        return Ok(());
    }

    let first_game = &games[0];
    let game_json: serde_json::Value = serde_json::from_str(first_game)?;
    let conn = establish_connection()?;
    let mut igame = get_game_by_id(&conn, &db_id)?;

    macro_rules! set_str {
        ($field:ident, $key:expr) => {
            if let Some(v) = game_json.get($key).and_then(|v| v.as_str()) {
                if !v.is_empty() {
                    igame.$field = v.to_string();
                }
            }
        };
    }
    set_str!(name, "name");
    set_str!(sort_name, "name");
    set_str!(platforms, "platforms");
    set_str!(description, "description");
    set_str!(genres, "genres");
    set_str!(styles, "styles");
    set_str!(release_date, "release_date");
    set_str!(developers, "developers");
    set_str!(editors, "editors");
    if let Some(igdb_id_val) = game_json.get("igdb_id").and_then(|v| v.as_str()) {
        if !igdb_id_val.is_empty() {
            igame.igdb_id = igdb_id_val.to_string();
        }
    }
    if let Some(cs) = game_json.get("critic_score").and_then(|v| v.as_f64()) {
        igame.critic_score = cs.to_string();
    }
    igame.id = db_id.clone();
    let conn = establish_connection()?;
    let _ = update_game(&conn, igame);

    let screenshots: Vec<String> = game_json
        .get("screenshots")
        .and_then(|v| v.as_array())
        .unwrap_or(&vec![])
        .iter()
        .filter_map(|v| v.as_str().map(|s| s.to_string()))
        .collect();

    let videos: Vec<String> = vec![];
    let metadata = Metadata {
        jaquette: Some(
            game_json
                .get("cover")
                .and_then(|v| v.as_str())
                .unwrap_or_default()
                .to_owned(),
        ),
        background: Some(
            game_json
                .get("background")
                .and_then(|v| v.as_str())
                .unwrap_or_default()
                .to_owned(),
        ),
        logo: Some(
            game_json
                .get("logo")
                .and_then(|v| v.as_str())
                .unwrap_or_default()
                .to_owned(),
        ),
        icon: Some(
            game_json
                .get("icon")
                .and_then(|v| v.as_str())
                .unwrap_or_default()
                .to_owned(),
        ),
        screenshots: Some(screenshots),
        videos: None,
        audio: None,
    };
    let _ = task::block_in_place(|| {
        let rt = tokio::runtime::Runtime::new().unwrap();
        rt.block_on(save_media_to_external_storage(db_id, metadata))
    });

    Ok(())
}

pub(crate) async fn search_game_igdb(
    game_name: &str,
    routine_mode: bool,
) -> Result<Vec<String>, Box<dyn std::error::Error>> {
    let client_id = CLIENT_ID
        .lock()
        .unwrap_or_else(|e| e.into_inner())
        .to_string();
    let client_secret = CLIENT_SECRET
        .lock()
        .unwrap_or_else(|e| e.into_inner())
        .to_string();
    let mut access_token = ACCESS_TOKEN.lock().unwrap_or_else(|e| e.into_inner());
    let mut expiration = TOKEN_EXPIRATION.lock().unwrap_or_else(|e| e.into_inner());
    if expiration.is_empty()
        || Utc::now() > chrono::DateTime::parse_from_rfc3339(&*expiration)?.with_timezone(&Utc)
    {
        let d: HashMap<String, serde_json::Value> =
            calculate_igdb_token(client_id.clone(), client_secret.clone()).await?;
        let token = d
            .get("access_token")
            .ok_or("IGDB token response missing 'access_token' field")?
            .to_string()
            .replace("\"", "");
        let expires = d
            .get("expires_in")
            .and_then(|v| v.as_i64())
            .ok_or("IGDB token response missing 'expires_in' field")?;
        *access_token = token;
        *expiration = Utc::now()
            .checked_add_signed(chrono::Duration::seconds(expires))
            .unwrap_or_else(Utc::now)
            .to_rfc3339();
    }

    let igdb_base_url = "https://api.igdb.com/v4/";
    let request_url = igdb_base_url.to_string() + "games";
    let fields = "name,cover.image_id,genres.name,platforms.*,release_dates.date,summary,screenshots.image_id,aggregated_rating,artworks.image_id,category,first_release_date,franchise.name,game_engines.*,involved_companies.company.url,involved_companies.company.start_date,involved_companies.company.name,involved_companies.company.description,involved_companies.company.country,involved_companies.company.logo.image_id,involved_companies.developer,involved_companies.publisher,player_perspectives.name,rating,remakes.name,remasters.name,standalone_expansions.name,storyline,videos.video_id,themes.name,external_games.media,external_games.uid";
    let mut headers = HeaderMap::new();
    headers.insert("Client-ID", client_id.parse().unwrap());
    headers.insert(
        "Authorization",
        format!("Bearer {}", access_token).parse().unwrap(),
    );
    headers.insert("Accept", "application/json".parse().unwrap());
    let game_reaquest;

    if routine_mode {
        game_reaquest = reqwest::Client::new()
            .post(request_url)
            .body(format!(
                "fields {}; limit 1; where version_parent = null; search \"{}\";",
                fields, game_name
            ))
            .headers(headers);
    } else {
        game_reaquest = reqwest::Client::new()
            .post(request_url)
            .body(format!(
                "fields {}; limit 20; where version_parent = null & name ~ *\"{}\"*;",
                fields, game_name
            ))
            .headers(headers);
    }
    let response = game_reaquest.send().await?;
    let status = response.status();
    let text = response.text().await?;

    if !status.is_success() {
        return Err(format!(
            "IGDB search returned {} for '{}': {}",
            status,
            game_name,
            &text[..text.len().min(500)]
        )
        .into());
    }

    let games: serde_json::Value = serde_json::from_str(&text)?;
    let mut games = games.as_array().cloned().ok_or_else(|| {
        format!(
            "IGDB search for '{}' returned a non-array response: {}",
            game_name,
            &text[..text.len().min(500)]
        )
    })?;
    for i in 0..games.len() {
        if games[i]["cover"].is_object() {
            let cover_id = games[i]["cover"]["image_id"].as_str().unwrap_or("");
            let cover_url = format!(
                "https://images.igdb.com/igdb/image/upload/t_cover_big_2x/{}.jpg",
                cover_id
            );
            games[i]["cover"] = serde_json::Value::String(cover_url);
        }
        if games[i]["screenshots"].is_array() {
            for j in 0..games[i]["screenshots"].as_array().unwrap().len() {
                let screenshot_id = games[i]["screenshots"][j]["image_id"]
                    .as_str()
                    .unwrap_or("");
                let screenshot_url = format!(
                    "https://images.igdb.com/igdb/image/upload/t_screenshot_huge/{}.jpg",
                    screenshot_id
                );
                games[i]["screenshots"][j] = serde_json::Value::String(screenshot_url);
            }
        }
        if games[i]["artworks"].is_array() {
            for j in 0..games[i]["artworks"].as_array().unwrap().len() {
                let artwork_id = games[i]["artworks"][j]["image_id"].as_str().unwrap_or("");
                let artwork_url = format!(
                    "https://images.igdb.com/igdb/image/upload/t_screenshot_huge/{}.jpg",
                    artwork_id
                );
                games[i]["artworks"][j] = serde_json::Value::String(artwork_url);
            }
        }
        if games[i]["videos"].is_array() {
            for j in 0..games[i]["videos"].as_array().unwrap().len() {
                let video_id = games[i]["videos"][j]["video_id"].as_str().unwrap_or("");
                let video_url = format!("https://www.youtube.com/watch?v={}", video_id);
                games[i]["videos"][j] = serde_json::Value::String(video_url);
            }
        }
        games[i]["background"] = games[i]["screenshots"][0].clone();
        games[i]["platforms"] = serde_json::Value::String("Other".to_string());

        let summary = games[i]["summary"].as_str();
        let storyline = games[i]["storyline"].as_str();

        games[i]["description"] = serde_json::Value::String(match (summary, storyline) {
            (Some(s), Some(st)) => format!("{} {}", s, st),
            (Some(s), None) => s.to_string(),
            (None, Some(st)) => st.to_string(),
            (None, None) => "No description found".to_string(),
        });

        if let Some(genres) = games[i]["genres"].as_array() {
            if !genres.is_empty() {
                let genres_names: Result<Vec<&str>, _> = genres
                    .iter()
                    .map(|genre| genre["name"].as_str().ok_or("No genre name found"))
                    .collect();
                match genres_names {
                    Ok(names) => {
                        let joined_names = names.join(", ");
                        games[i]["genres"] = serde_json::Value::String(joined_names);
                    }
                    Err(_) => {
                        games[i]["genres"] =
                            serde_json::Value::String("No genre found".to_string());
                    }
                }
            }
        }

        if let Some(themes) = games[i]["themes"].as_array() {
            if !themes.is_empty() {
                let themes_names: Result<Vec<&str>, _> = themes
                    .iter()
                    .map(|theme| theme["name"].as_str().ok_or("No theme name found"))
                    .collect();
                match themes_names {
                    Ok(names) => {
                        let joined_names = names.join(", ");
                        games[i]["styles"] = serde_json::Value::String(joined_names);
                    }
                    Err(_) => {}
                }
            }
        }

        if let Some(companies) = games.clone()[i]["involved_companies"].as_array() {
            if !companies.is_empty() {
                let mut developers = vec![];
                let mut publishers = vec![];
                for company in companies {
                    let company_name = company["company"]["name"].as_str().unwrap_or("");
                    match company["developer"].as_bool() {
                        Some(true) => developers.push(company_name),
                        Some(false) => match company["publisher"].as_bool() {
                            Some(true) => publishers.push(company_name),
                            Some(false) => (),
                            None => (),
                        },
                        _ => (),
                    }
                }
                games[i]["developers"] = serde_json::Value::String(developers.join(", "));
                games[i]["editors"] = serde_json::Value::String(publishers.join(", "));
            }
        }

        games[i]["critic_score"] = games[i]["aggregated_rating"].clone();

        if let Some(first_release_date) = games[i]["first_release_date"].as_i64() {
            let release_date = DateTime::<Utc>::from_utc(
                NaiveDateTime::from_timestamp(first_release_date, 0),
                Utc,
            );
            games[i]["release_date"] =
                serde_json::Value::String(release_date.format("%d/%m/%Y").to_string());
        }

        if let Some(id_val) = games[i].get("id").cloned() {
            games[i]["igdb_id"] = serde_json::Value::String(id_val.to_string());
        }
        if let Some(obj) = games[i].as_object_mut() {
            obj.remove("id");
            obj.remove("rating");
            obj.remove("release_dates");
            obj.remove("external_games");
            obj.remove("category");
            obj.remove("dlcs");
            obj.remove("involved_companies");
            obj.remove("player_perspectives");
        }
    }
    Ok(games.iter().map(|game| game.to_string()).collect())
}

async fn add_to_execption_list_for_routine(game_name: &str) {
    let proj_dirs = ProjectDirs::from("fr", "Nytuo", "Meteoric").unwrap();
    let path = proj_dirs.config_dir().join("exceptions_igdb_routine.txt");
    let mut file = OpenOptions::new()
        .write(true)
        .append(true)
        .create(true)
        .open(path)
        .await
        .unwrap();

    let _ = file.write_all(format!("{}\n", game_name).as_bytes()).await;
    let _ = file.sync_all().await;
}

async fn read_exception_list_for_routine() -> Vec<String> {
    let proj_dirs = ProjectDirs::from("fr", "Nytuo", "Meteoric").unwrap();
    let path = proj_dirs.config_dir().join("exceptions_igdb_routine.txt");
    if !path.exists() {
        let _ = File::create(&path).unwrap();
    }
    let file = tokio::fs::File::open(path).await.unwrap();
    let reader = tokio::io::BufReader::new(file);
    let mut lines = reader.lines();
    let mut exceptions = vec![];
    while let Some(line) = lines.next_line().await.unwrap() {
        exceptions.push(line);
    }
    exceptions
}

fn remove_odds_in_string(s: &str) -> String {
    let without_symbols: String = s
        .chars()
        .filter(|&c| !matches!(c, '™' | '®' | '©'))
        .collect();

    let without_parenthesis = regex::Regex::new(r"\(.*?\)")
        .unwrap()
        .replace_all(&without_symbols, "")
        .to_string();

    let without_special_editions = regex::Regex::new(r"(?i)Complete Edition|GOTY.*")
        .unwrap()
        .replace_all(&without_parenthesis, "")
        .to_string();

    let parts: Vec<&str> = without_special_editions.split('-').collect();
    parts[0].trim().to_string()
}

pub async fn routine(game_name: String, db_id: String) -> Result<(), Box<dyn std::error::Error>> {
    let game_name_without_odds = remove_odds_in_string(&game_name);
    if game_name_without_odds.is_empty() {
        return Ok(());
    }
    let exceptions = task::block_in_place(|| {
        let rt = tokio::runtime::Runtime::new().unwrap();
        rt.block_on(read_exception_list_for_routine())
    });
    if exceptions.contains(&game_name_without_odds) {
        return Ok(());
    }
    let games = task::block_in_place(|| {
        let rt = tokio::runtime::Runtime::new().unwrap();
        rt.block_on(search_game_igdb(&game_name_without_odds, true))
    })?;
    if games.is_empty() {
        println!("[IGDB] No game found for {}", game_name);
        add_to_execption_list_for_routine(game_name_without_odds.clone().as_str()).await;
        return Ok(());
    }
    let first_game = games[0].clone();
    let game_json: serde_json::Value = serde_json::from_str(&first_game).unwrap();
    let conn = establish_connection().unwrap();
    let mut igame = get_game_by_id(&conn, &db_id).unwrap();
    igame.name = game_json
        .get("name")
        .unwrap_or(&serde_json::Value::String("".to_string()))
        .as_str()
        .unwrap_or("")
        .to_string();
    igame.sort_name = game_json
        .get("name")
        .unwrap_or(&serde_json::Value::String("".to_string()))
        .as_str()
        .unwrap_or("")
        .to_string();
    igame.rating = game_json
        .get("rating")
        .and_then(|v| v.as_str())
        .unwrap_or("0")
        .parse::<f32>()
        .unwrap_or(0.0)
        .to_string();
    igame.platforms = game_json
        .get("platforms")
        .and_then(|v| v.as_str())
        .unwrap_or("")
        .to_string();
    igame.tags = game_json
        .get("tags")
        .and_then(|v| v.as_str())
        .unwrap_or("")
        .to_string();
    igame.description = game_json
        .get("description")
        .and_then(|v| v.as_str())
        .unwrap_or("")
        .to_string();
    igame.critic_score = game_json
        .get("critic_score")
        .and_then(|v| v.as_f64())
        .unwrap_or(0.0)
        .to_string();
    igame.genres = game_json
        .get("genres")
        .and_then(|v| v.as_str())
        .unwrap_or("")
        .to_string();
    igame.styles = game_json
        .get("styles")
        .and_then(|v| v.as_str())
        .unwrap_or("")
        .to_string();
    igame.release_date = game_json
        .get("release_date")
        .and_then(|v| v.as_str())
        .unwrap_or("0")
        .to_string();
    igame.developers = game_json
        .get("developers")
        .and_then(|v| v.as_str())
        .unwrap_or("")
        .to_string();
    igame.editors = game_json
        .get("editors")
        .and_then(|v| v.as_str())
        .unwrap_or("")
        .to_string();
    igame.igdb_id = game_json
        .get("igdb_id")
        .and_then(|v| v.as_str())
        .unwrap_or_default()
        .to_string();
    igame.id = db_id;
    let conn = establish_connection().unwrap();
    let _ = update_game(&conn, igame.clone());
    let screenshots: Vec<String> = game_json
        .get("screenshots")
        .and_then(|v| v.as_array())
        .unwrap_or(&Vec::new())
        .iter()
        .filter_map(|v| v.as_str().map(|s| s.to_string()))
        .collect();

    let metadata = Metadata {
        jaquette: Some(
            game_json
                .get("cover")
                .and_then(|v| v.as_str())
                .unwrap_or_default()
                .to_owned(),
        ),
        background: Some(
            game_json
                .get("background")
                .and_then(|v| v.as_str())
                .unwrap_or_default()
                .to_owned(),
        ),
        logo: Some(
            game_json
                .get("logo")
                .and_then(|v| v.as_str())
                .unwrap_or_default()
                .to_owned(),
        ),
        icon: Some(
            game_json
                .get("icon")
                .and_then(|v| v.as_str())
                .unwrap_or_default()
                .to_owned(),
        ),
        screenshots: Some(screenshots),
        videos: None,
        audio: None,
    };
    let _ = task::block_in_place(|| {
        let rt = tokio::runtime::Runtime::new().unwrap();
        rt.block_on(save_media_to_external_storage(igame.clone().id, metadata))
    });
    Ok(())
}

lazy_static::lazy_static! {
    static ref CLIENT_ID: Mutex<String> = Mutex::new("".to_string());
    static ref CLIENT_SECRET: Mutex<String> = Mutex::new("".to_string());
    static ref ACCESS_TOKEN: Mutex<String> = Mutex::new("".to_string());
    static ref TOKEN_EXPIRATION: Mutex<String> = Mutex::new("".to_string());
}

pub fn set_credentials(creds: Vec<String>) {
    if creds.len() < 2 {
        eprintln!("[IGDB] set_credentials called with insufficient arguments");
        return;
    }
    let client_id = creds[0].to_string();
    let client_secret = creds[1].to_string();
    let mut id = CLIENT_ID.lock().unwrap_or_else(|e| e.into_inner());
    let mut secret = CLIENT_SECRET.lock().unwrap_or_else(|e| e.into_inner());
    *id = client_id;
    *secret = client_secret;
}

pub fn search_game(
    game_name: &str,
    strict: bool,
) -> Result<Vec<String>, Box<dyn std::error::Error>> {
    let result = task::block_in_place(|| {
        let rt = tokio::runtime::Runtime::new().unwrap();
        rt.block_on(search_game_igdb(game_name, strict))
    });
    result
}

pub async fn bulk_search_igdb(
    names: Vec<String>,
) -> Result<HashMap<String, Option<String>>, Box<dyn std::error::Error>> {
    const REQUEST_DELAY: std::time::Duration = std::time::Duration::from_millis(300);

    let total = names.len();
    let mut results: HashMap<String, Option<String>> = HashMap::new();
    for (i, name) in names.iter().enumerate() {
        if i > 0 {
            tokio::time::sleep(REQUEST_DELAY).await;
        }

        send_message_to_frontend(&format!("[IGDB-LOOKUP-PROGRESS]{}|{}", i + 1, total));

        let search_result = task::block_in_place(|| {
            let rt = tokio::runtime::Runtime::new().unwrap();
            rt.block_on(search_game_igdb(name, true))
        });

        match search_result {
            Ok(games) => {
                results.insert(name.clone(), games.into_iter().next());
            }
            Err(e) if i == 0 => {
                return Err(format!("IGDB search failed for '{}': {}", name, e).into());
            }
            Err(e) => {
                eprintln!("[IGDB] search failed for '{}': {}", name, e);
                results.insert(name.clone(), None);
            }
        }
    }

    Ok(results)
}

pub async fn bulk_enrich_missing_igdb_ids(
    games: Vec<(String, String)>,
) -> (usize, usize, Option<String>) {
    if games.is_empty() {
        return (0, 0, None);
    }

    let exceptions = read_exception_list_for_routine().await;
    let candidates: Vec<(String, String)> = games
        .into_iter()
        .filter_map(|(id, name)| {
            let cleaned = remove_odds_in_string(&name);
            if cleaned.is_empty() || exceptions.contains(&cleaned) {
                None
            } else {
                Some((id, cleaned))
            }
        })
        .collect();
    if candidates.is_empty() {
        return (0, 0, None);
    }

    let names: Vec<String> = candidates.iter().map(|(_, name)| name.clone()).collect();
    let results = match bulk_search_igdb(names).await {
        Ok(r) => r,
        Err(e) => {
            let msg = e.to_string();
            eprintln!("[IGDB] bulk_enrich_missing_igdb_ids failed: {}", msg);
            return (0, candidates.len(), Some(msg));
        }
    };

    let conn = match establish_connection() {
        Ok(c) => c,
        Err(e) => return (0, candidates.len(), Some(e.to_string())),
    };

    let mut matched = 0usize;
    for (id, name) in &candidates {
        let found_igdb_id = results
            .get(name)
            .and_then(|v| v.as_ref())
            .and_then(|game_json| serde_json::from_str::<serde_json::Value>(game_json).ok())
            .and_then(|parsed| {
                parsed
                    .get("igdb_id")
                    .and_then(|v| v.as_str())
                    .map(|s| s.to_string())
            })
            .filter(|s| !s.is_empty());

        match found_igdb_id {
            Some(igdb_id) if set_igdb_id(&conn, id, &igdb_id).is_ok() => {
                matched += 1;
            }
            _ => {
                add_to_execption_list_for_routine(name).await;
            }
        }
    }

    (matched, candidates.len(), None)
}
