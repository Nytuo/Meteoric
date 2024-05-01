import {
  invoke
} from "./chunk-GMXMMATF.js";
import {
  __async
} from "./chunk-J4B6MK7R.js";

// node_modules/@tauri-apps/api/helpers/tauri.js
function invokeTauriCommand(command) {
  return __async(this, null, function* () {
    return invoke("tauri", command);
  });
}

// node_modules/@tauri-apps/api/fs.js
var BaseDirectory;
(function(BaseDirectory2) {
  BaseDirectory2[BaseDirectory2["Audio"] = 1] = "Audio";
  BaseDirectory2[BaseDirectory2["Cache"] = 2] = "Cache";
  BaseDirectory2[BaseDirectory2["Config"] = 3] = "Config";
  BaseDirectory2[BaseDirectory2["Data"] = 4] = "Data";
  BaseDirectory2[BaseDirectory2["LocalData"] = 5] = "LocalData";
  BaseDirectory2[BaseDirectory2["Desktop"] = 6] = "Desktop";
  BaseDirectory2[BaseDirectory2["Document"] = 7] = "Document";
  BaseDirectory2[BaseDirectory2["Download"] = 8] = "Download";
  BaseDirectory2[BaseDirectory2["Executable"] = 9] = "Executable";
  BaseDirectory2[BaseDirectory2["Font"] = 10] = "Font";
  BaseDirectory2[BaseDirectory2["Home"] = 11] = "Home";
  BaseDirectory2[BaseDirectory2["Picture"] = 12] = "Picture";
  BaseDirectory2[BaseDirectory2["Public"] = 13] = "Public";
  BaseDirectory2[BaseDirectory2["Runtime"] = 14] = "Runtime";
  BaseDirectory2[BaseDirectory2["Template"] = 15] = "Template";
  BaseDirectory2[BaseDirectory2["Video"] = 16] = "Video";
  BaseDirectory2[BaseDirectory2["Resource"] = 17] = "Resource";
  BaseDirectory2[BaseDirectory2["App"] = 18] = "App";
  BaseDirectory2[BaseDirectory2["Log"] = 19] = "Log";
  BaseDirectory2[BaseDirectory2["Temp"] = 20] = "Temp";
  BaseDirectory2[BaseDirectory2["AppConfig"] = 21] = "AppConfig";
  BaseDirectory2[BaseDirectory2["AppData"] = 22] = "AppData";
  BaseDirectory2[BaseDirectory2["AppLocalData"] = 23] = "AppLocalData";
  BaseDirectory2[BaseDirectory2["AppCache"] = 24] = "AppCache";
  BaseDirectory2[BaseDirectory2["AppLog"] = 25] = "AppLog";
})(BaseDirectory || (BaseDirectory = {}));

// node_modules/@tauri-apps/api/helpers/os-check.js
function isWindows() {
  return navigator.appVersion.includes("Win");
}

// node_modules/@tauri-apps/api/path.js
function appDir() {
  return __async(this, null, function* () {
    return appConfigDir();
  });
}
function appConfigDir() {
  return __async(this, null, function* () {
    return invokeTauriCommand({
      __tauriModule: "Path",
      message: {
        cmd: "resolvePath",
        path: "",
        directory: BaseDirectory.AppConfig
      }
    });
  });
}
function appDataDir() {
  return __async(this, null, function* () {
    return invokeTauriCommand({
      __tauriModule: "Path",
      message: {
        cmd: "resolvePath",
        path: "",
        directory: BaseDirectory.AppData
      }
    });
  });
}
function appLocalDataDir() {
  return __async(this, null, function* () {
    return invokeTauriCommand({
      __tauriModule: "Path",
      message: {
        cmd: "resolvePath",
        path: "",
        directory: BaseDirectory.AppLocalData
      }
    });
  });
}
function appCacheDir() {
  return __async(this, null, function* () {
    return invokeTauriCommand({
      __tauriModule: "Path",
      message: {
        cmd: "resolvePath",
        path: "",
        directory: BaseDirectory.AppCache
      }
    });
  });
}
function audioDir() {
  return __async(this, null, function* () {
    return invokeTauriCommand({
      __tauriModule: "Path",
      message: {
        cmd: "resolvePath",
        path: "",
        directory: BaseDirectory.Audio
      }
    });
  });
}
function cacheDir() {
  return __async(this, null, function* () {
    return invokeTauriCommand({
      __tauriModule: "Path",
      message: {
        cmd: "resolvePath",
        path: "",
        directory: BaseDirectory.Cache
      }
    });
  });
}
function configDir() {
  return __async(this, null, function* () {
    return invokeTauriCommand({
      __tauriModule: "Path",
      message: {
        cmd: "resolvePath",
        path: "",
        directory: BaseDirectory.Config
      }
    });
  });
}
function dataDir() {
  return __async(this, null, function* () {
    return invokeTauriCommand({
      __tauriModule: "Path",
      message: {
        cmd: "resolvePath",
        path: "",
        directory: BaseDirectory.Data
      }
    });
  });
}
function desktopDir() {
  return __async(this, null, function* () {
    return invokeTauriCommand({
      __tauriModule: "Path",
      message: {
        cmd: "resolvePath",
        path: "",
        directory: BaseDirectory.Desktop
      }
    });
  });
}
function documentDir() {
  return __async(this, null, function* () {
    return invokeTauriCommand({
      __tauriModule: "Path",
      message: {
        cmd: "resolvePath",
        path: "",
        directory: BaseDirectory.Document
      }
    });
  });
}
function downloadDir() {
  return __async(this, null, function* () {
    return invokeTauriCommand({
      __tauriModule: "Path",
      message: {
        cmd: "resolvePath",
        path: "",
        directory: BaseDirectory.Download
      }
    });
  });
}
function executableDir() {
  return __async(this, null, function* () {
    return invokeTauriCommand({
      __tauriModule: "Path",
      message: {
        cmd: "resolvePath",
        path: "",
        directory: BaseDirectory.Executable
      }
    });
  });
}
function fontDir() {
  return __async(this, null, function* () {
    return invokeTauriCommand({
      __tauriModule: "Path",
      message: {
        cmd: "resolvePath",
        path: "",
        directory: BaseDirectory.Font
      }
    });
  });
}
function homeDir() {
  return __async(this, null, function* () {
    return invokeTauriCommand({
      __tauriModule: "Path",
      message: {
        cmd: "resolvePath",
        path: "",
        directory: BaseDirectory.Home
      }
    });
  });
}
function localDataDir() {
  return __async(this, null, function* () {
    return invokeTauriCommand({
      __tauriModule: "Path",
      message: {
        cmd: "resolvePath",
        path: "",
        directory: BaseDirectory.LocalData
      }
    });
  });
}
function pictureDir() {
  return __async(this, null, function* () {
    return invokeTauriCommand({
      __tauriModule: "Path",
      message: {
        cmd: "resolvePath",
        path: "",
        directory: BaseDirectory.Picture
      }
    });
  });
}
function publicDir() {
  return __async(this, null, function* () {
    return invokeTauriCommand({
      __tauriModule: "Path",
      message: {
        cmd: "resolvePath",
        path: "",
        directory: BaseDirectory.Public
      }
    });
  });
}
function resourceDir() {
  return __async(this, null, function* () {
    return invokeTauriCommand({
      __tauriModule: "Path",
      message: {
        cmd: "resolvePath",
        path: "",
        directory: BaseDirectory.Resource
      }
    });
  });
}
function resolveResource(resourcePath) {
  return __async(this, null, function* () {
    return invokeTauriCommand({
      __tauriModule: "Path",
      message: {
        cmd: "resolvePath",
        path: resourcePath,
        directory: BaseDirectory.Resource
      }
    });
  });
}
function runtimeDir() {
  return __async(this, null, function* () {
    return invokeTauriCommand({
      __tauriModule: "Path",
      message: {
        cmd: "resolvePath",
        path: "",
        directory: BaseDirectory.Runtime
      }
    });
  });
}
function templateDir() {
  return __async(this, null, function* () {
    return invokeTauriCommand({
      __tauriModule: "Path",
      message: {
        cmd: "resolvePath",
        path: "",
        directory: BaseDirectory.Template
      }
    });
  });
}
function videoDir() {
  return __async(this, null, function* () {
    return invokeTauriCommand({
      __tauriModule: "Path",
      message: {
        cmd: "resolvePath",
        path: "",
        directory: BaseDirectory.Video
      }
    });
  });
}
function logDir() {
  return __async(this, null, function* () {
    return appLogDir();
  });
}
function appLogDir() {
  return __async(this, null, function* () {
    return invokeTauriCommand({
      __tauriModule: "Path",
      message: {
        cmd: "resolvePath",
        path: "",
        directory: BaseDirectory.AppLog
      }
    });
  });
}
var sep = isWindows() ? "\\" : "/";
var delimiter = isWindows() ? ";" : ":";
function resolve(...paths) {
  return __async(this, null, function* () {
    return invokeTauriCommand({
      __tauriModule: "Path",
      message: {
        cmd: "resolve",
        paths
      }
    });
  });
}
function normalize(path) {
  return __async(this, null, function* () {
    return invokeTauriCommand({
      __tauriModule: "Path",
      message: {
        cmd: "normalize",
        path
      }
    });
  });
}
function join(...paths) {
  return __async(this, null, function* () {
    return invokeTauriCommand({
      __tauriModule: "Path",
      message: {
        cmd: "join",
        paths
      }
    });
  });
}
function dirname(path) {
  return __async(this, null, function* () {
    return invokeTauriCommand({
      __tauriModule: "Path",
      message: {
        cmd: "dirname",
        path
      }
    });
  });
}
function extname(path) {
  return __async(this, null, function* () {
    return invokeTauriCommand({
      __tauriModule: "Path",
      message: {
        cmd: "extname",
        path
      }
    });
  });
}
function basename(path, ext) {
  return __async(this, null, function* () {
    return invokeTauriCommand({
      __tauriModule: "Path",
      message: {
        cmd: "basename",
        path,
        ext
      }
    });
  });
}
function isAbsolute(path) {
  return __async(this, null, function* () {
    return invokeTauriCommand({
      __tauriModule: "Path",
      message: {
        cmd: "isAbsolute",
        path
      }
    });
  });
}
export {
  BaseDirectory,
  appCacheDir,
  appConfigDir,
  appDataDir,
  appDir,
  appLocalDataDir,
  appLogDir,
  audioDir,
  basename,
  cacheDir,
  configDir,
  dataDir,
  delimiter,
  desktopDir,
  dirname,
  documentDir,
  downloadDir,
  executableDir,
  extname,
  fontDir,
  homeDir,
  isAbsolute,
  join,
  localDataDir,
  logDir,
  normalize,
  pictureDir,
  publicDir,
  resolve,
  resolveResource,
  resourceDir,
  runtimeDir,
  sep,
  templateDir,
  videoDir
};
//# sourceMappingURL=@tauri-apps_api_path.js.map
