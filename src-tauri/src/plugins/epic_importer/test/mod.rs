
#[cfg(test)]
mod tests {
    use super::*;
    use std::{env, fs};
    use std::path::Path;
    use tokio::runtime::Runtime;
    use std::sync::Once;
    use directories::ProjectDirs;
    use crate::plugins::epic_importer::*;

    static INIT: Once = Once::new();

    fn setup() {
        INIT.call_once(|| {
            let proj_dirs = ProjectDirs::from("fr", "Nytuo", "Meteoric").unwrap();
            let file_path = proj_dirs.config_dir().join("epicDetails.txt");
            if Path::new(&file_path).exists() {
                fs::remove_file(&file_path).unwrap();
            }
        });
    }

    fn get_real_autocode() -> Option<String> {
        std::env::var("AUTH_CODE").ok()
    }

    #[tokio::test]
    async fn get_games_with_valid_authcode() {
        if let Some(auth_code) = get_real_autocode() {
        setup();
        let creds = vec![auth_code];
        set_credentials(creds).await;
        let result = get_games().await;
        assert!(result.is_ok());
    } else {
        println!("Skipping test due to missing AUTH_CODE environment variable");
    }
    }

    #[tokio::test]
    async fn get_games_with_invalid_authcode() {
        if let Some(auth_code) = get_real_autocode() {
        setup();
        let creds = vec!["invalid_auth_code".to_string()];
        set_credentials(creds).await;
        let result = get_games().await;
            assert!(result.is_err());
        } else {
            println!("Skipping test due to missing AUTH_CODE environment variable");
        }
    }

    #[tokio::test]
    async fn get_games_with_empty_authcode_and_a_file() {
        if let Some(auth_code) = get_real_autocode() {
        setup();
        let creds = vec!["".to_string()];
        set_credentials(creds).await;
        let result = get_games().await;
        assert!(result.is_err());
    } else {
        println!("Skipping test due to missing AUTH_CODE environment variable");
    }
    }

    #[tokio::test]
    async fn set_credentials_updates_authcode() {
        setup();
        let creds = vec!["new_auth_code".to_string()];
        set_credentials(creds).await;
        let authcode = AUTHCODE.lock().await;
        assert_eq!(*authcode, "new_auth_code".to_string());
    }

    #[tokio::test]
    async fn get_games_from_user_executes_successfully() {
        setup();
        let result = get_games_from_user().await;
        assert!(result.is_ok());
    }
}