use std::collections::HashMap;
use directories::ProjectDirs;
use rusqlite::{Connection, params};
use crate::IGame;

pub(crate) fn query_data(conn: &Connection, tables: Vec<&str>, fields: Vec<&str>, conditions: Vec<(&str, &str)>, is_list: bool) -> std::result::Result<Vec<HashMap<String, String>>, rusqlite::Error> {
    let sql;
    if is_list {
        sql = format!("SELECT {} FROM {} WHERE {}", fields.join(","), tables.join(","), conditions.iter().map(|(field, value)| format!("{} IN ({})", field, value)).collect::<Vec<String>>().join(" AND "));
    } else {
        sql = format!("SELECT {} FROM {} WHERE {}", fields.join(","), tables.join(","), conditions.iter().map(|(field, value)| format!("{} = {}", field, value)).collect::<Vec<String>>().join(" AND "));
    }
    let mut stmt = conn.prepare(&sql)?;
    let json = make_a_json_from_db(&mut stmt)?;
    Ok(json)
}

pub(crate) fn query_all_data(conn: &Connection, table: &str) -> std::result::Result<Vec<HashMap<String, String>>, rusqlite::Error> {
    let mut stmt = conn.prepare(&format!("SELECT * FROM {}", table))?;
    let json = make_a_json_from_db(&mut stmt)?;
    Ok(json)
}

fn update_data(conn: &Connection, id: i32, field: &str, value: &str, table: &str) -> rusqlite::Result<()> {
    conn.execute(
        &format!("UPDATE {} SET {} = ?1 WHERE id = ?2", table, field),
        params![value, id],
    )?;
    Ok(())
}

fn insert_data(conn: &Connection, id: i32, name: &str) -> rusqlite::Result<()> {
    conn.execute(
        "INSERT INTO user (id, name) VALUES (?1, ?2)",
        params![id, name],
    )?;
    Ok(())
}

fn create_default_tables(conn: &Connection) -> rusqlite::Result<()> {
    conn.execute(
        "CREATE TABLE IF NOT EXISTS games (
                 id             INTEGER PRIMARY KEY,
                 name            TEXT NOT NULL,
                 sortName        TEXT,
                 rating TEXT NOT NULL DEFAULT '0',
                 platforms TEXT,
                 description TEXT,
                 critic_score TEXT,
                 genres TEXT,
                 styles TEXT,
                 release_date TEXT,
                 developers TEXT,
                 editors TEXT,
                 game_dir TEXT,
                 exec_file TEXT,
                 tags TEXT,
                 status TEXT NOT NULL DEFAULT 'NOT PLAYED',
                 time_played INTEGER NOT NULL DEFAULT 0,
                 trophies TEXT,
                 trophies_unlocked INTEGER NOT NULL DEFAULT 0,
                 last_played TEXT
                  )",
        [],
    )?;

    conn.execute(
        "CREATE TABLE IF NOT EXISTS universe (
                  id              INTEGER PRIMARY KEY,
                  name            TEXT NOT NULL,
                  games           TEXT NOT NULL,
                  icon            TEXT,
                     background      TEXT,
                  filters         TEXT,
                  views           TEXT
                  )",
        [],
    )?;
    Ok(())
}

fn make_a_json_from_db(stmt: &mut rusqlite::Statement) -> std::result::Result<Vec<HashMap<String, String>>, rusqlite::Error> {
    let col_count = stmt.column_count();
    let col_names = stmt.column_names().into_iter().map(|s| s.to_string()).collect::<Vec<String>>();
    let rows = stmt.query_map([], |row| {
        let mut map = HashMap::new();
        for i in 0..col_count {
            let value = match row.get_ref(i).unwrap() {
                rusqlite::types::ValueRef::Integer(int) => int.to_string(),
                rusqlite::types::ValueRef::Text(text) => std::str::from_utf8(text).unwrap_or_default().to_string(),
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
    let proj_dirs = ProjectDirs::from("fr", "Nytuo", "universe").unwrap();
    let db_path = proj_dirs.config_dir().join("universe.db");
    let conn = Connection::open(db_path)?;
    create_default_tables(&conn)?;
    Ok(conn)
}





fn parse_fields(game: &IGame) -> IGame {
    let game_copy = IGame {
        id: game.id.clone(),
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
        tags: game.tags.replace("'", "''"),
        status: game.status.replace("'", "''"),
        time_played: game.time_played.replace("'", "''"),
        trophies: game.trophies.replace("'", "''"),
        trophies_unlocked: game.trophies_unlocked.replace("'", "''"),
        last_time_played: game.last_time_played.replace("'", "''"),
    };
    game_copy
}

pub fn update_game(conn: &Connection, game: IGame) -> Result<(), String> {
    let id_exist = game.id != "-1".to_string();
    println!("ID exist: {:?}", id_exist);
    let game = parse_fields(&game);
    if id_exist {
        let sql_update = format!("UPDATE games SET name = '{}', sort_name = '{}', rating = '{}', platforms = '{}', description = '{}', critic_score = '{}', genres = '{}', styles = '{}', release_date = '{}', developers = '{}', editors = '{}', game_dir = '{}', exec_file = '{}', tags = '{}', status = '{}', time_played = '{}', trophies_unlocked = '{}', last_time_played = '{}' WHERE id = '{}';", game.name, game.sort_name, game.rating, game.platforms, game.description, game.critic_score, game.genres, game.styles, game.release_date, game.developers, game.editors, game.game_dir, game.exec_file, game.tags, game.status, game.time_played, game.trophies_unlocked, game.last_time_played, game.id);
        conn.execute(&sql_update, []).map_err(|e| e.to_string())?;
        println!("Game updated");
    } else {
        let all_fields = vec![game.name, game.sort_name, game.rating, game.platforms, game.description, game.critic_score, game.genres, game.styles, game.release_date, game.developers, game.editors, game.game_dir, game.exec_file, game.tags, game.status, game.time_played, game.trophies_unlocked, game.last_time_played];
        let all_fields = all_fields.iter().map(|field| field.to_string()).collect::<Vec<String>>().join("', '");
        let sql_insert = format!("INSERT INTO games (name, sort_name, rating, platforms, description, critic_score, genres, styles, release_date, developers, editors, game_dir, exec_file, tags, status, time_played, trophies_unlocked, last_time_played) VALUES ('{}')", all_fields);
        println!("SQL: {}", sql_insert);
        conn.execute(&sql_insert, []).map_err(|e| e.to_string())?;
        println!("Game inserted");
    }
    Ok(())
}

/*pub fn get_game_name_by_id(conn: &Connection, id: &str) -> Result<String, String> {
    let mut stmt = conn.prepare(&format!("SELECT name FROM games WHERE id = '{}'", id)).map_err(|e| e.to_string())?;
    let mut rows = stmt.query([]).map_err(|e| e.to_string())?;
    let name = rows.next().unwrap().map_err(|e| e.to_string())?;
    let name = name.unwrap().get(0).unwrap().to_string();
    Ok(name)
}

pub fn get_game_id_by_name(conn: &Connection, name: &str) -> Result<String, String> {
    let mut stmt = conn.prepare(&format!("SELECT id FROM games WHERE name = '{}'", name)).map_err(|e| e.to_string())?;
    let mut rows = stmt.query([]).map_err(|e| e.to_string())?;
    let id = rows.next().unwrap().map_err(|e| e.to_string())?;
    let id = id.unwrap().get(0).unwrap().to_string();
    Ok(id)
}*/

