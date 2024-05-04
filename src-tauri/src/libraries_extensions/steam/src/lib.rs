
pub struct SteamClient {
    api_key: String,
}

impl Extension for SteamClient {


    fn steam_fetch(steam_id: String) -> Result<(), Box<dyn std::error::Error>> {
        let api_key = SteamClient::get_api_key();
        let steam_client = SteamClient::from(api_key);

        let steam_lib = steam_client.get_library(&steam_id)?;

        println!("Games: {:?}", steam_lib.games);

        Ok(())
    }

    fn from(api_key: String) -> Self {
        SteamClient {
            api_key,
        }
    }

    fn get_api_key(&self) -> &String {
        &self.api_key
    }

    fn get_library(&self, steam_id: &str) -> Result<SteamLibrary, Box<dyn std::error::Error>> {
        let url = format!("https://api.steampowered.com/IPlayerService/GetOwnedGames/v0001/?key={}&steamid={}&format=json", self.api_key, steam_id);
        let response = reqwest::blocking::get(&url)?.json::<SteamLibrary>()?;
        Ok(response)
    }
}