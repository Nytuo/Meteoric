use std::env;
use std::ffi::OsStr;
use directories::ProjectDirs;
use libloading::{Library, Symbol};

type GetApiVersion = extern "C" fn() -> u8;
type GetGames = extern "C" fn(&str) -> Result<Vec<String>, Box<dyn std::error::Error>>;
type GetCargo = extern "C" fn() -> Vec<String>;
type NeedCreds = extern "C" fn() -> bool;
type SetCredentials = extern "C" fn(Vec<String>);


pub struct VTableV0 {
    pub(crate) get_games: Box<GetGames>,
    get_version: Box<GetApiVersion>,
    pub(crate) get_cargo: Box<GetCargo>,
    pub need_creds: Box<NeedCreds>,
    pub set_credentials: Box<SetCredentials>,
}

impl<'lib> VTableV0 {
    unsafe fn new(library: &Library) -> VTableV0 {
        println!("Loading API version 0...");
        VTableV0 {
            get_games: Box::new(**library.get::<Symbol<GetGames>>(b"search_game\0").unwrap().into_raw()),
            get_version: Box::new(**library.get::<Symbol<GetApiVersion>>(b"get_api_version\0").unwrap().into_raw()),
            get_cargo: Box::new(**library.get::<Symbol<GetCargo>>(b"get_api_cargo\0").unwrap().into_raw()),
            need_creds: Box::new(**library.get::<Symbol<NeedCreds>>(b"need_creds\0").unwrap().into_raw()),
            set_credentials: Box::new(**library.get::<Symbol<SetCredentials>>(b"set_credentials\0").unwrap().into_raw()),
        }
    }
}

pub struct Plugin {
    #[allow(dead_code)]
    library: Library,
    pub(crate) vtable: VTableV0,
}

impl Plugin {
    unsafe fn new(library_name: &OsStr) -> Plugin {
        let library = Library::new(library_name).unwrap();
        let get_api_version: Symbol<GetApiVersion> = library.get(b"get_api_version\0").unwrap();
        let vtable = match get_api_version() {
            1 => VTableV0::new(&library),
            _ => panic!("Unrecognized Rust API version number."),
        };

        Plugin {
            library,
            vtable,
        }
    }
}

unsafe fn load_plugin(path: &str) -> Result<Plugin, Box<dyn std::error::Error>> {
    let library_path: &OsStr = OsStr::new(path);
    println!("Try to load plugin: {:?}", library_path);
    Ok(Plugin::new(library_path))
}

pub fn get_all_metadata_plugins() -> Result<Vec<String>, Box<dyn std::error::Error>> {
    let mut plugins: Vec<String> = Vec::new();
    let current_dir = env::current_exe()?;
    let current_dir = current_dir.parent().unwrap();
    println!("Current dir: {:?}", current_dir);
    let paths = std::fs::read_dir(current_dir.join("plugins").join("metadata"))?;
    for path in paths {
        let path = path.unwrap().path();
        let path = path.to_str().unwrap();
        if path.ends_with(".dll") || path.ends_with(".so") || path.ends_with(".dylib") {
            plugins.push(path.to_string());
        }
    }
    Ok(plugins)
}

pub fn get_info_on_plugins(plugins: Vec<Plugin>) -> Vec<String> {
    let mut infos: Vec<String> = Vec::new();
    for plugin in plugins {
        let cargo = (plugin.vtable.get_cargo)();
        infos.push(cargo.join(", "));
    }
    infos
}

pub fn load_all_plugins() -> Vec<Plugin> {
    let mut plugins = Vec::new();
    plugins.append(&mut get_all_metadata_plugins().unwrap().iter().map(|path| unsafe { load_plugin(path).unwrap() }).collect());
    plugins
}

pub fn get_creds_from_user(plugin_name: &str) -> String {
    let env_file = ProjectDirs::from("fr", "Nytuo", "universe").unwrap().config_dir().join("universe.env");
    match std::fs::metadata(&env_file) {
        Ok(_) => (),
        Err(_) => std::fs::write(&env_file, "").unwrap(),
    }
    let env_file_content = std::fs::read_to_string(env_file).unwrap();
    let plugin_name = plugin_name.to_uppercase();
    let all_creds_start_with_plugin_name = env_file_content.lines().filter(|line| line.starts_with(&plugin_name));
    let creds: Vec<String> = all_creds_start_with_plugin_name.map(|line| line.split("=").collect::<Vec<&str>>()[1].to_string()).collect();
    creds.join(",")
}