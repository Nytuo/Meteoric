use anyhow::{anyhow, Result};
use howlongtobeat_scraper::search_by_name;
use serde::Serialize;

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

fn seconds_of(styles: &Option<howlongtobeat_scraper::Styles>) -> i64 {
    styles
        .as_ref()
        .and_then(|s| s.average)
        .map(|v| v.round() as i64)
        .unwrap_or(0)
}

pub struct HltbClient;

impl HltbClient {
    pub fn new() -> Self {
        Self
    }

    pub async fn search(&self, game_name: &str) -> Result<HltbResponse> {
        let game = search_by_name(game_name)
            .await
            .map_err(|e| anyhow!("HLTB lookup failed for '{}': {}", game_name, e))?;

        Ok(HltbResponse {
            main_story: HltbTimeField {
                average: seconds_of(&game.main_story),
            },
            main_extra: HltbTimeField {
                average: seconds_of(&game.main_extra),
            },
            completionist: HltbTimeField {
                average: seconds_of(&game.completionist),
            },
            all_styles: HltbTimeField {
                average: seconds_of(&game.all_styles),
            },
            coop: HltbTimeField {
                average: seconds_of(&game.co_op),
            },
            vs: HltbTimeField {
                average: seconds_of(&game.vs),
            },
        })
    }
}
