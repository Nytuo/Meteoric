#[cfg(test)]
mod tests {
    use std::fs::File;

    use super::*;
    use crate::file_operations::*;

    #[tokio::test]
    async fn test_download_screenshots() {
        use reqwest::Client;
        use serde_json::json;
        use std::fs;
        use std::path::PathBuf;
        use tempfile::tempdir;

        let temp_dir = tempdir().unwrap();
        let game_dir = temp_dir.path().to_path_buf();

        let screenshots_dir = game_dir.join("screenshots");
        fs::create_dir(&screenshots_dir).unwrap();

        let client = Client::new();

        let screenshots = vec![
            json!("https://picsum.photos/seed/test2/400/200"),
            json!("https://picsum.photos/seed/test/400/200"),
        ];

        let result = download_screenshots(&game_dir, &client, &screenshots).await;

        assert!(result.is_ok());
        assert!(screenshots_dir.join("screenshot-1.jpg").exists());
        assert!(screenshots_dir.join("screenshot-2.jpg").exists());
        let mut file = File::open(screenshots_dir.join("screenshot-1.jpg")).unwrap();
        let mut metadata = file.metadata().unwrap();
        assert!(metadata.len() > 0);
        file = File::open(screenshots_dir.join("screenshot-2.jpg")).unwrap();
        metadata = file.metadata().unwrap();
        assert!(metadata.len() > 0);
    }

    #[tokio::test]
    async fn test_download_videos() {
        use reqwest::Client;
        use serde_json::json;
        use std::fs;
        use std::path::PathBuf;
        use tempfile::tempdir;

        let temp_dir = tempdir().unwrap();
        let game_dir = temp_dir.path().to_path_buf();

        let videos_dir = game_dir.join("videos");
        fs::create_dir(&videos_dir).unwrap();

        let client = Client::new();

        let videos = vec![
            json!("https://www.youtube.com/watch?v=aqz-KE-bpKQ"),
            json!("https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/1080/Big_Buck_Bunny_1080_10s_1MB.mp4"),
        ];

        let result = download_videos(&game_dir, &client, &videos).await;

        assert!(result.is_ok());
        assert!(videos_dir.join("video-1.mp4").exists());
        assert!(videos_dir.join("video-2.mp4").exists());
        let mut file = File::open(videos_dir.join("video-1.mp4")).unwrap();
        let mut metadata = file.metadata().unwrap();
        assert!(metadata.len() > 0);
        file = File::open(videos_dir.join("video-2.mp4")).unwrap();
        metadata = file.metadata().unwrap();
        assert!(metadata.len() > 0);
    }

    #[tokio::test]
    async fn test_download_single_file() {
        use reqwest::Client;
        use serde_json::json;
        use std::fs;
        use std::path::PathBuf;
        use tempfile::tempdir;

        let temp_dir = tempdir().unwrap();
        let game_dir = temp_dir.path().to_path_buf();

        let client = Client::new();

        //bg
        let key = "background";
        let value = json!("https://picsum.photos/seed/test2/400/200");

        let result = download_single_file(&game_dir, &client, &key, &value).await;

        assert!(result.is_ok());
        assert!(game_dir.join("background.jpg").exists());
        let mut file = File::open(game_dir.join("background.jpg")).unwrap();
        let mut metadata = file.metadata().unwrap();
        assert_eq!(metadata.len(), 18213);

        //jaquette
        let game_dir = temp_dir.path().to_path_buf();

        let key = "jaquette";
        let value = json!("https://picsum.photos/seed/test2/400/200");

        let result = download_single_file(&game_dir, &client, &key, &value).await;

        assert!(result.is_ok());
        assert!(game_dir.join("jaquette.jpg").exists());
        file = File::open(game_dir.join("jaquette.jpg")).unwrap();
        metadata = file.metadata().unwrap();
        assert_eq!(metadata.len(), 18213);

        //logo
        let game_dir = temp_dir.path().to_path_buf();

        let key = "logo";
        let value = json!("https://picsum.photos/seed/test2/400/200");

        let result = download_single_file(&game_dir, &client, &key, &value).await;

        assert!(result.is_ok());
        assert!(game_dir.join("logo.png").exists());
        file = File::open(game_dir.join("logo.png")).unwrap();
        metadata = file.metadata().unwrap();
        assert_eq!(metadata.len(), 18213);

        //icon
        let game_dir = temp_dir.path().to_path_buf();

        let key = "icon";
        let value = json!("https://picsum.photos/seed/test2/400/200");

        let result = download_single_file(&game_dir, &client, &key, &value).await;

        assert!(result.is_ok());
        assert!(game_dir.join("icon.png").exists());
        file = File::open(game_dir.join("icon.png")).unwrap();
        metadata = file.metadata().unwrap();
        assert_eq!(metadata.len(), 18213);

        //audio
        let game_dir = temp_dir.path().to_path_buf();

        let key = "audio";
        let value = json!("https://file-examples.com/storage/fe44eeb9cb66ab8ce934f14/2017/11/file_example_MP3_1MG.mp3");
        fs::create_dir_all(game_dir.join("musics")).unwrap();
        let result = download_single_file(&game_dir, &client, &key, &value).await;
        println!("Result: {:?}", result);
        assert!(result.is_ok());
        assert!(game_dir.join("musics").join("theme.mp3").exists());
        file = File::open(game_dir.join("musics").join("theme.mp3")).unwrap();
        metadata = file.metadata().unwrap();
        assert_eq!(metadata.len(), 1059386);
    }
}
