use anyhow::{anyhow, Result};
use reqwest::Client;
use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::sync::Mutex;
use std::time::{Duration, SystemTime, UNIX_EPOCH};

const HLTB_BASE_URL: &str = "https://howlongtobeat.com";
const USER_AGENT: &str = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";
const REQUEST_TIMEOUT_MS: u64 = 10000;

const KNOWN_ENDPOINTS: &[&str] = &["find", "locate", "seek", "search"];

#[derive(Debug, Deserialize)]
struct HltbGame {
    #[serde(default)]
    pub comp_main: i64,
    #[serde(default)]
    pub comp_plus: i64,
    #[serde(default)]
    pub comp_100: i64,
    #[serde(default)]
    pub comp_all: i64,
    #[serde(default)]
    pub invested_co: i64,
    #[serde(default)]
    pub invested_mp: i64,
}

#[derive(Debug, Deserialize)]
struct SearchResponse {
    data: Vec<HltbGame>,
}

#[derive(Debug, Serialize)]
pub struct HltbTimeField {
    pub average: i64,
}

#[derive(Debug, Serialize)]
pub struct HltbResponse {
    pub main_story: HltbTimeField,
    pub main_extra: HltbTimeField,
    pub completionist: HltbTimeField,
    pub all_styles: HltbTimeField,
    #[serde(rename = "co_op")]
    pub coop: HltbTimeField,
    pub vs: HltbTimeField,
}

impl Default for HltbResponse {
    fn default() -> Self {
        Self {
            main_story: HltbTimeField { average: 0 },
            main_extra: HltbTimeField { average: 0 },
            completionist: HltbTimeField { average: 0 },
            all_styles: HltbTimeField { average: 0 },
            coop: HltbTimeField { average: 0 },
            vs: HltbTimeField { average: 0 },
        }
    }
}

#[derive(Debug, Serialize)]
struct SearchPayload {
    #[serde(rename = "searchType")]
    search_type: String,
    #[serde(rename = "searchTerms")]
    search_terms: Vec<String>,
    #[serde(rename = "searchPage")]
    search_page: i32,
    size: i32,
    #[serde(rename = "searchOptions")]
    search_options: SearchOptions,
    #[serde(rename = "useCache")]
    use_cache: bool,
}

#[derive(Debug, Serialize)]
struct SearchOptions {
    games: GamesOptions,
    users: SortCategoryContainer,
    lists: SortCategoryContainer,
    filter: String,
    sort: i32,
    randomizer: i32,
}

#[derive(Debug, Serialize)]
struct GamesOptions {
    #[serde(rename = "userId")]
    user_id: i32,
    platform: String,
    #[serde(rename = "sortCategory")]
    sort_category: String,
    #[serde(rename = "rangeCategory")]
    range_category: String,
    #[serde(rename = "rangeTime")]
    range_time: RangeTime,
    gameplay: Gameplay,
    #[serde(rename = "rangeYear")]
    range_year: RangeYear,
    modifier: String,
}

#[derive(Debug, Serialize)]
struct Gameplay {
    perspective: String,
    flow: String,
    genre: String,
    difficulty: String,
}

#[derive(Debug, Serialize)]
struct RangeTime {
    min: Option<i32>,
    max: Option<i32>,
}

#[derive(Debug, Serialize)]
struct RangeYear {
    min: String,
    max: String,
}

#[derive(Debug, Serialize)]
struct SortCategoryContainer {
    #[serde(rename = "sortCategory")]
    sort_category: String,
}

struct CachedAuth {
    token: String,
    hp_key: String,
    hp_val: String,
    endpoint: String,
    expires_at: SystemTime,
}

pub struct HltbClient {
    client: Client,
    cached_auth: Mutex<Option<CachedAuth>>,
}

impl HltbClient {
    pub fn new() -> Self {
        let client = Client::builder()
            .timeout(Duration::from_secs(30))
            .build()
            .unwrap();

        Self {
            client,
            cached_auth: Mutex::new(None),
        }
    }

    async fn discover_endpoint(&self) -> Result<String> {
        let timestamp = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_millis();

        for name in KNOWN_ENDPOINTS {
            let url = format!("{}/api/{}/init?t={}", HLTB_BASE_URL, name, timestamp);
            match self
                .client
                .get(&url)
                .header("User-Agent", USER_AGENT)
                .header("Referer", HLTB_BASE_URL)
                .timeout(Duration::from_millis(REQUEST_TIMEOUT_MS))
                .send()
                .await
            {
                Ok(resp) if resp.status().is_success() => {
                    println!("[HLTB] Discovered search endpoint: /api/{}", name);
                    return Ok(name.to_string());
                }
                Ok(resp) if resp.status() == reqwest::StatusCode::NOT_FOUND => {
                    continue;
                }
                _ => continue,
            }
        }

        Err(anyhow!(
            "Could not discover HLTB search endpoint (tried: {:?})",
            KNOWN_ENDPOINTS
        ))
    }

    async fn get_auth(&self) -> Result<(String, String, String, String)> {
        {
            let lock = self.cached_auth.lock().unwrap();
            if let Some(ref cached) = *lock {
                if SystemTime::now() < cached.expires_at {
                    return Ok((
                        cached.token.clone(),
                        cached.hp_key.clone(),
                        cached.hp_val.clone(),
                        cached.endpoint.clone(),
                    ));
                }
            }
        }

        let endpoint = self.discover_endpoint().await?;

        let timestamp = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_millis();

        let url = format!("{}/api/{}/init?t={}", HLTB_BASE_URL, endpoint, timestamp);

        let response = self
            .client
            .get(&url)
            .header("User-Agent", USER_AGENT)
            .header("Referer", HLTB_BASE_URL)
            .timeout(Duration::from_millis(REQUEST_TIMEOUT_MS))
            .send()
            .await?;

        if !response.status().is_success() {
            return Err(anyhow!("Auth init request returned {}", response.status()));
        }

        let body = response.text().await?;
        let data: Value = serde_json::from_str(&body).map_err(|e| {
            anyhow!(
                "Failed to parse auth init response: {} body: {}",
                e,
                &body[..body.len().min(200)]
            )
        })?;

        let token = data["token"]
            .as_str()
            .ok_or_else(|| anyhow!("No 'token' field in auth response"))?
            .to_string();

        let hp_key = data["hpKey"].as_str().unwrap_or("").to_string();

        let hp_val = data["hpVal"].as_str().unwrap_or("").to_string();

        {
            let mut lock = self.cached_auth.lock().unwrap();
            *lock = Some(CachedAuth {
                token: token.clone(),
                hp_key: hp_key.clone(),
                hp_val: hp_val.clone(),
                endpoint: endpoint.clone(),
                expires_at: SystemTime::now() + Duration::from_secs(90),
            });
        }

        Ok((token, hp_key, hp_val, endpoint))
    }

    pub async fn search(&self, game_name: &str) -> Result<HltbResponse> {
        let search_terms: Vec<String> = game_name
            .split_whitespace()
            .map(|s| s.to_string())
            .collect();

        let payload = SearchPayload {
            search_type: "games".to_string(),
            search_terms,
            search_page: 1,
            size: 20,
            search_options: SearchOptions {
                games: GamesOptions {
                    user_id: 0,
                    platform: String::new(),
                    sort_category: "popular".to_string(),
                    range_category: "main".to_string(),
                    range_time: RangeTime {
                        min: None,
                        max: None,
                    },
                    gameplay: Gameplay {
                        perspective: String::new(),
                        flow: String::new(),
                        genre: String::new(),
                        difficulty: String::new(),
                    },
                    range_year: RangeYear {
                        min: String::new(),
                        max: String::new(),
                    },
                    modifier: String::new(),
                },
                users: SortCategoryContainer {
                    sort_category: "postcount".to_string(),
                },
                lists: SortCategoryContainer {
                    sort_category: "follows".to_string(),
                },
                filter: String::new(),
                sort: 0,
                randomizer: 0,
            },
            use_cache: true,
        };

        let (token, hp_key, hp_val, endpoint) = self.get_auth().await?;
        let search_url = format!("{}/api/{}", HLTB_BASE_URL, endpoint);

        let mut payload_value = serde_json::to_value(&payload)?;
        if !hp_key.is_empty() {
            payload_value[&hp_key] = Value::String(hp_val.clone());
        }

        let mut request = self
            .client
            .post(&search_url)
            .header("User-Agent", USER_AGENT)
            .header("Origin", HLTB_BASE_URL)
            .header("Referer", HLTB_BASE_URL)
            .header("Content-Type", "application/json")
            .header("x-auth-token", &token);

        if !hp_key.is_empty() {
            request = request
                .header("x-hp-key", &hp_key)
                .header("x-hp-val", &hp_val);
        }

        let response = request
            .json(&payload_value)
            .send()
            .await
            .map_err(|e| anyhow!("HLTB search request failed: {}", e))?;

        let status = response.status();

        if status == reqwest::StatusCode::TOO_MANY_REQUESTS {
            return Err(anyhow!("HLTB API rate limited (429). Try again later."));
        }

        if status == reqwest::StatusCode::FORBIDDEN || status == reqwest::StatusCode::NOT_FOUND {
            let mut lock = self.cached_auth.lock().unwrap();
            *lock = None;
        }

        if !status.is_success() {
            let body = response.text().await.unwrap_or_default();
            return Err(anyhow!(
                "HLTB API returned status {}: {}",
                status,
                &body[..body.len().min(300)]
            ));
        }

        let text = response.text().await?;
        let search_result: SearchResponse = serde_json::from_str(&text).map_err(|e| {
            anyhow!(
                "Failed to parse HLTB response: {} body: {}",
                e,
                &text[..text.len().min(300)]
            )
        })?;

        let game = search_result
            .data
            .into_iter()
            .next()
            .ok_or_else(|| anyhow!("No HLTB results for '{}'", game_name))?;

        Ok(HltbResponse {
            main_story: HltbTimeField {
                average: game.comp_main,
            },
            main_extra: HltbTimeField {
                average: game.comp_plus,
            },
            completionist: HltbTimeField {
                average: game.comp_100,
            },
            all_styles: HltbTimeField {
                average: game.comp_all,
            },
            coop: HltbTimeField {
                average: game.invested_co,
            },
            vs: HltbTimeField {
                average: game.invested_mp,
            },
        })
    }
}
