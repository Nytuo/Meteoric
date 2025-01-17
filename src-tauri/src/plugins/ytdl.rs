use std::collections::HashSet;

use reqwest::Client;
use serde_json::json;
use serde_json::Value;
use tokio::task;

#[derive(Debug)]
struct YoutubeSearchResult {
    title: String,
    url: String,
    thumbnail: String,
}

async fn scrap_youtube_search_results(
    search: &str,
) -> Result<Vec<String>, Box<dyn std::error::Error>> {
    let client = Client::new();
    let search = search.replace(" ", "+");
    let search = search + "+music+theme";
    let url = format!("https://www.youtube.com/results?search_query={}", search);
    let res = client.get(&url).send().await?.text().await?;
    let mut vec = Vec::<YoutubeSearchResult>::new();
    let mut video_url = HashSet::<String>::new();
    let mut video_title = HashSet::<String>::new();
    let mut video_thumbnail = HashSet::<String>::new();

    // parse the html
    let document = scraper::Html::parse_document(&res);
    //get yt initial data
    let selector = scraper::Selector::parse("script").unwrap();
    let mut yt_initial_data: Value = json!({});
    for element in document.select(&selector) {
        let text = element.text().collect::<String>();
        if text.contains("ytInitialData") {
            let start = text.find("{").unwrap();
            let end = text.rfind("}").unwrap();
            yt_initial_data = serde_json::from_str(&text[start..=end]).unwrap();
            break;
        }
    }
    for i in 0..yt_initial_data["contents"]["twoColumnSearchResultsRenderer"]["primaryContents"]
        ["sectionListRenderer"]["contents"][0]["itemSectionRenderer"]["contents"]
        .as_array()
        .unwrap()
        .len()
    {
        let item = &yt_initial_data["contents"]["twoColumnSearchResultsRenderer"]
            ["primaryContents"]["sectionListRenderer"]["contents"][0]["itemSectionRenderer"]
            ["contents"][i];
        if !item["videoRenderer"].is_object() {
            continue;
        }
        let item = &item["videoRenderer"];
        let title = item["title"]["runs"][0]["text"]
            .as_str()
            .unwrap()
            .to_string()
            .replace(|c: char| !c.is_ascii(), "");
        let url = format!(
            "https://www.youtube.com/watch?v={}",
            item["videoId"].as_str().unwrap()
        );
        let thumbnail = item["thumbnail"]["thumbnails"][0]["url"]
            .as_str()
            .unwrap()
            .to_string();
        if !video_url.contains(&url) && !video_title.contains(&title) {
            video_url.insert(url.clone());
            video_title.insert(title.clone());
            video_thumbnail.insert(thumbnail.clone());

            vec.push(YoutubeSearchResult {
                title,
                url,
                thumbnail,
            });
        }
    }

    let mut result = Vec::<String>::new();
    for item in vec {
        let json = json!({
            "name": item.title,
            "url": item.url,
            "jaquette": item.thumbnail,
        });
        result.push(json.to_string());
    }
    println!("{:?}", result);
    Ok(result)
}

pub fn search_game(game_name: &str) -> Result<Vec<String>, Box<dyn std::error::Error>> {
    let result = task::block_in_place(|| {
        let rt = tokio::runtime::Runtime::new().unwrap();
        rt.block_on(scrap_youtube_search_results(game_name))
    });
    result
}
