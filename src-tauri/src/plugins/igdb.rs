use std::collections::HashMap;
use std::sync::Mutex;

use crate::database::{establish_connection, get_game_by_id, update_game};
use crate::file_operations::save_media_to_external_storage;
use crate::{to_title_case, IGame, Metadata};
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
    if json.contains_key("message") && json["message"].as_str().unwrap() == "invalid client" {
        return Err("Error while getting token".into());
    }
    Ok(json)
}

pub(crate) async fn search_game_igdb(
    game_name: &str,
    routine_mode: bool,
) -> Result<Vec<String>, Box<dyn std::error::Error>> {
    let client_id = CLIENT_ID.lock().unwrap().to_string();
    let client_secret = CLIENT_SECRET.lock().unwrap().to_string();
    let mut access_token = ACCESS_TOKEN.lock().unwrap();
    let mut expiration = TOKEN_EXPIRATION.lock().unwrap();
    if expiration.is_empty()
        || Utc::now() > chrono::DateTime::parse_from_rfc3339(&*expiration)?.with_timezone(&Utc)
    {
        let d: HashMap<String, serde_json::Value> =
            calculate_igdb_token(client_id.clone(), client_secret.clone()).await?;
        *access_token = d["access_token"].to_string().replace("\"", "");
        *expiration = Utc::now()
            .checked_add_signed(chrono::Duration::seconds(d["expires_in"].as_i64().unwrap()))
            .unwrap()
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
                "fields {}; limit 1; where version_parent = null & name = \"{}\";",
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
    let text = response.text().await?;
    let games: serde_json::Value = serde_json::from_str(&text)?;
    let mut games = games.as_array().unwrap().clone();
    for i in 0..games.len() {
        if games[i]["cover"].is_object() {
            let cover_id = games[i]["cover"]["image_id"].as_str().unwrap();
            let cover_url = format!(
                "https://images.igdb.com/igdb/image/upload/t_cover_big_2x/{}.jpg",
                cover_id
            );
            games[i]["cover"] = serde_json::Value::String(cover_url);
        }
        if games[i]["screenshots"].is_array() {
            for j in 0..games[i]["screenshots"].as_array().unwrap().len() {
                let screenshot_id = games[i]["screenshots"][j]["image_id"].as_str().unwrap();
                let screenshot_url = format!(
                    "https://images.igdb.com/igdb/image/upload/t_screenshot_huge/{}.jpg",
                    screenshot_id
                );
                games[i]["screenshots"][j] = serde_json::Value::String(screenshot_url);
            }
        }
        if games[i]["artworks"].is_array() {
            for j in 0..games[i]["artworks"].as_array().unwrap().len() {
                let artwork_id = games[i]["artworks"][j]["image_id"].as_str().unwrap();
                let artwork_url = format!(
                    "https://images.igdb.com/igdb/image/upload/t_screenshot_huge/{}.jpg",
                    artwork_id
                );
                games[i]["artworks"][j] = serde_json::Value::String(artwork_url);
            }
        }
        if games[i]["videos"].is_array() {
            for j in 0..games[i]["videos"].as_array().unwrap().len() {
                let video_id = games[i]["videos"][j]["video_id"].as_str().unwrap();
                let video_url = format!("https://www.youtube.com/watch?v={}", video_id);
                games[i]["videos"][j] = serde_json::Value::String(video_url);
            }
        }
        games[i]["background"] = games[i]["screenshots"][0].clone();
        games[i]["platforms"] = serde_json::Value::String("Other".to_string());

        let summary = games[i]["summary"].as_str();
        let storyline = games[i]["storyline"].as_str();
        //merge summary and storyline

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
                    Err(_) => {
                        // Handle the error here, e.g., log it or set a default value
                    }
                }
            }
        }

        if let Some(companies) = games.clone()[i]["involved_companies"].as_array() {
            if !companies.is_empty() {
                let mut developers = vec![];
                let mut publishers = vec![];
                for company in companies {
                    let company_name = company["company"]["name"].as_str().unwrap();
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

        games[i].as_object_mut().unwrap().remove("id");
        games[i].as_object_mut().unwrap().remove("rating");
        games[i].as_object_mut().unwrap().remove("release_dates");
        games[i].as_object_mut().unwrap().remove("external_games");
        games[i].as_object_mut().unwrap().remove("category");
        games[i].as_object_mut().unwrap().remove("dlcs");
        games[i]
            .as_object_mut()
            .unwrap()
            .remove("involved_companies");
        games[i]
            .as_object_mut()
            .unwrap()
            .remove("player_perspectives");
    }
    Ok(games.iter().map(|game| game.to_string()).collect())
}

fn remove_odds_in_string(s: &str) -> String {
    let mut s = s.to_string();
    s.retain(|c| c.is_ascii_alphanumeric() || c.is_ascii_whitespace());
    s
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

pub async fn routine(game_name: String, db_id: String) -> Result<(), Box<dyn std::error::Error>> {
    let game_name = remove_odds_in_string(&game_name);
    if game_name.is_empty() {
        return Ok(());
    }
    let exceptions = task::block_in_place(|| {
        let rt = tokio::runtime::Runtime::new().unwrap();
        rt.block_on(read_exception_list_for_routine())
    });
    if exceptions.contains(&game_name) {
        return Ok(());
    }
    let games = task::block_in_place(|| {
        let rt = tokio::runtime::Runtime::new().unwrap();
        rt.block_on(search_game_igdb(&game_name, true))
    })
    .unwrap();
    if games.len() == 0 {
        println!("No games found for {}", &game_name);
        add_to_execption_list_for_routine(game_name.clone().as_str()).await;
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
        .unwrap_or(&serde_json::Value::String("0".to_string()))
        .as_str()
        .unwrap()
        .parse::<f32>()
        .unwrap()
        .to_string();
    igame.platforms = game_json
        .get("platforms")
        .unwrap_or(&serde_json::Value::String("".to_string()))
        .as_str()
        .unwrap()
        .to_string();
    igame.tags = game_json
        .get("tags")
        .unwrap_or(&serde_json::Value::String("".to_string()))
        .as_str()
        .unwrap()
        .to_string();
    igame.description = game_json
        .get("description")
        .unwrap_or(&serde_json::Value::String("".to_string()))
        .as_str()
        .unwrap()
        .to_string();
    igame.critic_score = game_json
        .get("critic_score")
        .and_then(|v| v.as_f64())
        .unwrap_or(0.0)
        .to_string();
    igame.genres = game_json
        .get("genres")
        .unwrap_or(&serde_json::Value::String("".to_string()))
        .as_str()
        .unwrap()
        .to_string();
    igame.styles = game_json
        .get("styles")
        .unwrap_or(&serde_json::Value::String("".to_string()))
        .as_str()
        .unwrap()
        .to_string();
    igame.release_date = game_json
        .get("release_date")
        .unwrap_or(&serde_json::Value::String("0".to_string()))
        .as_str()
        .unwrap()
        .to_string();
    igame.developers = game_json
        .get("developers")
        .unwrap_or(&serde_json::Value::String("".to_string()))
        .as_str()
        .unwrap()
        .to_string();
    igame.editors = game_json
        .get("editors")
        .unwrap_or(&serde_json::Value::String("".to_string()))
        .as_str()
        .unwrap()
        .to_string();
    igame.id = db_id;
    let conn = establish_connection().unwrap();
    let _ = update_game(&conn, igame.clone());
    let screenshots: Vec<String> = game_json
        .get("screenshots")
        .unwrap_or(&serde_json::Value::Array(Vec::new()))
        .as_array()
        .unwrap()
        .iter()
        .map(|v| v.as_str().unwrap().to_string())
        .collect();
    let videos: Vec<String> = game_json
        .get("videos")
        .unwrap_or(&serde_json::Value::Array(Vec::new()))
        .as_array()
        .unwrap()
        .iter()
        .map(|v| v.as_str().unwrap().to_string())
        .collect();
    let metadata = Metadata {
        jaquette: Some(
            game_json
                .get("cover")
                .unwrap_or(&serde_json::Value::String("".to_owned()))
                .as_str()
                .unwrap()
                .to_owned()
                .clone(),
        ),
        background: Some(
            game_json
                .get("background")
                .unwrap_or(&serde_json::Value::String("".to_owned()))
                .as_str()
                .unwrap()
                .to_owned()
                .clone(),
        ),
        logo: Some(
            game_json
                .get("logo")
                .unwrap_or(&serde_json::Value::String("".to_owned()))
                .as_str()
                .unwrap()
                .to_owned()
                .clone(),
        ),
        icon: Some(
            game_json
                .get("icon")
                .unwrap_or(&serde_json::Value::String("".to_owned()))
                .as_str()
                .unwrap()
                .to_owned()
                .clone(),
        ),
        screenshots: Some(screenshots),
        videos: Some(videos),
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
    let client_id = creds[0].to_string();
    let client_secret = creds[1].to_string();
    let mut id = CLIENT_ID.lock().unwrap();
    let mut secret = CLIENT_SECRET.lock().unwrap();
    *id = client_id.to_string();
    *secret = client_secret.to_string();
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
