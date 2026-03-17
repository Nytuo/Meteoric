use anyhow::{anyhow, Result};
use regex::Regex;
use reqwest::Client;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::Mutex;
use std::time::{Duration, SystemTime, UNIX_EPOCH};

const HLTB_BASE_URL: &str = "https://howlongtobeat.com";
const USER_AGENT: &str = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";
const SCRIPT_DOWNLOAD_TIMEOUT_MS: u64 = 5000;

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

struct CachedToken {
    token: String,
    expires_at: SystemTime,
}

pub struct HltbClient {
    client: Client,
    cached_search_url: Mutex<Option<String>>,
    cached_auth_token: Mutex<Option<CachedToken>>,
}

impl HltbClient {
    pub fn new() -> Self {
        let client = Client::builder()
            .timeout(Duration::from_secs(30))
            .build()
            .unwrap();

        Self {
            client,
            cached_search_url: Mutex::new(None),
            cached_auth_token: Mutex::new(None),
        }
    }

    async fn get_search_url(&self) -> String {
        {
            let lock = self.cached_search_url.lock().unwrap();
            if let Some(ref url) = *lock {
                return url.clone();
            }
        }

        match self.discover_search_url().await {
            Ok(url) => {
                let mut lock = self.cached_search_url.lock().unwrap();
                *lock = Some(url.clone());
                url
            }
            Err(e) => {
                eprintln!(
                    "[HLTB] Failed to discover search URL: {}, falling back to /api/search",
                    e
                );
                "/api/search".to_string()
            }
        }
    }

    async fn discover_search_url(&self) -> Result<String> {
        let html = self
            .client
            .get(HLTB_BASE_URL)
            .header("User-Agent", USER_AGENT)
            .timeout(Duration::from_millis(SCRIPT_DOWNLOAD_TIMEOUT_MS))
            .send()
            .await?
            .text()
            .await?;

        let script_re = Regex::new(r#"<script[^>]*src=["']([^"']+)["'][^>]*>"#).unwrap();
        let script_urls: Vec<String> = script_re
            .captures_iter(&html)
            .filter_map(|cap| cap.get(1).map(|m| m.as_str().to_string()))
            .collect();

        if script_urls.is_empty() {
            return Err(anyhow!("No script tags found in HLTB homepage"));
        }

        let mut ordered: Vec<String> = Vec::new();
        for url in &script_urls {
            if url.contains("_app-") {
                ordered.push(url.clone());
            }
        }
        for url in &script_urls {
            if !ordered.contains(url) {
                ordered.push(url.clone());
            }
        }

        let mut seen = std::collections::HashSet::new();
        ordered.retain(|u| seen.insert(u.clone()));

        let fetch_re = Regex::new(
            r#"fetch\s*\(\s*["']/api/([a-zA-Z0-9_/]+)[^"']*["']\s*,\s*\{[^}]*method:\s*["']POST["'][^}]*\}"#,
        )
        .unwrap();

        for script_url in ordered {
            let full_url = if script_url.starts_with("http") {
                script_url
            } else {
                format!("{}{}", HLTB_BASE_URL, script_url)
            };

            let script_content = match self
                .client
                .get(&full_url)
                .header("User-Agent", USER_AGENT)
                .timeout(Duration::from_millis(SCRIPT_DOWNLOAD_TIMEOUT_MS))
                .send()
                .await
            {
                Ok(resp) if resp.status().is_success() => match resp.text().await {
                    Ok(text) => text,
                    Err(_) => continue,
                },
                _ => continue,
            };

            if let Some(cap) = fetch_re.captures(&script_content) {
                let mut suffix = cap[1].to_string();

                if let Some(pos) = suffix.find('/') {
                    suffix.truncate(pos);
                }

                if suffix == "find" {
                    continue;
                }

                let search_url = format!("/api/{}", suffix);
                println!("[HLTB] Discovered search endpoint: {}", search_url);
                return Ok(search_url);
            }
        }

        Ok("/api/search".to_string())
    }

    async fn get_auth_token(&self) -> Result<String> {
        {
            let lock = self.cached_auth_token.lock().unwrap();
            if let Some(ref cached) = *lock {
                if SystemTime::now() < cached.expires_at {
                    return Ok(cached.token.clone());
                }
            }
        }

        let timestamp = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_millis();

        let search_path = self.get_search_url().await;
        let url = format!("{}{}/init?t={}", HLTB_BASE_URL, search_path, timestamp);

        let response = self
            .client
            .get(&url)
            .header("User-Agent", USER_AGENT)
            .header("Referer", HLTB_BASE_URL)
            .timeout(Duration::from_millis(SCRIPT_DOWNLOAD_TIMEOUT_MS))
            .send()
            .await?;

        if !response.status().is_success() {
            return Err(anyhow!("Auth token request returned {}", response.status()));
        }

        let body = response.text().await?;
        let data: HashMap<String, String> = serde_json::from_str(&body).map_err(|e| {
            anyhow!(
                "Failed to parse auth token response: {} body: {}",
                e,
                &body[..body.len().min(200)]
            )
        })?;

        let token = data
            .get("token")
            .ok_or_else(|| anyhow!("No 'token' field in auth response"))?
            .clone();

        {
            let mut lock = self.cached_auth_token.lock().unwrap();
            *lock = Some(CachedToken {
                token: token.clone(),
                expires_at: SystemTime::now() + Duration::from_secs(90),
            });
        }

        Ok(token)
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

        let search_path = self.get_search_url().await;
        let search_url = format!("{}{}", HLTB_BASE_URL, search_path);
        let token = self.get_auth_token().await;

        let mut request = self
            .client
            .post(&search_url)
            .header("User-Agent", USER_AGENT)
            .header("Origin", HLTB_BASE_URL)
            .header("Referer", HLTB_BASE_URL)
            .header("Content-Type", "application/json");

        if let Ok(ref t) = token {
            request = request.header("x-auth-token", t);
        }

        let response = request
            .json(&payload)
            .send()
            .await
            .map_err(|e| anyhow!("HLTB search request failed: {}", e))?;

        let status = response.status();

        if status == reqwest::StatusCode::TOO_MANY_REQUESTS {
            return Err(anyhow!("HLTB API rate limited (429). Try again later."));
        }

        if !status.is_success() {
            let body = response.text().await.unwrap_or_default();

            if status == reqwest::StatusCode::NOT_FOUND {
                let mut lock = self.cached_search_url.lock().unwrap();
                *lock = None;
            }

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
