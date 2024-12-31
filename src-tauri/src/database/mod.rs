use std::collections::HashMap;

use directories::ProjectDirs;
use rusqlite::{params, Connection};

use crate::{send_message_to_frontend, IGame, IStats};

mod test;

pub(crate) fn query_data(
    conn: &Connection,
    tables: Vec<&str>,
    fields: Vec<&str>,
    conditions: Vec<(&str, &str)>,
    is_list: bool,
) -> Result<Vec<HashMap<String, String>>, rusqlite::Error> {
    let sql;
    if is_list {
        sql = format!(
            "SELECT {} FROM {} WHERE {}",
            fields.join(","),
            tables.join(","),
            conditions
                .iter()
                .map(|(field, value)| format!("{} IN ({})", field, value))
                .collect::<Vec<String>>()
                .join(" AND ")
        );
    } else {
        sql = format!(
            "SELECT {} FROM {} WHERE {}",
            fields.join(","),
            tables.join(","),
            conditions
                .iter()
                .map(|(field, value)| format!("{} = {}", field, value))
                .collect::<Vec<String>>()
                .join(" AND ")
        );
    }
    let mut stmt = conn.prepare(&sql)?;
    let json = make_a_json_from_db(&mut stmt)?;
    Ok(json)
}

pub(crate) fn query_all_data(
    conn: &Connection,
    table: &str,
) -> Result<Vec<HashMap<String, String>>, rusqlite::Error> {
    query_data(conn, vec![table], vec!["*"], vec![("1", "1")], false)
}

pub(crate) fn add_category(
    conn: &Connection,
    name: String,
    icon: String,
    games: Vec<String>,
    filters: Vec<String>,
    views: Vec<String>,
    background: String,
) -> rusqlite::Result<()> {
    conn.execute("INSERT INTO category (name, icon, games, filters, views, background) VALUES (?1,?2,?3,?4,?5,?6)", params![name, icon, games.join(","), filters.join(","), views.join(","), background])?;
    Ok(())
}

pub(crate) fn add_game_to_category_db(
    conn: &Connection,
    game_id: String,
    category_id: String,
) -> rusqlite::Result<()> {
    let is_empty: bool = conn
        .query_row(
            "SELECT games FROM category WHERE id = ?1",
            params![category_id],
            |row| row.get::<_, Option<String>>(0),
        )
        .unwrap_or_default()
        .map_or(true, |games| games.is_empty());
    let is_already_present: bool = conn
        .query_row(
            "SELECT games FROM category WHERE id = ?1",
            params![category_id],
            |row| row.get::<_, Option<String>>(0),
        )
        .unwrap_or_default()
        .unwrap_or_default()
        .contains(&format!(",{},", game_id));
    if is_already_present {
        return Ok(());
    }
    if is_empty {
        conn.execute(
            "UPDATE category SET games = ?1 WHERE id = ?2",
            params![game_id, category_id],
        )?;
        return Ok(());
    }
    conn.execute(
        "UPDATE category SET games = games || ',' || ?1 WHERE id = ?2",
        params![game_id, category_id],
    )?;
    Ok(())
}

pub(crate) fn remove_game_from_category_db(
    conn: &Connection,
    game_id: String,
    category_id: String,
) -> rusqlite::Result<()> {
    let games: String = conn
        .query_row(
            "SELECT games FROM category WHERE id = ?1",
            params![category_id],
            |row| row.get(0),
        )
        .unwrap_or_default();
    let games: Vec<&str> = games.split(',').collect();
    let games: Vec<String> = games.iter().map(|s| s.to_string()).collect();
    let games: Vec<String> = games.into_iter().filter(|s| s != &game_id).collect();
    let games: String = games.join(",");
    conn.execute(
        "UPDATE category SET games = ?1 WHERE id = ?2",
        params![games, category_id],
    )?;
    Ok(())
}

fn update_data(
    conn: &Connection,
    id: i32,
    field: &str,
    value: &str,
    table: &str,
) -> rusqlite::Result<()> {
    let result = conn.execute(
        &format!("UPDATE {} SET {} = ?1 WHERE id = ?2", table, field),
        params![value, id],
    );
    match result {
        Ok(_) => Ok(()),
        Err(e) => Err(e),
    }
}

fn modify_table_add_missing_columns(
    conn: &Connection,
    table_name: &str,
    required_columns: Vec<(&str, &str)>,
) -> Result<(), rusqlite::Error> {
    // Check if the table exists
    let table_exists: bool = conn
        .query_row(
            &format!(
                "SELECT name FROM sqlite_master WHERE type='table' AND name='{}';",
                table_name
            ),
            [],
            |_| Ok(()),
        )
        .is_ok();

    if table_exists {
        // Query the table schema to check for the presence of the required columns
        let mut stmt = conn.prepare(&format!("PRAGMA table_info({});", table_name))?;
        let columns: Vec<String> = stmt
            .query_map([], |row| row.get(1))?
            .filter_map(Result::ok)
            .collect();

        for (column_name, column_type) in required_columns {
            if !columns.contains(&column_name.to_string()) {
                println!(
                    "Column {} not found in table {}, adding it",
                    column_name, table_name
                );
                // Alter the table to add the missing column
                let alter_table_query = format!(
                    "ALTER TABLE {} ADD COLUMN {} {};",
                    table_name, column_name, column_type
                );
                conn.execute(&alter_table_query, [])?;
            }
        }
    }

    Ok(())
}

fn create_table(
    conn: &Connection,
    table_name: &str,
    required_columns: Vec<(&str, &str)>,
) -> Result<(), rusqlite::Error> {
    let create_table_query = format!(
        "CREATE TABLE IF NOT EXISTS {} ({});",
        table_name,
        required_columns
            .iter()
            .map(|(column_name, column_type)| format!("{} {}", column_name, column_type))
            .collect::<Vec<String>>()
            .join(", ")
    );
    conn.execute(&create_table_query, [])?;
    Ok(())
}

fn make_a_json_from_db(
    stmt: &mut rusqlite::Statement,
) -> Result<Vec<HashMap<String, String>>, rusqlite::Error> {
    let col_count = stmt.column_count();
    let col_names = stmt
        .column_names()
        .into_iter()
        .map(|s| s.to_string())
        .collect::<Vec<String>>();
    let rows = stmt.query_map([], |row| {
        let mut map = HashMap::new();
        for i in 0..col_count {
            let value = match row.get_ref(i).unwrap() {
                rusqlite::types::ValueRef::Integer(int) => int.to_string(),
                rusqlite::types::ValueRef::Text(text) => {
                    std::str::from_utf8(text).unwrap_or_default().to_string()
                }
                _ => String::new(),
            };
            let name = col_names[i].clone();
            map.insert(name, value);
        }
        Ok(map)
    })?;

    let mut result = Vec::new();
    for row in rows {
        result.push(row.unwrap());
    }
    Ok(result)
}

pub(crate) fn establish_connection() -> rusqlite::Result<Connection> {
    let proj_dirs = ProjectDirs::from("fr", "Nytuo", "Meteoric").unwrap();
    let db_path = proj_dirs.config_dir().join("Meteoric.db");
    let conn = Connection::open(db_path)?;
    let required_columns_games = vec![
        ("id", "INTEGER PRIMARY KEY"),
        ("game_importer_id", "TEXT"),
        ("importer_id", "TEXT"),
        ("name", "TEXT NOT NULL"),
        ("sort_name", "TEXT"),
        ("rating", "TEXT NOT NULL DEFAULT '0'"),
        ("platforms", "TEXT"),
        ("description", "TEXT"),
        ("critic_score", "TEXT"),
        ("genres", "TEXT"),
        ("styles", "TEXT"),
        ("release_date", "TEXT"),
        ("developers", "TEXT"),
        ("editors", "TEXT"),
        ("game_dir", "TEXT"),
        ("exec_file", "TEXT"),
        ("exec_args", "TEXT"),
        ("tags", "TEXT"),
        ("status", "TEXT NOT NULL DEFAULT 'NOT PLAYED'"),
        ("trophies", "TEXT"),
        ("trophies_unlocked", "INTEGER NOT NULL DEFAULT 0"),
        ("hidden", "TEXT NOT NULL DEFAULT 'false'"),
    ];
    let required_columns_category = vec![
        ("id", "INTEGER PRIMARY KEY"),
        ("name", "TEXT NOT NULL"),
        ("games", "TEXT NOT NULL"),
        ("icon", "TEXT"),
        ("background", "TEXT"),
        ("filters", "TEXT"),
        ("views", "TEXT"),
    ];
    let required_columns_settings = vec![
        ("name", "TEXT NOT NULL PRIMARY KEY"),
        ("value", "TEXT NOT NULL"),
    ];
    let required_columns_stats = vec![
        ("id", "INTEGER PRIMARY KEY"),
        ("game_id", "INTEGER NOT NULL"),
        ("time_played", "TEXT NOT NULL"),
        ("date_of_play", "TEXT NOT NULL"),
    ];
    create_table(&conn, "games", required_columns_games.clone())?;
    modify_table_add_missing_columns(&conn, "games", required_columns_games.clone())?;
    create_table(&conn, "category", required_columns_category.clone())?;
    modify_table_add_missing_columns(&conn, "category", required_columns_category.clone())?;
    create_table(&conn, "settings", required_columns_settings.clone())?;
    modify_table_add_missing_columns(&conn, "settings", required_columns_settings.clone())?;
    create_table(&conn, "stats", required_columns_stats.clone())?;
    modify_table_add_missing_columns(&conn, "stats", required_columns_stats.clone())?;
    create_favorites_category(&conn)?;
    Ok(conn)
}

fn create_favorites_category(conn: &Connection) -> Result<(), rusqlite::Error> {
    let categories = query_all_data(&conn, "category")
        .unwrap()
        .iter()
        .map(|row| format!("{:?}", row))
        .collect::<Vec<String>>();
    let categories: String = categories.join(",");
    if !categories.contains(&"Favorites".to_string()) {
        add_category(
            conn,
            "Favorites".to_string(),
            "star".to_string(),
            vec![],
            vec![],
            vec![],
            "".to_string(),
        )
        .map_err(|e| e.to_string());
    }
    Ok(())
}

pub(crate) fn get_all_fields(conn: &Connection) -> Result<Vec<String>, rusqlite::Error> {
    let stmt = conn.prepare(&"SELECT * FROM games LIMIT 1".to_string())?;
    let col_names = stmt
        .column_names()
        .into_iter()
        .map(|s| s.to_string())
        .collect::<Vec<String>>();
    Ok(col_names)
}

fn parse_fields(game: &IGame) -> IGame {
    let game_copy = IGame {
        id: game.id.clone(),
        game_importer_id: game.game_importer_id.replace("'", "''"),
        importer_id: game.importer_id.replace("'", "''"),
        name: game.name.replace("'", "''"),
        sort_name: game.sort_name.replace("'", "''"),
        rating: game.rating.replace("'", "''"),
        platforms: game.platforms.replace("'", "''"),
        description: game.description.replace("'", "''"),
        critic_score: game.critic_score.replace("'", "''"),
        genres: game.genres.replace("'", "''"),
        styles: game.styles.replace("'", "''"),
        release_date: game.release_date.replace("'", "''"),
        developers: game.developers.replace("'", "''"),
        editors: game.editors.replace("'", "''"),
        game_dir: game.game_dir.replace("'", "''"),
        exec_file: game.exec_file.replace("'", "''"),
        exec_args: game.exec_args.replace("'", "''"),
        tags: game.tags.replace("'", "''"),
        status: game.status.replace("'", "''"),
        trophies: game.trophies.replace("'", "''"),
        trophies_unlocked: game.trophies_unlocked.replace("'", "''"),
        hidden: game.hidden.replace("'", "''"),
    };
    game_copy
}

pub fn update_game(conn: &Connection, game: IGame) -> Result<String, String> {
    let id_exist = game.id != "-1".to_string();
    println!("ID exist: {:?}", id_exist);
    let game = parse_fields(&game);
    let game_name = game.name.clone();
    if id_exist {
        let sql_update = format!("UPDATE games SET name = '{}', game_importer_id = '{}', importer_id = '{}', sort_name = '{}', rating = '{}', platforms = '{}', description = '{}', critic_score = '{}', genres = '{}', styles = '{}', release_date = '{}', developers = '{}', editors = '{}', game_dir = '{}', exec_file = '{}', exec_args = '{}', tags = '{}', status = '{}', trophies_unlocked = '{}', hidden = '{}' WHERE id = '{}';", game.name, game.game_importer_id, game.importer_id, game.sort_name, game.rating, game.platforms, game.description, game.critic_score, game.genres, game.styles, game.release_date, game.developers, game.editors, game.game_dir, game.exec_file, game.exec_args, game.tags, game.status, game.trophies_unlocked, game.hidden, game.id);
        conn.execute(&sql_update, []).map_err(|e| e.to_string())?;
        println!("Game updated");
    } else {
        let all_fields = vec![
            game.name,
            game.game_importer_id,
            game.importer_id,
            game.sort_name,
            game.rating,
            game.platforms,
            game.description,
            game.critic_score,
            game.genres,
            game.styles,
            game.release_date,
            game.developers,
            game.editors,
            game.game_dir,
            game.exec_file,
            game.exec_args,
            game.tags,
            game.status,
            game.trophies_unlocked,
            game.hidden,
        ];
        let all_fields = all_fields
            .iter()
            .map(|field| field.to_string())
            .collect::<Vec<String>>()
            .join("', '");
        let sql_insert = format!("INSERT INTO games (name, game_importer_id, importer_id, sort_name, rating, platforms, description, critic_score, genres, styles, release_date, developers, editors, game_dir, exec_file, exec_args, tags, status, trophies_unlocked, hidden) VALUES ('{}')", all_fields);
        match conn.execute(&sql_insert, []).map_err(|e| e.to_string()) {
            Ok(_) => {
                println!("Game inserted");
            }
            Err(e) => {
                send_message_to_frontend(&format!(
                    "[Database Error-ERROR-3000]{} cannot be updated",
                    game_name.clone()
                ));
                return Err(e.to_string());
            }
        }
    }
    let id = get_game_id_by_name(&conn, &game_name)
        .map_err(|e| e.to_string())
        .unwrap();
    Ok(id)
}

pub fn bulk_update_stats(conn: &Connection, stats: Vec<IStats>) -> Result<(), String> {
    let game_id = stats.first().map(|s| s.game_id.clone()).ok_or("No stats provided")?;
    let mut stmt = conn
        .prepare(&format!("SELECT id FROM stats WHERE game_id = '{}'", game_id))
        .map_err(|e| e.to_string())?;
    let ids: Vec<String> = make_a_json_from_db(&mut stmt).map_err(|e| e.to_string())?
        .iter()
        .map(|row| row.get("id").unwrap().clone())
        .collect();
    let ids_to_delete: Vec<String> = ids
        .iter()
        .filter(|id| !stats.iter().any(|stat| stat.id == **id))
        .map(|id| id.clone())
        .collect();

    for id in ids_to_delete {
        conn.execute(
            &format!("DELETE FROM stats WHERE game_id = '{}' AND id = '{}'", game_id, id),
            [],
        ).map_err(|e| e.to_string())?;
    }

    for stat in stats {
        update_stat_db(&conn, stat).map_err(|e| e.to_string())?;
    }
    Ok(())
}

pub fn update_stat_db(conn: &Connection, stats: IStats) -> Result<(), String> {
    let does_exist_in_db: bool = conn
        .query_row(
            &format!(
                "SELECT COUNT(*) FROM stats WHERE game_id = '{}' AND id = '{}'",
                stats.game_id, stats.id
            ),
            [],
            |row| row.get(0),
        )
        .map_err(|e| e.to_string())?;
    if !does_exist_in_db {
        insert_stat_db(
            &conn,
            stats.game_id.clone(),
            stats.time_played.clone(),
            stats.date_of_play.clone(),
        )
        .map_err(|e| e.to_string())?;
        return Ok(());
    }
    let sql = format!(
        "UPDATE stats SET time_played = '{}', date_of_play = '{}' WHERE game_id = '{}' AND id = '{}'",
        stats.time_played, stats.date_of_play, stats.game_id, stats.id
    );
    conn.execute(&sql, []).map_err(|e| e.to_string())?;
    Ok(())
}

pub fn insert_stat_db(
    conn: &Connection,
    game_id: String,
    time_played: String,
    date_of_play: String,
) -> Result<(), String> {
    let sql = format!(
        "INSERT INTO stats (game_id, time_played, date_of_play) VALUES ('{}', '{}', '{}')",
        game_id, time_played, date_of_play
    );
    conn.execute(&sql, []).map_err(|e| e.to_string())?;
    Ok(())
}

pub fn get_stats_for_game(
    conn: &Connection,
    game_id: String,
) -> Result<Vec<HashMap<String, String>>, String> {
    let mut stmt = conn
        .prepare(&format!(
            "SELECT * FROM stats WHERE game_id = '{}'",
            game_id
        ))
        .map_err(|e| e.to_string())?;
    let json = make_a_json_from_db(&mut stmt).map_err(|e| e.to_string())?;
    Ok(json)
}

/*pub fn get_game_name_by_id(conn: &Connection, id: &str) -> Result<String, String> {
    let mut stmt = conn.prepare(&format!("SELECT name FROM games WHERE id = '{}'", id)).map_err(|e| e.to_string())?;
    let mut rows = stmt.query([]).map_err(|e| e.to_string())?;
    let name = rows.next().unwrap().map_err(|e| e.to_string())?;
    let name = name.unwrap().get(0).unwrap().to_string();
    Ok(name)
}*/

pub fn get_game_id_by_name(conn: &Connection, name: &str) -> Result<String, String> {
    let mut stmt = conn
        .prepare(&format!("SELECT id FROM games WHERE name = '{}'", name))
        .map_err(|e| e.to_string())?;
    let mut rows = stmt.query([]).map_err(|e| e.to_string())?;

    if let Some(row) = rows.next().map_err(|e| e.to_string())? {
        let id: i64 = row.get(0).map_err(|e| e.to_string())?;
        Ok(id.to_string())
    } else {
        Err("No game found with the given name".to_string())
    }
}

pub fn set_settings_db(conn: &Connection, name: &str, value: &str) -> Result<(), String> {
    let sql = format!(
        "INSERT OR REPLACE INTO settings (name, value) VALUES ('{}', '{}')",
        name, value
    );
    conn.execute(&sql, []).map_err(|e| e.to_string())?;
    Ok(())
}

pub fn delete_game_db(conn: &Connection, id: String) -> Result<(), String> {
    let sql = format!("DELETE FROM games WHERE id = '{}'", id);
    conn.execute(&sql, []).map_err(|e| e.to_string())?;
    Ok(())
}
