import {
  isWindows
} from "./chunk-QBSGILZH.js";
import {
  invokeTauriCommand
} from "./chunk-7QE4GPM5.js";
import "./chunk-GMXMMATF.js";
import {
  __async
} from "./chunk-J4B6MK7R.js";

// node_modules/@tauri-apps/api/os.js
var EOL = isWindows() ? "\r\n" : "\n";
function platform() {
  return __async(this, null, function* () {
    return invokeTauriCommand({
      __tauriModule: "Os",
      message: {
        cmd: "platform"
      }
    });
  });
}
function version() {
  return __async(this, null, function* () {
    return invokeTauriCommand({
      __tauriModule: "Os",
      message: {
        cmd: "version"
      }
    });
  });
}
function type() {
  return __async(this, null, function* () {
    return invokeTauriCommand({
      __tauriModule: "Os",
      message: {
        cmd: "osType"
      }
    });
  });
}
function arch() {
  return __async(this, null, function* () {
    return invokeTauriCommand({
      __tauriModule: "Os",
      message: {
        cmd: "arch"
      }
    });
  });
}
function tempdir() {
  return __async(this, null, function* () {
    return invokeTauriCommand({
      __tauriModule: "Os",
      message: {
        cmd: "tempdir"
      }
    });
  });
}
function locale() {
  return __async(this, null, function* () {
    return invokeTauriCommand({
      __tauriModule: "Os",
      message: {
        cmd: "locale"
      }
    });
  });
}
export {
  EOL,
  arch,
  locale,
  platform,
  tempdir,
  type,
  version
};
//# sourceMappingURL=@tauri-apps_api_os.js.map
