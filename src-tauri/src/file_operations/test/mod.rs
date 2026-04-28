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

        let has_webp_1 = screenshots_dir.join("screenshot-1.webp").exists();
        let has_gif_1 = screenshots_dir.join("screenshot-1.gif").exists();
        assert!(
            has_webp_1 || has_gif_1,
            "Screenshot 1 should exist as webp or gif"
        );

        let has_webp_2 = screenshots_dir.join("screenshot-2.webp").exists();
        let has_gif_2 = screenshots_dir.join("screenshot-2.gif").exists();
        assert!(
            has_webp_2 || has_gif_2,
            "Screenshot 2 should exist as webp or gif"
        );

        let file_path_1 = if has_webp_1 {
            screenshots_dir.join("screenshot-1.webp")
        } else {
            screenshots_dir.join("screenshot-1.gif")
        };
        let mut file = File::open(file_path_1).unwrap();
        let mut metadata = file.metadata().unwrap();
        assert!(metadata.len() > 0);

        let file_path_2 = if has_webp_2 {
            screenshots_dir.join("screenshot-2.webp")
        } else {
            screenshots_dir.join("screenshot-2.gif")
        };
        file = File::open(file_path_2).unwrap();
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

        let key = "background";
        let value = json!("https://picsum.photos/seed/test2/400/200");

        let result = download_single_file(&game_dir, &client, &key, &value).await;

        assert!(result.is_ok());

        let has_webp = game_dir.join("background.webp").exists();
        let has_gif = game_dir.join("background.gif").exists();
        assert!(
            has_webp || has_gif,
            "Background should exist as webp or gif"
        );
        let file_path = if has_webp {
            game_dir.join("background.webp")
        } else {
            game_dir.join("background.gif")
        };
        let mut file = File::open(file_path).unwrap();
        let mut metadata = file.metadata().unwrap();
        assert!(metadata.len() > 0);

        let game_dir = temp_dir.path().to_path_buf();

        let key = "jaquette";
        let value = json!("https://picsum.photos/seed/test2/400/200");

        let result = download_single_file(&game_dir, &client, &key, &value).await;

        assert!(result.is_ok());
        let has_webp = game_dir.join("jaquette.webp").exists();
        let has_gif = game_dir.join("jaquette.gif").exists();
        assert!(has_webp || has_gif, "Jaquette should exist as webp or gif");
        let file_path = if has_webp {
            game_dir.join("jaquette.webp")
        } else {
            game_dir.join("jaquette.gif")
        };
        file = File::open(file_path).unwrap();
        metadata = file.metadata().unwrap();
        assert!(metadata.len() > 0);

        let game_dir = temp_dir.path().to_path_buf();

        let key = "logo";
        let value = json!("https://picsum.photos/seed/test2/400/200");

        let result = download_single_file(&game_dir, &client, &key, &value).await;

        assert!(result.is_ok());
        let has_webp = game_dir.join("logo.webp").exists();
        let has_gif = game_dir.join("logo.gif").exists();
        assert!(has_webp || has_gif, "Logo should exist as webp or gif");
        let file_path = if has_webp {
            game_dir.join("logo.webp")
        } else {
            game_dir.join("logo.gif")
        };
        file = File::open(file_path).unwrap();
        metadata = file.metadata().unwrap();
        assert!(metadata.len() > 0);

        let game_dir = temp_dir.path().to_path_buf();

        let key = "icon";
        let value = json!("https://picsum.photos/seed/test2/400/200");

        let result = download_single_file(&game_dir, &client, &key, &value).await;

        assert!(result.is_ok());
        let has_webp = game_dir.join("icon.webp").exists();
        let has_gif = game_dir.join("icon.gif").exists();
        assert!(has_webp || has_gif, "Icon should exist as webp or gif");
        let file_path = if has_webp {
            game_dir.join("icon.webp")
        } else {
            game_dir.join("icon.gif")
        };
        file = File::open(file_path).unwrap();
        metadata = file.metadata().unwrap();
        assert!(metadata.len() > 0);

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
