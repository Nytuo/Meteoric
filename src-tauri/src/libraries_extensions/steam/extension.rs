pub trait Extension {
    fn steam_fetch(steam_id: String) -> Result<(), Box<dyn std::error::Error>>;
}