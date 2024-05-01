import {
  invoke
} from "./chunk-GMXMMATF.js";
import {
  __async
} from "./chunk-J4B6MK7R.js";

// node_modules/@tauri-apps/api/helpers/os-check.js
function isWindows() {
  return navigator.appVersion.includes("Win");
}

// node_modules/@tauri-apps/api/helpers/tauri.js
function invokeTauriCommand(command) {
  return __async(this, null, function* () {
    return invoke("tauri", command);
  });
}

export {
  isWindows,
  invokeTauriCommand
};
//# sourceMappingURL=chunk-PKIZ2LPD.js.map
