
#[cfg(test)]
mod tests {
    use crate::database::*;

    use super::*;
    use rusqlite::Connection;
    use tempfile::tempdir;

    fn setup_test_db() -> Connection {
        let dir = tempdir().unwrap();
        let db_path = dir.path().join("test.db");
        let conn = Connection::open(db_path).unwrap();
        
        // Create test tables
        conn.execute("CREATE TABLE games (id INTEGER PRIMARY KEY, name TEXT, sort_name TEXT, rating TEXT, platforms TEXT, description TEXT, critic_score TEXT, genres TEXT, styles TEXT, release_date TEXT, developers TEXT, editors TEXT, game_dir TEXT, exec_file TEXT, exec_args TEXT, tags TEXT, status TEXT, time_played TEXT, trophies TEXT, trophies_unlocked TEXT, last_time_played TEXT)", []).unwrap();
        conn.execute("CREATE TABLE universe (id INTEGER PRIMARY KEY, name TEXT, games TEXT, icon TEXT, background TEXT, filters TEXT, views TEXT)", []).unwrap();
        
        conn
    }

    #[test]
    fn test_query_data() {
        let conn = setup_test_db();
        conn.execute("INSERT INTO games (name, rating) VALUES ('Test Game', '5')", []).unwrap();

        let result = query_data(&conn, vec!["games"], vec!["name", "rating"], vec![("rating", "5")], false).unwrap();

        assert_eq!(result.len(), 1);
        assert_eq!(result[0].get("name"), Some(&"Test Game".to_string()));
        assert_eq!(result[0].get("rating"), Some(&"5".to_string()));
    }

    #[test]
    fn test_query_all_data() {
        let conn = setup_test_db();
        conn.execute("INSERT INTO games (name, rating) VALUES ('Test Game', '5')", []).unwrap();
        let result = query_all_data(&conn, "games").unwrap();
        assert_eq!(result.len(), 1);
    }

    #[test]
    fn test_add_category() {
        let conn = setup_test_db();
        add_category(&conn, "Action".to_string(), "icon.png".to_string(), vec!["1".to_string()], vec!["filter1".to_string()], vec!["view1".to_string()], "bg.png".to_string()).unwrap();

        let result = query_all_data(&conn, "universe").unwrap();
        assert_eq!(result.len(), 1);
        assert_eq!(result[0].get("name"), Some(&"Action".to_string()));
    }

    #[test]
    fn test_add_game_to_category_db() {
        let conn = setup_test_db();
        conn.execute("INSERT INTO universe (id, name, games) VALUES (1, 'Action', '')", []).unwrap();

        add_game_to_category_db(&conn, "123".to_string(), "1".to_string()).unwrap();

        let result = query_data(&conn, vec!["universe"], vec!["games"], vec![("id", "1")], false).unwrap();
        let games = result[0].get("games").unwrap();
        let games = games.replace(",", "");
        assert_eq!(games, "123");
    }

    #[test]
    fn test_remove_game_from_category_db() {
        let conn = setup_test_db();
        conn.execute("INSERT INTO universe (id, name, games) VALUES (1, 'Action', '123,456')", []).unwrap();

        remove_game_from_category_db(&conn, "123".to_string(), "1".to_string()).unwrap();

        let result = query_data(&conn, vec!["universe"], vec!["games"], vec![("id", "1")], false).unwrap();
        assert_eq!(result[0].get("games"), Some(&"456".to_string()));
    }

    #[test]
    fn test_update_game() {
        let conn = setup_test_db();
        
        let game = IGame {
            id: "-1".to_string(),
            name: "New Game".to_string(),
            sort_name: "New Game".to_string(),
            rating: "4".to_string(),
            platforms: "PC".to_string(),
            description: "A new game".to_string(),
            critic_score: "80".to_string(),
            genres: "Action".to_string(),
            styles: "FPS".to_string(),
            release_date: "2023-01-01".to_string(),
            developers: "Dev Studio".to_string(),
            editors: "Publisher".to_string(),
            game_dir: "/games/newgame".to_string(),
            exec_file: "newgame.exe".to_string(),
            exec_args: "".to_string(),
            tags: "action,fps".to_string(),
            status: "NOT PLAYED".to_string(),
            time_played: "0".to_string(),
            trophies: "".to_string(),
            trophies_unlocked: "0".to_string(),
            last_time_played: "".to_string(),
        };

        let id = update_game(&conn, game).unwrap();
        
        let result = query_data(&conn, vec!["games"], vec!["name", "rating"], vec![("id", &id)], false).unwrap();
        assert_eq!(result[0].get("name"), Some(&"New Game".to_string()));
        assert_eq!(result[0].get("rating"), Some(&"4".to_string()));
    }

    #[test]
    fn test_update_data() {
        let conn = setup_test_db();
        let result = update_data(&conn, 1, "name", "New Game", "games").unwrap();
        assert_eq!(result, ());
    }

    #[test]
    fn test_modify_table_add_missing_columns() {
        let dir = tempdir().unwrap();
        let db_path = dir.path().join("test2.db");
        let conn = Connection::open(db_path).unwrap();
        conn.execute("CREATE TABLE test_table (id INTEGER PRIMARY KEY, name TEXT, age INTEGER)", []).unwrap();
        modify_table_add_missing_columns(&conn, "test_table", vec![("id", "INTEGER PRIMARY KEY"), ("name", "TEXT"), ("age", "INTEGER")]).unwrap();
        let result = query_all_data(&conn, "test_table").unwrap();
        assert_eq!(result.len(), 0);
        conn.execute("INSERT INTO test_table (name, age) VALUES ('John', 25)", []).unwrap();
        let result = query_all_data(&conn, "test_table").unwrap();
        assert_eq!(result.len(), 1);
        assert_eq!(result[0].get("name"), Some(&"John".to_string()));
        assert_eq!(result[0].get("age"), Some(&"25".to_string()));
    }
    
    #[test]
    fn test_create_table() {
        let dir = tempdir().unwrap();
        let db_path = dir.path().join("test2.db");
        let conn = Connection::open(db_path).unwrap();
        create_table(&conn, "test_table", vec![("id", "INTEGER PRIMARY KEY"), ("name", "TEXT"), ("age", "INTEGER")]).unwrap();        let result = query_all_data(&conn, "test_table").unwrap();
        assert_eq!(result.len(), 0);
        conn.execute("INSERT INTO test_table (name, age) VALUES ('John', 25)", []).unwrap();
        let result = query_all_data(&conn, "test_table").unwrap();
        assert_eq!(result.len(), 1);
        assert_eq!(result[0].get("name"), Some(&"John".to_string()));
        assert_eq!(result[0].get("age"), Some(&"25".to_string()));
    }

    #[test]
    fn test_make_a_json_from_db() {
        let conn = setup_test_db();
        conn.execute("INSERT INTO games (name, rating) VALUES ('Test Game', '5')", []).unwrap();
        let mut stmt = conn.prepare("SELECT * FROM games").unwrap();
        let result = make_a_json_from_db(&mut stmt).unwrap();
        assert_eq!(result.len(), 1);
        assert_eq!(result[0].get("name"), Some(&"Test Game".to_string()));
        assert_eq!(result[0].get("rating"), Some(&"5".to_string()));
    }

    #[test]
    fn test_required_columns_exist() {
        let conn = establish_connection().unwrap();

        let required_columns_games = vec![
            "id", "name", "sortName", "rating", "platforms", "description", "critic_score",
            "genres", "styles", "release_date", "developers", "editors", "game_dir", "exec_file",
            "exec_args", "tags", "status", "time_played", "trophies", "trophies_unlocked", "last_played"
        ];

        let required_columns_universe = vec![
            "id", "name", "games", "icon", "background", "filters", "views"
        ];

        // Check if all required columns exist in the 'games' table
        let games_columns_exist = check_columns_exist(&conn, "games", &required_columns_games);
        assert!(games_columns_exist);

        // Check if all required columns exist in the 'universe' table
        let universe_columns_exist = check_columns_exist(&conn, "universe", &required_columns_universe);
        assert!(universe_columns_exist);
    }

    #[test]
    fn test_game_id_by_name() {
        let conn = setup_test_db();
        conn.execute("INSERT INTO games (name, rating) VALUES ('Test Game', '5')", []).unwrap();
        let result = get_game_id_by_name(&conn, "Test Game").unwrap();
        assert_eq!(result, "1");
    }

/*     #[test]
    fn test_parse_fields() {
        let conn = setup_test_db();
        conn.execute("INSERT INTO games (name, rating) VALUES ('Test Game', '5')", []).unwrap();
        let fields = get_all_fields(&conn).unwrap();
        let game = IGame::from_hashmap(&fields);
        let result = parse_fields(&game);
        let game = IGame::new();
        game.id = "1".to_string();
        game.name = "Test Game".to_string();
        game.sort_name = "Test Game".to_string();
        game.rating = "5".to_string();

        assert_eq!(result, game);

    } */

    pub(crate) fn check_columns_exist(conn: &Connection, table_name: &str, required_columns: &[&str]) -> bool {
        let mut stmt = conn.prepare(&format!("PRAGMA table_info({});", table_name)).unwrap();
        let columns: Vec<String> = stmt
            .query_map([], |row| row.get(1))
            .unwrap()
            .filter_map(Result::ok)
            .collect();
    
        for column in required_columns {
            if !columns.contains(&column.to_string()) {
                return false;
            }
        }
    
        true
    }


}