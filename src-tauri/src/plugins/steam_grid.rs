use serde::{Deserialize, Serialize};
use steamgriddb_api::Client;
use tokio::sync::Mutex;
use tokio::task;

// ── Public image struct — mime is a plain String so gif/webm never break deserialization ──

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct SteamGridImage {
    pub url: String,
    pub thumb: String,
    pub mime: String,
}

#[derive(Deserialize)]
struct RawApiResponse {
    data: Option<Vec<serde_json::Value>>,
}

// ── Shared state ──────────────────────────────────────────────────────────────

lazy_static::lazy_static! {
    static ref CLIENT: Mutex<Client> = Mutex::new(Client::new("".to_string()));
    static ref API_KEY: Mutex<String> = Mutex::new(String::new());
}

pub async fn set_credentials(cred: String) {
    {
        let mut key = API_KEY.lock().await;
        *key = cred.clone();
    }
    let mut client = CLIENT.lock().await;
    *client = Client::new(cred);
}

// ── Search (still uses the crate — it only touches the search endpoint which is fine) ──

pub(crate) async fn search_game_steamgrid(
    game_name: &str,
) -> Result<String, Box<dyn std::error::Error>> {
    let client = CLIENT.lock().await;
    let result = client.search(game_name).await?;
    let json = serde_json::to_string(&result).unwrap();
    Ok(json)
}

pub fn search_game(game_name: &str) -> Result<String, Box<dyn std::error::Error>> {
    let result = task::block_in_place(|| {
        let rt = tokio::runtime::Runtime::new().unwrap();
        rt.block_on(search_game_steamgrid(game_name))
    });
    result
}

// ── Raw image fetcher — bypasses the crate's typed MimeTypes enum ─────────────
// The steamgriddb_api crate's MimeTypes is an untagged enum that only knows
// image/png, image/jpeg, image/webp and icon variants. Any response item with
// mime "video/webm" or "image/gif" causes the entire Vec<Image> to fail to
// deserialize, returning an empty result. We call the REST API directly so we
// can keep mime as a plain String.

async fn fetch_raw_images(path: &str) -> Vec<SteamGridImage> {
    let api_key = API_KEY.lock().await.clone();
    if api_key.is_empty() {
        return vec![];
    }
    let url = format!("https://www.steamgriddb.com/api/v2/{}", path);
    let cl = reqwest::Client::new();
    match cl
        .get(&url)
        .header("Authorization", format!("Bearer {}", api_key))
        .send()
        .await
    {
        Ok(resp) => match resp.json::<RawApiResponse>().await {
            Ok(body) => body
                .data
                .unwrap_or_default()
                .iter()
                .filter_map(|item| {
                    Some(SteamGridImage {
                        url: item.get("url")?.as_str()?.to_string(),
                        thumb: item
                            .get("thumb")
                            .and_then(|t| t.as_str())
                            .unwrap_or("")
                            .to_string(),
                        mime: item
                            .get("mime")
                            .and_then(|m| m.as_str())
                            .unwrap_or("")
                            .to_string(),
                    })
                })
                .collect(),
            Err(_) => vec![],
        },
        Err(_) => vec![],
    }
}

// ── Tauri commands ────────────────────────────────────────────────────────────

#[tauri::command]
pub async fn steamgrid_get_grid(game_id: usize) -> Vec<SteamGridImage> {
    fetch_raw_images(&format!(
        "grids/game/{}?types=static&dimensions=600x900,342x482,660x930",
        game_id
    ))
    .await
}

#[tauri::command]
pub async fn steamgrid_get_grid_animated(game_id: usize) -> Vec<SteamGridImage> {
    fetch_raw_images(&format!(
        "grids/game/{}?types=animated&dimensions=600x900,342x482,660x930",
        game_id
    ))
    .await
}

#[tauri::command]
pub async fn steamgrid_get_grid_horizontal(game_id: usize) -> Vec<SteamGridImage> {
    fetch_raw_images(&format!(
        "grids/game/{}?types=static&dimensions=460x215,920x430,512x512,1024x1024",
        game_id
    ))
    .await
}

#[tauri::command]
pub async fn steamgrid_get_grid_horizontal_animated(game_id: usize) -> Vec<SteamGridImage> {
    fetch_raw_images(&format!(
        "grids/game/{}?types=animated&dimensions=460x215,920x430,512x512,1024x1024",
        game_id
    ))
    .await
}

#[tauri::command]
pub async fn steamgrid_get_hero(game_id: usize) -> Vec<SteamGridImage> {
    fetch_raw_images(&format!("heroes/game/{}?types=static", game_id)).await
}

#[tauri::command]
pub async fn steamgrid_get_hero_animated(game_id: usize) -> Vec<SteamGridImage> {
    fetch_raw_images(&format!("heroes/game/{}?types=animated", game_id)).await
}

#[tauri::command]
pub async fn steamgrid_get_logo(game_id: usize) -> Vec<SteamGridImage> {
    fetch_raw_images(&format!("logos/game/{}?types=static", game_id)).await
}

#[tauri::command]
pub async fn steamgrid_get_logo_animated(game_id: usize) -> Vec<SteamGridImage> {
    fetch_raw_images(&format!("logos/game/{}?types=animated", game_id)).await
}

#[tauri::command]
pub async fn steamgrid_get_icon(game_id: usize) -> Vec<SteamGridImage> {
    fetch_raw_images(&format!("icons/game/{}", game_id)).await
}
