/// Epic Games achievements — fetches player achievements from the Epic Games Store.
///
/// The egs-api crate does not include an achievements API, so this module
/// directly calls the Epic Games achievement service endpoints.
///
/// EGS achievements use the Epic Online Services (EOS) achievement API:
///   POST https://graphql.epicgames.com/graphql
///   with a specific GraphQL query for player achievements.
use std::collections::HashMap;

use reqwest::header::{HeaderMap, HeaderValue, AUTHORIZATION, CONTENT_TYPE, USER_AGENT};
use serde::{Deserialize, Serialize};

use super::{ensure_logged_in, EPIC};
use crate::database::{establish_connection, update_achievements};
use crate::{send_message_to_frontend, ITrophy};

// ──────────────────────────────────────────────
// Achievement types
// ──────────────────────────────────────────────

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct EpicAchievement {
    pub achievement_name: String,
    pub display_name: String,
    pub description: String,
    pub hidden: bool,
    pub unlocked: bool,
    pub unlock_date: Option<String>,
    pub locked_icon_url: String,
    pub unlocked_icon_url: String,
    pub progress: f64,
    pub xp: u32,
}

// ──────────────────────────────────────────────
// GraphQL queries for achievements
// ──────────────────────────────────────────────

const GRAPHQL_URL: &str = "https://launcher.store.epicgames.com/graphql";

const ACHIEVEMENTS_QUERY: &str = r#"
query Achievement($SandboxId: String!, $Locale: String!) {
  Achievement {
    productAchievementsRecordBySandbox(sandboxId: $SandboxId, locale: $Locale) {
      productId
      sandboxId
      totalAchievements
      achievements {
        achievement {
          name
          hidden
          unlockedDisplayName
          lockedDisplayName
          unlockedDescription
          lockedDescription
          unlockedIconLink
          lockedIconLink
          XP
          rarity {
            percent
          }
        }
      }
    }
  }
}
"#;

const PLAYER_ACHIEVEMENTS_QUERY: &str = r#"
query playerProfileAchievementsByProductId($EpicAccountId: String!, $ProductId: String!) {
  PlayerProfile {
    playerProfile(epicAccountId: $EpicAccountId) {
      productAchievements(productId: $ProductId) {
        ... on PlayerProductAchievementsResponseSuccess {
          data {
            playerAchievements {
              playerAchievement {
                achievementName
                progress
                unlocked
                unlockDate
              }
            }
          }
        }
      }
    }
  }
}
"#;

// ──────────────────────────────────────────────
// Achievement fetching
// ──────────────────────────────────────────────

/// Fetch achievements for a game (by sandbox/namespace).
/// Returns a list of achievements with player progress merged in.
pub async fn fetch_achievements(
    app_name: &str,
    namespace: &str,
) -> Result<Vec<EpicAchievement>, String> {
    ensure_logged_in().await?;

    let (access_token, account_id) = {
        let client = EPIC.lock().await;
        let ud = client.user_details();
        let token = ud
            .access_token()
            .map(|t| t.to_string())
            .unwrap_or_default();
        let account = ud.account_id.clone().unwrap_or_default();
        (token, account)
    };

    // Use the same User-Agent as Playnite's EpicApi — required to pass Cloudflare
    let ua = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) EpicGamesLauncher";

    let http_client = reqwest::Client::builder()
        .user_agent(ua)
        .build()
        .map_err(|e| e.to_string())?;

    // Shared headers for all requests
    let mut base_headers = HeaderMap::new();
    base_headers.insert(CONTENT_TYPE, HeaderValue::from_static("application/json"));
    base_headers.insert(
        USER_AGENT,
        HeaderValue::from_static("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) EpicGamesLauncher"),
    );

    // 1. Fetch available achievements for the game (anonymous — no auth needed per Playnite)
    let achievements_body = serde_json::json!({
        "query": ACHIEVEMENTS_QUERY,
        "variables": {
            "SandboxId": namespace,
            "Locale": "en-US"
        }
    });

    let resp = http_client
        .post(GRAPHQL_URL)
        .headers(base_headers.clone())
        .json(&achievements_body)
        .send()
        .await
        .map_err(|e| format!("Achievements request failed: {}", e))?;

    let status = resp.status();
    let body_text = resp
        .text()
        .await
        .map_err(|e| format!("Failed to read achievements response body: {}", e))?;

    send_message_to_frontend(&format!("[EPIC-ACH] Achievements response ({status}): {body_text}"));

    let achievements_data: serde_json::Value = serde_json::from_str(&body_text)
        .map_err(|e| format!("Failed to parse achievements response ({}): {} — body: {}", status, e, &body_text[..body_text.len().min(500)]))?;

    // Extract productId needed for player achievements query
    let product_id = achievements_data
        .pointer("/data/Achievement/productAchievementsRecordBySandbox/productId")
        .and_then(|v| v.as_str())
        .unwrap_or("")
        .to_string();

    // Parse the achievement definitions
    let mut achievements: Vec<EpicAchievement> = Vec::new();

    if let Some(achievements_list) = achievements_data
        .pointer("/data/Achievement/productAchievementsRecordBySandbox/achievements")
        .and_then(|v| v.as_array())
    {
        for wrapper in achievements_list {
            // Each entry is { achievement: { name, hidden, ... } }
            let ach = match wrapper.get("achievement") {
                Some(a) => a,
                None => continue,
            };

            let name = ach
                .get("name")
                .and_then(|v| v.as_str())
                .unwrap_or("")
                .to_string();

            let hidden = ach.get("hidden").and_then(|v| v.as_bool()).unwrap_or(false);

            let display_name = ach
                .get("unlockedDisplayName")
                .and_then(|v| v.as_str())
                .unwrap_or(&name)
                .to_string();

            let description = ach
                .get("unlockedDescription")
                .and_then(|v| v.as_str())
                .unwrap_or("")
                .to_string();

            let locked_icon = ach
                .get("lockedIconLink")
                .and_then(|v| v.as_str())
                .unwrap_or("")
                .to_string();

            let unlocked_icon = ach
                .get("unlockedIconLink")
                .and_then(|v| v.as_str())
                .unwrap_or("")
                .to_string();

            let xp = ach.get("XP").and_then(|v| v.as_u64()).unwrap_or(0) as u32;

            achievements.push(EpicAchievement {
                achievement_name: name,
                display_name,
                description,
                hidden,
                unlocked: false,
                unlock_date: None,
                locked_icon_url: locked_icon,
                unlocked_icon_url: unlocked_icon,
                progress: 0.0,
                xp,
            });
        }
    }

    // 2. Fetch player progress using productId from step 1 (requires auth)
    let mut auth_headers = base_headers.clone();
    auth_headers.insert(
        AUTHORIZATION,
        HeaderValue::from_str(&format!("bearer {}", access_token))
            .map_err(|e| e.to_string())?,
    );

    let player_body = serde_json::json!({
        "query": PLAYER_ACHIEVEMENTS_QUERY,
        "variables": {
            "EpicAccountId": account_id,
            "ProductId": product_id
        }
    });

    let resp = http_client
        .post(GRAPHQL_URL)
        .headers(auth_headers)
        .json(&player_body)
        .send()
        .await
        .map_err(|e| format!("Player achievements request failed: {}", e))?;

    let status = resp.status();
    let body_text = resp
        .text()
        .await
        .map_err(|e| format!("Failed to read player achievements response body: {}", e))?;

    send_message_to_frontend(&format!("[EPIC-ACH] Player achievements response ({status}): {body_text}"));

    let player_data: serde_json::Value = serde_json::from_str(&body_text)
        .map_err(|e| format!("Failed to parse player achievements response ({}): {} — body: {}", status, e, &body_text[..body_text.len().min(500)]))?;

    // Merge player progress into achievements
    let mut player_map: HashMap<String, (bool, Option<String>, f64)> = HashMap::new();
    if let Some(records) = player_data
        .pointer("/data/PlayerProfile/playerProfile/productAchievements/data/playerAchievements")
        .and_then(|v| v.as_array())
    {
        for wrapper in records {
            // Each entry is { playerAchievement: { achievementName, ... } }
            let record = match wrapper.get("playerAchievement") {
                Some(r) => r,
                None => continue,
            };
            let name = record
                .get("achievementName")
                .and_then(|v| v.as_str())
                .unwrap_or("")
                .to_string();
            let unlocked = record
                .get("unlocked")
                .and_then(|v| v.as_bool())
                .unwrap_or(false);
            let unlock_date = record
                .get("unlockDate")
                .and_then(|v| v.as_str())
                .map(|s| s.to_string());
            let progress = record
                .get("progress")
                .and_then(|v| v.as_f64())
                .unwrap_or(0.0);
            player_map.insert(name, (unlocked, unlock_date, progress));
        }
    }

    for ach in &mut achievements {
        if let Some((unlocked, unlock_date, progress)) =
            player_map.get(&ach.achievement_name)
        {
            ach.unlocked = *unlocked;
            ach.unlock_date = unlock_date.clone();
            ach.progress = *progress;
        }
    }

    Ok(achievements)
}

/// Fetch achievements for a game and store them in the database.
/// `game_id` is the Meteoric database ID, `namespace` is the EGS sandbox ID.
pub async fn sync_achievements(
    game_id: &str,
    app_name: &str,
    namespace: &str,
) -> Result<usize, String> {
    let achievements = fetch_achievements(app_name, namespace).await?;

    if achievements.is_empty() {
        return Ok(0);
    }

    // Convert to ITrophy for database storage
    let trophies: Vec<ITrophy> = achievements
        .iter()
        .map(|ach| ITrophy {
            id: String::new(),
            game_id: game_id.to_string(),
            name: ach.display_name.clone(),
            description: ach.description.clone(),
            visible: if ach.hidden {
                "false".to_string()
            } else {
                "true".to_string()
            },
            date_of_unlock: ach.unlock_date.clone().unwrap_or_default(),
            importer_id: "epic".to_string(),
            image_url_locked: ach.locked_icon_url.clone(),
            image_url_unlocked: ach.unlocked_icon_url.clone(),
            unlocked: if ach.unlocked {
                "true".to_string()
            } else {
                "false".to_string()
            },
        })
        .collect();

    let count = trophies.len();

    let conn = establish_connection().unwrap();
    update_achievements(&conn, trophies).map_err(|e| format!("Failed to save achievements: {}", e))?;

    // Update the trophies count on the game row
    let unlocked_count = achievements.iter().filter(|a| a.unlocked).count();
    let sql = format!(
        "UPDATE games SET trophies = '{}', trophies_unlocked = '{}' WHERE id = '{}'",
        count, unlocked_count, game_id
    );
    let _ = conn.execute(&sql, []);

    send_message_to_frontend(&format!(
        "[EPIC-ACH] Synced {} achievements ({} unlocked) for {}",
        count, unlocked_count, app_name
    ));

    Ok(count)
}
