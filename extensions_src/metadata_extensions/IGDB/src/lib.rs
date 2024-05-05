use std::collections::HashMap;
use reqwest::header::HeaderMap;
#[no_mangle]
pub async extern "C" fn calculate_igdb_token(client_id: &str, client_secret: &str) -> Result<String, Box<dyn std::error::Error>> {
    let url = "https://id.twitch.tv/oauth2/token?client_id=".to_string() + client_id + "&client_secret=" + client_secret + "&grant_type=client_credentials";
    let client = reqwest::Client::new();
    let response = client.post(url).send().await?;
    let json: HashMap<String, serde_json::Value> = response.json().await?;
    match json.get("access_token") {
        Some(token) => {
            println!("Access token: {:?}", token);
        }
        None => {
            println!("No access token found");
        }
    }
    Ok(json["access_token"].to_string())
}

#[no_mangle]
pub async extern "C" fn search_game(game_name: &str) -> Result<Vec<String>, Box<dyn std::error::Error>> {
    let access_token = calculate_igdb_token("ouhbo4ww6pkcmbthrh1y3uzsoghclw", "imuzybhck3fu1phngkggkovpm41ooc").await.unwrap().replace("\"", "");
    let igdb_base_url = "https://api.igdb.com/v4/";
    let request_url = igdb_base_url.to_string() + "games";
    let fields = "name,cover.image_id,genres.name,platforms.*,release_dates.date,summary,screenshots.image_id,age_ratings.*,aggregated_rating,artworks.image_id,category,dlcs.*,collection.*,first_release_date,franchise.name,game_engines.*,game_modes.name,involved_companies.company.url,involved_companies.company.start_date,involved_companies.company.name,involved_companies.company.description,involved_companies.company.country,involved_companies.company.logo.image_id,multiplayer_modes.*,platforms.*,player_perspectives.name,rating,remakes.name,remasters.name,standalone_expansions.name,status,storyline,url,videos.video_id,websites.url";

    let mut headers = HeaderMap::new();
    headers.insert("Client-ID", "ouhbo4ww6pkcmbthrh1y3uzsoghclw".parse().unwrap());
    headers.insert("Authorization",
                   format!("Bearer {}", access_token).parse().unwrap());
    headers.insert("Accept", "application/json".parse().unwrap());
    let game_reaquest = reqwest::Client::new().post(request_url)
        .body(format!("fields {}; limit 20; where version_parent = null & name ~ *\"{}\"*;", fields, game_name))
        .headers(headers);
    println!("Request: {:?}", game_reaquest);
    let response = game_reaquest.send().await?;
    let text = response.text().await?;
    let games: serde_json::Value = serde_json::from_str(&text)?;
    let games = games.as_array().unwrap();
    Ok(games.iter().map(|game| game.to_string()).collect())
}

#[no_mangle]
pub extern "C" fn search_game_sync_wrapper(game_name: &str) -> Result<Vec<String>, Box<dyn std::error::Error>> {
    let rt = tokio::runtime::Runtime::new().unwrap();
    rt.block_on(search_game(game_name))
}

#[no_mangle]
pub extern "C" fn calculate_igdb_token_sync_wrapper(client_id: &str, client_secret: &str) -> Result<String, Box<dyn std::error::Error>> {
    let rt = tokio::runtime::Runtime::new().unwrap();
    rt.block_on(calculate_igdb_token(client_id, client_secret))
}

#[no_mangle]
pub extern "C" fn get_api_version()-> u8{
 return 145;
}

#[cfg(test)]
mod tests {
    use super::*;
    use tokio;

    #[tokio::test]
    async fn test_calculate_igdb_token() {
        let client_id = "ouhbo4ww6pkcmbthrh1y3uzsoghclw";
        let client_secret = "imuzybhck3fu1phngkggkovpm41ooc";
        let result = calculate_igdb_token(client_id, client_secret).await.unwrap();
        assert!(!result.is_empty());
    }

    #[tokio::test]
    async fn test_search_game() {
        let game_name = "Cyberpunk 2077";
        let result = search_game(game_name).await.unwrap();
        println!("{:?}", result);
        assert!(!result.is_empty());
    }

    #[test]
    fn test_get_api_version() {
        let result = get_api_version();
        assert_eq!(result, 145);
    }
}
