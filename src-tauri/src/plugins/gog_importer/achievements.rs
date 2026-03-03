/// GOG achievements — fetches player achievements from the GOG API.
///
/// Uses the `gog` crate's existing `achievements()` method which returns
/// an `AchievementList` with all achievements and unlock status.
use super::{ensure_token, build_gog_client};
use crate::database::{establish_connection, update_achievements};
use crate::{send_message_to_frontend, ITrophy};

/// Fetch and sync achievements for a GOG game.
/// `game_id` is the Meteoric database game ID.
/// `product_id` is the GOG product/game ID (numeric).
pub async fn sync_achievements(game_id: &str, product_id: &str) -> Result<usize, String> {
    let product_id_i64: i64 = product_id
        .parse()
        .map_err(|_| "Invalid GOG product ID".to_string())?;
    let game_id_owned = game_id.to_string();

    let trophies = tokio::task::block_in_place(move || -> Result<Vec<ITrophy>, String> {
        let token = ensure_token()?;
        let gog = build_gog_client(token);

        let user_id = gog.uid();

        let achievements_list = gog
            .achievements(product_id_i64, user_id)
            .map_err(|e| format!("Failed to get achievements: {:?}", e))?;

        let trophies: Vec<ITrophy> = achievements_list
            .items
            .iter()
            .map(|ach| ITrophy {
                id: String::new(),
                game_id: game_id_owned.clone(),
                name: ach.name.clone(),
                description: ach.description.clone(),
                visible: ach.visible.to_string(),
                date_of_unlock: ach.date_unlocked.clone().unwrap_or_default(),
                importer_id: "gog".to_string(),
                image_url_locked: ach.image_url_locked.clone(),
                image_url_unlocked: ach.image_url_unlocked.clone(),
                unlocked: ach.date_unlocked.is_some().to_string(),
            })
            .collect();

        Ok(trophies)
    })?;

    if trophies.is_empty() {
        return Ok(0);
    }

    let count = trophies.len();
    let unlocked_count = trophies.iter().filter(|t| t.unlocked == "true").count();

    let conn = establish_connection().unwrap();
    update_achievements(&conn, trophies)
        .map_err(|e| format!("Failed to save achievements: {}", e))?;

    // Update the trophies count on the game row
    let sql = format!(
        "UPDATE games SET trophies = '{}', trophies_unlocked = '{}' WHERE id = '{}'",
        count, unlocked_count, game_id
    );
    let _ = conn.execute(&sql, []);

    send_message_to_frontend(&format!(
        "[GOG-ACH] Synced {} achievements ({} unlocked) for product {}",
        count, unlocked_count, product_id
    ));

    Ok(count)
}
