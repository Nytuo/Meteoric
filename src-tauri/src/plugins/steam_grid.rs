use steamgriddb_api::Client;
use steamgriddb_api::images::Image;
use steamgriddb_api::query_parameters::QueryType::Grid;
use steamgriddb_api::query_parameters::QueryType::Hero;
use steamgriddb_api::query_parameters::QueryType::Icon;
use steamgriddb_api::query_parameters::QueryType::Logo;
use tokio::sync::Mutex;
use tokio::task;

pub(crate) async fn search_game_steamgrid(
    game_name: &str,
) -> Result<String, Box<dyn std::error::Error>> {
    let client = CLIENT.lock().await;
    let result = client.search(game_name).await?;
    //make a JSON array of the result containing all infos
    let json = serde_json::to_string(&result).unwrap();
    Ok(json)
}

lazy_static::lazy_static! {
    static ref CLIENT: Mutex<Client> = Mutex::new(Client::new("".to_string()));
}

pub async fn set_credentials(cred: String) {
    let client_key = cred.to_string();
    let mut client = CLIENT.lock().await;
    *client = Client::new(client_key);
}

pub fn search_game(game_name: &str) -> Result<String, Box<dyn std::error::Error>> {
    let result = task::block_in_place(|| {
        let rt = tokio::runtime::Runtime::new().unwrap();
        rt.block_on(search_game_steamgrid(game_name))
    });
    result
}

pub async fn get_grid(game_id: usize) -> Vec<Image> {
    let client = CLIENT.lock().await;
    let result = client.get_images_for_id(game_id, &Grid(None)).await;
    result.unwrap()
}

pub async fn get_hero(game_id: usize) ->  Vec<Image> {
    let client = CLIENT.lock().await;
    let result = client.get_images_for_id(game_id, &Hero(None)).await;
    result.unwrap()
}

pub async fn get_logo(game_id: usize) ->  Vec<Image>{
    let client = CLIENT.lock().await;
    let result = client.get_images_for_id(game_id, &Logo(None)).await;
    result.unwrap()
}

pub async fn get_icon(game_id: usize) ->  Vec<Image> {
    let client = CLIENT.lock().await;
    let result = client.get_images_for_id(game_id, &Icon(None)).await;
    result.unwrap()
}


#[tauri::command]
pub async fn steamgrid_get_grid(game_id: usize) -> Vec<Image> {
    get_grid(game_id).await
}

#[tauri::command]
pub async fn steamgrid_get_hero(game_id: usize) -> Vec<Image> {
    get_hero(game_id).await
}

#[tauri::command]
pub async fn steamgrid_get_logo(game_id: usize) -> Vec<Image> {
    get_logo(game_id).await
}

#[tauri::command]
pub async fn steamgrid_get_icon(game_id: usize) -> Vec<Image> {
    get_icon(game_id).await
}

