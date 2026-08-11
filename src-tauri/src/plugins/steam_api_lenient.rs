/// Lenient Steam API client for achievements
/// Handles missing/null fields in Steam API responses
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Debug, Deserialize, Serialize)]
pub struct AchievementSchemaResponse {
    pub game: Option<GameSchema>,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct GameSchema {
    #[serde(rename = "gameName")]
    pub game_name: Option<String>,
    #[serde(rename = "availableGameStats")]
    pub available_game_stats: Option<AvailableGameStats>,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct AvailableGameStats {
    pub achievements: Option<Vec<AchievementSchema>>,
}

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct AchievementSchema {
    pub name: Option<String>,
    #[serde(rename = "displayName")]
    pub display_name: Option<String>,
    pub description: Option<String>,
    pub icon: Option<String>,
    #[serde(rename = "icongray")]
    pub icon_gray: Option<String>,
    pub hidden: Option<u32>,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct PlayerAchievementsResponse {
    pub playerstats: Option<PlayerStats>,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct PlayerStats {
    pub achievements: Option<Vec<PlayerAchievement>>,
}

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct PlayerAchievement {
    pub apiname: Option<String>,
    pub achieved: Option<u32>,
    pub unlocktime: Option<u64>,
}

#[derive(Debug, Deserialize, Serialize)]
struct OwnedGamesResponse {
    games: Option<Vec<OwnedGameEntry>>,
}

#[derive(Debug, Deserialize, Serialize)]
struct OwnedGamesWrapper {
    response: OwnedGamesResponse,
}

#[derive(Debug, Deserialize, Serialize, Clone)]
struct OwnedGameEntry {
    appid: u32,
    #[serde(default)]
    rtime_last_played: Option<i64>,
}

pub async fn get_last_played_map(api_key: &str, steam_id: u64) -> Result<HashMap<u32, i64>, String> {
    let url = format!(
        "https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/?key={}&steamid={}&include_appinfo=false&include_played_free_games=true",
        api_key, steam_id
    );

    let response = reqwest::get(&url)
        .await
        .map_err(|e| format!("Failed to fetch owned games: {}", e))?;

    let body = response
        .text()
        .await
        .map_err(|e| format!("Failed to read response: {}", e))?;

    let parsed: OwnedGamesWrapper = serde_json::from_str(&body)
        .map_err(|e| format!("Failed to parse owned games response: {}", e))?;

    let map = parsed
        .response
        .games
        .unwrap_or_default()
        .into_iter()
        .filter_map(|g| g.rtime_last_played.filter(|t| *t > 0).map(|t| (g.appid, t)))
        .collect();

    Ok(map)
}

/// Fetch achievement schema with lenient parsing
pub async fn get_achievement_schema(
    api_key: &str,
    app_id: u32,
) -> Result<Vec<AchievementSchema>, String> {
    let url = format!(
        "https://api.steampowered.com/ISteamUserStats/GetSchemaForGame/v2/?key={}&appid={}",
        api_key, app_id
    );

    let response = reqwest::get(&url)
        .await
        .map_err(|e| format!("Failed to fetch achievement schema: {}", e))?;

    let body = response
        .text()
        .await
        .map_err(|e| format!("Failed to read response: {}", e))?;

    let schema_response: AchievementSchemaResponse = serde_json::from_str(&body)
        .map_err(|e| format!("Failed to parse achievement schema: {}", e))?;

    let achievements = schema_response
        .game
        .and_then(|g| g.available_game_stats)
        .and_then(|stats| stats.achievements)
        .unwrap_or_default();

    Ok(achievements)
}

/// Fetch player achievements with lenient parsing
pub async fn get_player_achievements(
    api_key: &str,
    steam_id: u64,
    app_id: u32,
) -> Result<Vec<PlayerAchievement>, String> {
    let url = format!(
        "https://api.steampowered.com/ISteamUserStats/GetPlayerAchievements/v1/?key={}&steamid={}&appid={}",
        api_key, steam_id, app_id
    );

    let response = reqwest::get(&url)
        .await
        .map_err(|e| format!("Failed to fetch player achievements: {}", e))?;

    let body = response
        .text()
        .await
        .map_err(|e| format!("Failed to read response: {}", e))?;

    let player_response: PlayerAchievementsResponse = serde_json::from_str(&body)
        .map_err(|e| format!("Failed to parse player achievements: {}", e))?;

    let achievements = player_response
        .playerstats
        .and_then(|stats| stats.achievements)
        .unwrap_or_default();

    Ok(achievements)
}
