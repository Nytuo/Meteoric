import {
  invokeTauriCommand
} from "./chunk-7QE4GPM5.js";
import {
  transformCallback
} from "./chunk-GMXMMATF.js";
import {
  __async,
  __spreadProps,
  __spreadValues
} from "./chunk-J4B6MK7R.js";

// node_modules/@tauri-apps/api/helpers/event.js
function _unlisten(event, eventId) {
  return __async(this, null, function* () {
    return invokeTauriCommand({
      __tauriModule: "Event",
      message: {
        cmd: "unlisten",
        event,
        eventId
      }
    });
  });
}
function emit(event, windowLabel, payload) {
  return __async(this, null, function* () {
    yield invokeTauriCommand({
      __tauriModule: "Event",
      message: {
        cmd: "emit",
        event,
        windowLabel,
        payload
      }
    });
  });
}
function listen(event, windowLabel, handler) {
  return __async(this, null, function* () {
    return invokeTauriCommand({
      __tauriModule: "Event",
      message: {
        cmd: "listen",
        event,
        windowLabel,
        handler: transformCallback(handler)
      }
    }).then((eventId) => {
      return () => __async(this, null, function* () {
        return _unlisten(event, eventId);
      });
    });
  });
}
function once(event, windowLabel, handler) {
  return __async(this, null, function* () {
    return listen(event, windowLabel, (eventData) => {
      handler(eventData);
      _unlisten(event, eventData.id).catch(() => {
      });
    });
  });
}

// node_modules/@tauri-apps/api/event.js
var TauriEvent;
(function(TauriEvent2) {
  TauriEvent2["WINDOW_RESIZED"] = "tauri://resize";
  TauriEvent2["WINDOW_MOVED"] = "tauri://move";
  TauriEvent2["WINDOW_CLOSE_REQUESTED"] = "tauri://close-requested";
  TauriEvent2["WINDOW_CREATED"] = "tauri://window-created";
  TauriEvent2["WINDOW_DESTROYED"] = "tauri://destroyed";
  TauriEvent2["WINDOW_FOCUS"] = "tauri://focus";
  TauriEvent2["WINDOW_BLUR"] = "tauri://blur";
  TauriEvent2["WINDOW_SCALE_FACTOR_CHANGED"] = "tauri://scale-change";
  TauriEvent2["WINDOW_THEME_CHANGED"] = "tauri://theme-changed";
  TauriEvent2["WINDOW_FILE_DROP"] = "tauri://file-drop";
  TauriEvent2["WINDOW_FILE_DROP_HOVER"] = "tauri://file-drop-hover";
  TauriEvent2["WINDOW_FILE_DROP_CANCELLED"] = "tauri://file-drop-cancelled";
  TauriEvent2["MENU"] = "tauri://menu";
  TauriEvent2["CHECK_UPDATE"] = "tauri://update";
  TauriEvent2["UPDATE_AVAILABLE"] = "tauri://update-available";
  TauriEvent2["INSTALL_UPDATE"] = "tauri://update-install";
  TauriEvent2["STATUS_UPDATE"] = "tauri://update-status";
  TauriEvent2["DOWNLOAD_PROGRESS"] = "tauri://update-download-progress";
})(TauriEvent || (TauriEvent = {}));

// node_modules/@tauri-apps/api/window.js
var LogicalSize = class {
  constructor(width, height) {
    this.type = "Logical";
    this.width = width;
    this.height = height;
  }
};
var PhysicalSize = class {
  constructor(width, height) {
    this.type = "Physical";
    this.width = width;
    this.height = height;
  }
  /**
   * Converts the physical size to a logical one.
   * @example
   * ```typescript
   * import { appWindow } from '@tauri-apps/api/window';
   * const factor = await appWindow.scaleFactor();
   * const size = await appWindow.innerSize();
   * const logical = size.toLogical(factor);
   * ```
   *  */
  toLogical(scaleFactor) {
    return new LogicalSize(this.width / scaleFactor, this.height / scaleFactor);
  }
};
var LogicalPosition = class {
  constructor(x, y) {
    this.type = "Logical";
    this.x = x;
    this.y = y;
  }
};
var PhysicalPosition = class {
  constructor(x, y) {
    this.type = "Physical";
    this.x = x;
    this.y = y;
  }
  /**
   * Converts the physical position to a logical one.
   * @example
   * ```typescript
   * import { appWindow } from '@tauri-apps/api/window';
   * const factor = await appWindow.scaleFactor();
   * const position = await appWindow.innerPosition();
   * const logical = position.toLogical(factor);
   * ```
   * */
  toLogical(scaleFactor) {
    return new LogicalPosition(this.x / scaleFactor, this.y / scaleFactor);
  }
};
var UserAttentionType;
(function(UserAttentionType2) {
  UserAttentionType2[UserAttentionType2["Critical"] = 1] = "Critical";
  UserAttentionType2[UserAttentionType2["Informational"] = 2] = "Informational";
})(UserAttentionType || (UserAttentionType = {}));
function getCurrent() {
  return new WebviewWindow(window.__TAURI_METADATA__.__currentWindow.label, {
    // @ts-expect-error `skip` is not defined in the public API but it is handled by the constructor
    skip: true
  });
}
function getAll() {
  return window.__TAURI_METADATA__.__windows.map((w) => new WebviewWindow(w.label, {
    // @ts-expect-error `skip` is not defined in the public API but it is handled by the constructor
    skip: true
  }));
}
var localTauriEvents = ["tauri://created", "tauri://error"];
var WebviewWindowHandle = class {
  constructor(label) {
    this.label = label;
    this.listeners = /* @__PURE__ */ Object.create(null);
  }
  /**
   * Listen to an event emitted by the backend or webview.
   * The event must either be a global event or an event targetting this window.
   *
   * See {@link WebviewWindow.emit | `emit`} for more information.
   *
   * @example
   * ```typescript
   * import { appWindow } from '@tauri-apps/api/window';
   * const unlisten = await appWindow.listen<string>('state-changed', (event) => {
   *   console.log(`Got error: ${payload}`);
   * });
   *
   * // you need to call unlisten if your handler goes out of scope e.g. the component is unmounted
   * unlisten();
   * ```
   *
   * Note that removing the listener is required if your listener goes out of scope e.g. the component is unmounted.
   *
   * @param event Event name. Must include only alphanumeric characters, `-`, `/`, `:` and `_`.
   * @param handler Event handler.
   * @returns A promise resolving to a function to unlisten to the event.
   */
  listen(event, handler) {
    return __async(this, null, function* () {
      if (this._handleTauriEvent(event, handler)) {
        return Promise.resolve(() => {
          const listeners = this.listeners[event];
          listeners.splice(listeners.indexOf(handler), 1);
        });
      }
      return listen(event, this.label, handler);
    });
  }
  /**
   * Listen to an one-off event.
   * See {@link WebviewWindow.listen | `listen`} for more information.
   *
   * @example
   * ```typescript
   * import { appWindow } from '@tauri-apps/api/window';
   * const unlisten = await appWindow.once<null>('initialized', (event) => {
   *   console.log(`Window initialized!`);
   * });
   *
   * // you need to call unlisten if your handler goes out of scope e.g. the component is unmounted
   * unlisten();
   * ```
   *
   * Note that removing the listener is required if your listener goes out of scope e.g. the component is unmounted.
   *
   * @param event Event name. Must include only alphanumeric characters, `-`, `/`, `:` and `_`.
   * @param handler Event handler.
   * @returns A promise resolving to a function to unlisten to the event.
   */
  once(event, handler) {
    return __async(this, null, function* () {
      if (this._handleTauriEvent(event, handler)) {
        return Promise.resolve(() => {
          const listeners = this.listeners[event];
          listeners.splice(listeners.indexOf(handler), 1);
        });
      }
      return once(event, this.label, handler);
    });
  }
  /**
   * Emits an event to the backend and all Tauri windows.
   * The event will have this window's {@link WebviewWindow.label | label} as {@link Event.windowLabel | source window label}.
   *
   * @example
   * ```typescript
   * import { appWindow } from '@tauri-apps/api/window';
   * await appWindow.emit('window-loaded', { loggedIn: true, token: 'authToken' });
   * ```
   *
   * This function can also be used to communicate between windows:
   * ```typescript
   * import { appWindow } from '@tauri-apps/api/window';
   * await appWindow.listen('sync-data', (event) => { });
   *
   * // on another window...
   * import { WebviewWindow } from '@tauri-apps/api/window';
   * const otherWindow = WebviewWindow.getByLabel('other')
   * await otherWindow.emit('sync-data');
   * ```
   *
   * Global listeners are also triggered:
   * ```typescript
   * import { appWindow } from '@tauri-apps/api/window';
   * import { listen } from '@tauri-apps/api/event';
   * await listen('ping', (event) => { });
   *
   * await appWindow.emit('ping');
   * ```
   *
   * @param event Event name. Must include only alphanumeric characters, `-`, `/`, `:` and `_`.
   * @param payload Event payload.
   */
  emit(event, payload) {
    return __async(this, null, function* () {
      if (localTauriEvents.includes(event)) {
        for (const handler of this.listeners[event] || []) {
          handler({ event, id: -1, windowLabel: this.label, payload });
        }
        return Promise.resolve();
      }
      return emit(event, this.label, payload);
    });
  }
  /** @ignore */
  _handleTauriEvent(event, handler) {
    if (localTauriEvents.includes(event)) {
      if (!(event in this.listeners)) {
        this.listeners[event] = [handler];
      } else {
        this.listeners[event].push(handler);
      }
      return true;
    }
    return false;
  }
};
var WindowManager = class extends WebviewWindowHandle {
  // Getters
  /**
   * The scale factor that can be used to map physical pixels to logical pixels.
   * @example
   * ```typescript
   * import { appWindow } from '@tauri-apps/api/window';
   * const factor = await appWindow.scaleFactor();
   * ```
   *
   * @returns The window's monitor scale factor.
   * */
  scaleFactor() {
    return __async(this, null, function* () {
      return invokeTauriCommand({
        __tauriModule: "Window",
        message: {
          cmd: "manage",
          data: {
            label: this.label,
            cmd: {
              type: "scaleFactor"
            }
          }
        }
      });
    });
  }
  /**
   * The position of the top-left hand corner of the window's client area relative to the top-left hand corner of the desktop.
   * @example
   * ```typescript
   * import { appWindow } from '@tauri-apps/api/window';
   * const position = await appWindow.innerPosition();
   * ```
   *
   * @returns The window's inner position.
   *  */
  innerPosition() {
    return __async(this, null, function* () {
      return invokeTauriCommand({
        __tauriModule: "Window",
        message: {
          cmd: "manage",
          data: {
            label: this.label,
            cmd: {
              type: "innerPosition"
            }
          }
        }
      }).then(({ x, y }) => new PhysicalPosition(x, y));
    });
  }
  /**
   * The position of the top-left hand corner of the window relative to the top-left hand corner of the desktop.
   * @example
   * ```typescript
   * import { appWindow } from '@tauri-apps/api/window';
   * const position = await appWindow.outerPosition();
   * ```
   *
   * @returns The window's outer position.
   *  */
  outerPosition() {
    return __async(this, null, function* () {
      return invokeTauriCommand({
        __tauriModule: "Window",
        message: {
          cmd: "manage",
          data: {
            label: this.label,
            cmd: {
              type: "outerPosition"
            }
          }
        }
      }).then(({ x, y }) => new PhysicalPosition(x, y));
    });
  }
  /**
   * The physical size of the window's client area.
   * The client area is the content of the window, excluding the title bar and borders.
   * @example
   * ```typescript
   * import { appWindow } from '@tauri-apps/api/window';
   * const size = await appWindow.innerSize();
   * ```
   *
   * @returns The window's inner size.
   */
  innerSize() {
    return __async(this, null, function* () {
      return invokeTauriCommand({
        __tauriModule: "Window",
        message: {
          cmd: "manage",
          data: {
            label: this.label,
            cmd: {
              type: "innerSize"
            }
          }
        }
      }).then(({ width, height }) => new PhysicalSize(width, height));
    });
  }
  /**
   * The physical size of the entire window.
   * These dimensions include the title bar and borders. If you don't want that (and you usually don't), use inner_size instead.
   * @example
   * ```typescript
   * import { appWindow } from '@tauri-apps/api/window';
   * const size = await appWindow.outerSize();
   * ```
   *
   * @returns The window's outer size.
   */
  outerSize() {
    return __async(this, null, function* () {
      return invokeTauriCommand({
        __tauriModule: "Window",
        message: {
          cmd: "manage",
          data: {
            label: this.label,
            cmd: {
              type: "outerSize"
            }
          }
        }
      }).then(({ width, height }) => new PhysicalSize(width, height));
    });
  }
  /**
   * Gets the window's current fullscreen state.
   * @example
   * ```typescript
   * import { appWindow } from '@tauri-apps/api/window';
   * const fullscreen = await appWindow.isFullscreen();
   * ```
   *
   * @returns Whether the window is in fullscreen mode or not.
   *  */
  isFullscreen() {
    return __async(this, null, function* () {
      return invokeTauriCommand({
        __tauriModule: "Window",
        message: {
          cmd: "manage",
          data: {
            label: this.label,
            cmd: {
              type: "isFullscreen"
            }
          }
        }
      });
    });
  }
  /**
   * Gets the window's current minimized state.
   * @example
   * ```typescript
   * import { appWindow } from '@tauri-apps/api/window';
   * const minimized = await appWindow.isMinimized();
   * ```
   *
   * @since 1.3.0
   * */
  isMinimized() {
    return __async(this, null, function* () {
      return invokeTauriCommand({
        __tauriModule: "Window",
        message: {
          cmd: "manage",
          data: {
            label: this.label,
            cmd: {
              type: "isMinimized"
            }
          }
        }
      });
    });
  }
  /**
   * Gets the window's current maximized state.
   * @example
   * ```typescript
   * import { appWindow } from '@tauri-apps/api/window';
   * const maximized = await appWindow.isMaximized();
   * ```
   *
   * @returns Whether the window is maximized or not.
   * */
  isMaximized() {
    return __async(this, null, function* () {
      return invokeTauriCommand({
        __tauriModule: "Window",
        message: {
          cmd: "manage",
          data: {
            label: this.label,
            cmd: {
              type: "isMaximized"
            }
          }
        }
      });
    });
  }
  /**
   * Gets the window's current focus state.
   * @example
   * ```typescript
   * import { appWindow } from '@tauri-apps/api/window';
   * const focused = await appWindow.isFocused();
   * ```
   *
   * @returns Whether the window is focused or not.
   *
   * @since 1.4
   * */
  isFocused() {
    return __async(this, null, function* () {
      return invokeTauriCommand({
        __tauriModule: "Window",
        message: {
          cmd: "manage",
          data: {
            label: this.label,
            cmd: {
              type: "isFocused"
            }
          }
        }
      });
    });
  }
  /**
   * Gets the window's current decorated state.
   * @example
   * ```typescript
   * import { appWindow } from '@tauri-apps/api/window';
   * const decorated = await appWindow.isDecorated();
   * ```
   *
   * @returns Whether the window is decorated or not.
   *  */
  isDecorated() {
    return __async(this, null, function* () {
      return invokeTauriCommand({
        __tauriModule: "Window",
        message: {
          cmd: "manage",
          data: {
            label: this.label,
            cmd: {
              type: "isDecorated"
            }
          }
        }
      });
    });
  }
  /**
   * Gets the window's current resizable state.
   * @example
   * ```typescript
   * import { appWindow } from '@tauri-apps/api/window';
   * const resizable = await appWindow.isResizable();
   * ```
   *
   * @returns Whether the window is resizable or not.
   *  */
  isResizable() {
    return __async(this, null, function* () {
      return invokeTauriCommand({
        __tauriModule: "Window",
        message: {
          cmd: "manage",
          data: {
            label: this.label,
            cmd: {
              type: "isResizable"
            }
          }
        }
      });
    });
  }
  /**
   * Gets the window’s native maximize button state.
   *
   * #### Platform-specific
   *
   * - **Linux / iOS / Android:** Unsupported.
   *
   * @example
   * ```typescript
   * import { appWindow } from '@tauri-apps/api/window';
   * const maximizable = await appWindow.isMaximizable();
   * ```
   *
   * @returns Whether the window's native maximize button is enabled or not.
   *  */
  isMaximizable() {
    return __async(this, null, function* () {
      return invokeTauriCommand({
        __tauriModule: "Window",
        message: {
          cmd: "manage",
          data: {
            label: this.label,
            cmd: {
              type: "isMaximizable"
            }
          }
        }
      });
    });
  }
  /**
   * Gets the window’s native minimize button state.
   *
   * #### Platform-specific
   *
   * - **Linux / iOS / Android:** Unsupported.
   *
   * @example
   * ```typescript
   * import { appWindow } from '@tauri-apps/api/window';
   * const minimizable = await appWindow.isMinimizable();
   * ```
   *
   * @returns Whether the window's native minimize button is enabled or not.
   *  */
  isMinimizable() {
    return __async(this, null, function* () {
      return invokeTauriCommand({
        __tauriModule: "Window",
        message: {
          cmd: "manage",
          data: {
            label: this.label,
            cmd: {
              type: "isMinimizable"
            }
          }
        }
      });
    });
  }
  /**
   * Gets the window’s native close button state.
   *
   * #### Platform-specific
   *
   * - **Linux / iOS / Android:** Unsupported.
   *
   * @example
   * ```typescript
   * import { appWindow } from '@tauri-apps/api/window';
   * const closable = await appWindow.isClosable();
   * ```
   *
   * @returns Whether the window's native close button is enabled or not.
   *  */
  isClosable() {
    return __async(this, null, function* () {
      return invokeTauriCommand({
        __tauriModule: "Window",
        message: {
          cmd: "manage",
          data: {
            label: this.label,
            cmd: {
              type: "isClosable"
            }
          }
        }
      });
    });
  }
  /**
   * Gets the window's current visible state.
   * @example
   * ```typescript
   * import { appWindow } from '@tauri-apps/api/window';
   * const visible = await appWindow.isVisible();
   * ```
   *
   * @returns Whether the window is visible or not.
   *  */
  isVisible() {
    return __async(this, null, function* () {
      return invokeTauriCommand({
        __tauriModule: "Window",
        message: {
          cmd: "manage",
          data: {
            label: this.label,
            cmd: {
              type: "isVisible"
            }
          }
        }
      });
    });
  }
  /**
   * Gets the window's current title.
   * @example
   * ```typescript
   * import { appWindow } from '@tauri-apps/api/window';
   * const title = await appWindow.title();
   * ```
   *
   * @since 1.3.0
   * */
  title() {
    return __async(this, null, function* () {
      return invokeTauriCommand({
        __tauriModule: "Window",
        message: {
          cmd: "manage",
          data: {
            label: this.label,
            cmd: {
              type: "title"
            }
          }
        }
      });
    });
  }
  /**
   * Gets the window's current theme.
   *
   * #### Platform-specific
   *
   * - **macOS:** Theme was introduced on macOS 10.14. Returns `light` on macOS 10.13 and below.
   *
   * @example
   * ```typescript
   * import { appWindow } from '@tauri-apps/api/window';
   * const theme = await appWindow.theme();
   * ```
   *
   * @returns The window theme.
   * */
  theme() {
    return __async(this, null, function* () {
      return invokeTauriCommand({
        __tauriModule: "Window",
        message: {
          cmd: "manage",
          data: {
            label: this.label,
            cmd: {
              type: "theme"
            }
          }
        }
      });
    });
  }
  // Setters
  /**
   * Centers the window.
   * @example
   * ```typescript
   * import { appWindow } from '@tauri-apps/api/window';
   * await appWindow.center();
   * ```
   *
   * @returns A promise indicating the success or failure of the operation.
   */
  center() {
    return __async(this, null, function* () {
      return invokeTauriCommand({
        __tauriModule: "Window",
        message: {
          cmd: "manage",
          data: {
            label: this.label,
            cmd: {
              type: "center"
            }
          }
        }
      });
    });
  }
  /**
   *  Requests user attention to the window, this has no effect if the application
   * is already focused. How requesting for user attention manifests is platform dependent,
   * see `UserAttentionType` for details.
   *
   * Providing `null` will unset the request for user attention. Unsetting the request for
   * user attention might not be done automatically by the WM when the window receives input.
   *
   * #### Platform-specific
   *
   * - **macOS:** `null` has no effect.
   * - **Linux:** Urgency levels have the same effect.
   * @example
   * ```typescript
   * import { appWindow } from '@tauri-apps/api/window';
   * await appWindow.requestUserAttention();
   * ```
   *
   * @param requestType
   * @returns A promise indicating the success or failure of the operation.
   */
  requestUserAttention(requestType) {
    return __async(this, null, function* () {
      let requestType_ = null;
      if (requestType) {
        if (requestType === UserAttentionType.Critical) {
          requestType_ = { type: "Critical" };
        } else {
          requestType_ = { type: "Informational" };
        }
      }
      return invokeTauriCommand({
        __tauriModule: "Window",
        message: {
          cmd: "manage",
          data: {
            label: this.label,
            cmd: {
              type: "requestUserAttention",
              payload: requestType_
            }
          }
        }
      });
    });
  }
  /**
   * Updates the window resizable flag.
   * @example
   * ```typescript
   * import { appWindow } from '@tauri-apps/api/window';
   * await appWindow.setResizable(false);
   * ```
   *
   * @param resizable
   * @returns A promise indicating the success or failure of the operation.
   */
  setResizable(resizable) {
    return __async(this, null, function* () {
      return invokeTauriCommand({
        __tauriModule: "Window",
        message: {
          cmd: "manage",
          data: {
            label: this.label,
            cmd: {
              type: "setResizable",
              payload: resizable
            }
          }
        }
      });
    });
  }
  /**
   * Sets whether the window's native maximize button is enabled or not.
   * If resizable is set to false, this setting is ignored.
   *
   * #### Platform-specific
   *
   * - **macOS:** Disables the "zoom" button in the window titlebar, which is also used to enter fullscreen mode.
   * - **Linux / iOS / Android:** Unsupported.
   *
   * @example
   * ```typescript
   * import { appWindow } from '@tauri-apps/api/window';
   * await appWindow.setMaximizable(false);
   * ```
   *
   * @param maximizable
   * @returns A promise indicating the success or failure of the operation.
   */
  setMaximizable(maximizable) {
    return __async(this, null, function* () {
      return invokeTauriCommand({
        __tauriModule: "Window",
        message: {
          cmd: "manage",
          data: {
            label: this.label,
            cmd: {
              type: "setMaximizable",
              payload: maximizable
            }
          }
        }
      });
    });
  }
  /**
   * Sets whether the window's native minimize button is enabled or not.
   *
   * #### Platform-specific
   *
   * - **Linux / iOS / Android:** Unsupported.
   *
   * @example
   * ```typescript
   * import { appWindow } from '@tauri-apps/api/window';
   * await appWindow.setMinimizable(false);
   * ```
   *
   * @param minimizable
   * @returns A promise indicating the success or failure of the operation.
   */
  setMinimizable(minimizable) {
    return __async(this, null, function* () {
      return invokeTauriCommand({
        __tauriModule: "Window",
        message: {
          cmd: "manage",
          data: {
            label: this.label,
            cmd: {
              type: "setMinimizable",
              payload: minimizable
            }
          }
        }
      });
    });
  }
  /**
   * Sets whether the window's native close button is enabled or not.
   *
   * #### Platform-specific
   *
   * - **Linux:** GTK+ will do its best to convince the window manager not to show a close button. Depending on the system, this function may not have any effect when called on a window that is already visible
   * - **iOS / Android:** Unsupported.
   *
   * @example
   * ```typescript
   * import { appWindow } from '@tauri-apps/api/window';
   * await appWindow.setClosable(false);
   * ```
   *
   * @param closable
   * @returns A promise indicating the success or failure of the operation.
   */
  setClosable(closable) {
    return __async(this, null, function* () {
      return invokeTauriCommand({
        __tauriModule: "Window",
        message: {
          cmd: "manage",
          data: {
            label: this.label,
            cmd: {
              type: "setClosable",
              payload: closable
            }
          }
        }
      });
    });
  }
  /**
   * Sets the window title.
   * @example
   * ```typescript
   * import { appWindow } from '@tauri-apps/api/window';
   * await appWindow.setTitle('Tauri');
   * ```
   *
   * @param title The new title
   * @returns A promise indicating the success or failure of the operation.
   */
  setTitle(title) {
    return __async(this, null, function* () {
      return invokeTauriCommand({
        __tauriModule: "Window",
        message: {
          cmd: "manage",
          data: {
            label: this.label,
            cmd: {
              type: "setTitle",
              payload: title
            }
          }
        }
      });
    });
  }
  /**
   * Maximizes the window.
   * @example
   * ```typescript
   * import { appWindow } from '@tauri-apps/api/window';
   * await appWindow.maximize();
   * ```
   *
   * @returns A promise indicating the success or failure of the operation.
   */
  maximize() {
    return __async(this, null, function* () {
      return invokeTauriCommand({
        __tauriModule: "Window",
        message: {
          cmd: "manage",
          data: {
            label: this.label,
            cmd: {
              type: "maximize"
            }
          }
        }
      });
    });
  }
  /**
   * Unmaximizes the window.
   * @example
   * ```typescript
   * import { appWindow } from '@tauri-apps/api/window';
   * await appWindow.unmaximize();
   * ```
   *
   * @returns A promise indicating the success or failure of the operation.
   */
  unmaximize() {
    return __async(this, null, function* () {
      return invokeTauriCommand({
        __tauriModule: "Window",
        message: {
          cmd: "manage",
          data: {
            label: this.label,
            cmd: {
              type: "unmaximize"
            }
          }
        }
      });
    });
  }
  /**
   * Toggles the window maximized state.
   * @example
   * ```typescript
   * import { appWindow } from '@tauri-apps/api/window';
   * await appWindow.toggleMaximize();
   * ```
   *
   * @returns A promise indicating the success or failure of the operation.
   */
  toggleMaximize() {
    return __async(this, null, function* () {
      return invokeTauriCommand({
        __tauriModule: "Window",
        message: {
          cmd: "manage",
          data: {
            label: this.label,
            cmd: {
              type: "toggleMaximize"
            }
          }
        }
      });
    });
  }
  /**
   * Minimizes the window.
   * @example
   * ```typescript
   * import { appWindow } from '@tauri-apps/api/window';
   * await appWindow.minimize();
   * ```
   *
   * @returns A promise indicating the success or failure of the operation.
   */
  minimize() {
    return __async(this, null, function* () {
      return invokeTauriCommand({
        __tauriModule: "Window",
        message: {
          cmd: "manage",
          data: {
            label: this.label,
            cmd: {
              type: "minimize"
            }
          }
        }
      });
    });
  }
  /**
   * Unminimizes the window.
   * @example
   * ```typescript
   * import { appWindow } from '@tauri-apps/api/window';
   * await appWindow.unminimize();
   * ```
   *
   * @returns A promise indicating the success or failure of the operation.
   */
  unminimize() {
    return __async(this, null, function* () {
      return invokeTauriCommand({
        __tauriModule: "Window",
        message: {
          cmd: "manage",
          data: {
            label: this.label,
            cmd: {
              type: "unminimize"
            }
          }
        }
      });
    });
  }
  /**
   * Sets the window visibility to true.
   * @example
   * ```typescript
   * import { appWindow } from '@tauri-apps/api/window';
   * await appWindow.show();
   * ```
   *
   * @returns A promise indicating the success or failure of the operation.
   */
  show() {
    return __async(this, null, function* () {
      return invokeTauriCommand({
        __tauriModule: "Window",
        message: {
          cmd: "manage",
          data: {
            label: this.label,
            cmd: {
              type: "show"
            }
          }
        }
      });
    });
  }
  /**
   * Sets the window visibility to false.
   * @example
   * ```typescript
   * import { appWindow } from '@tauri-apps/api/window';
   * await appWindow.hide();
   * ```
   *
   * @returns A promise indicating the success or failure of the operation.
   */
  hide() {
    return __async(this, null, function* () {
      return invokeTauriCommand({
        __tauriModule: "Window",
        message: {
          cmd: "manage",
          data: {
            label: this.label,
            cmd: {
              type: "hide"
            }
          }
        }
      });
    });
  }
  /**
   * Closes the window.
   * @example
   * ```typescript
   * import { appWindow } from '@tauri-apps/api/window';
   * await appWindow.close();
   * ```
   *
   * @returns A promise indicating the success or failure of the operation.
   */
  close() {
    return __async(this, null, function* () {
      return invokeTauriCommand({
        __tauriModule: "Window",
        message: {
          cmd: "manage",
          data: {
            label: this.label,
            cmd: {
              type: "close"
            }
          }
        }
      });
    });
  }
  /**
   * Whether the window should have borders and bars.
   * @example
   * ```typescript
   * import { appWindow } from '@tauri-apps/api/window';
   * await appWindow.setDecorations(false);
   * ```
   *
   * @param decorations Whether the window should have borders and bars.
   * @returns A promise indicating the success or failure of the operation.
   */
  setDecorations(decorations) {
    return __async(this, null, function* () {
      return invokeTauriCommand({
        __tauriModule: "Window",
        message: {
          cmd: "manage",
          data: {
            label: this.label,
            cmd: {
              type: "setDecorations",
              payload: decorations
            }
          }
        }
      });
    });
  }
  /**
   * Whether the window should always be on top of other windows.
   * @example
   * ```typescript
   * import { appWindow } from '@tauri-apps/api/window';
   * await appWindow.setAlwaysOnTop(true);
   * ```
   *
   * @param alwaysOnTop Whether the window should always be on top of other windows or not.
   * @returns A promise indicating the success or failure of the operation.
   */
  setAlwaysOnTop(alwaysOnTop) {
    return __async(this, null, function* () {
      return invokeTauriCommand({
        __tauriModule: "Window",
        message: {
          cmd: "manage",
          data: {
            label: this.label,
            cmd: {
              type: "setAlwaysOnTop",
              payload: alwaysOnTop
            }
          }
        }
      });
    });
  }
  /**
   * Prevents the window contents from being captured by other apps.
   * @example
   * ```typescript
   * import { appWindow } from '@tauri-apps/api/window';
   * await appWindow.setContentProtected(true);
   * ```
   *
   * @returns A promise indicating the success or failure of the operation.
   *
   * @since 1.2.0
   */
  setContentProtected(protected_) {
    return __async(this, null, function* () {
      return invokeTauriCommand({
        __tauriModule: "Window",
        message: {
          cmd: "manage",
          data: {
            label: this.label,
            cmd: {
              type: "setContentProtected",
              payload: protected_
            }
          }
        }
      });
    });
  }
  /**
   * Resizes the window with a new inner size.
   * @example
   * ```typescript
   * import { appWindow, LogicalSize } from '@tauri-apps/api/window';
   * await appWindow.setSize(new LogicalSize(600, 500));
   * ```
   *
   * @param size The logical or physical inner size.
   * @returns A promise indicating the success or failure of the operation.
   */
  setSize(size) {
    return __async(this, null, function* () {
      if (!size || size.type !== "Logical" && size.type !== "Physical") {
        throw new Error("the `size` argument must be either a LogicalSize or a PhysicalSize instance");
      }
      return invokeTauriCommand({
        __tauriModule: "Window",
        message: {
          cmd: "manage",
          data: {
            label: this.label,
            cmd: {
              type: "setSize",
              payload: {
                type: size.type,
                data: {
                  width: size.width,
                  height: size.height
                }
              }
            }
          }
        }
      });
    });
  }
  /**
   * Sets the window minimum inner size. If the `size` argument is not provided, the constraint is unset.
   * @example
   * ```typescript
   * import { appWindow, PhysicalSize } from '@tauri-apps/api/window';
   * await appWindow.setMinSize(new PhysicalSize(600, 500));
   * ```
   *
   * @param size The logical or physical inner size, or `null` to unset the constraint.
   * @returns A promise indicating the success or failure of the operation.
   */
  setMinSize(size) {
    return __async(this, null, function* () {
      if (size && size.type !== "Logical" && size.type !== "Physical") {
        throw new Error("the `size` argument must be either a LogicalSize or a PhysicalSize instance");
      }
      return invokeTauriCommand({
        __tauriModule: "Window",
        message: {
          cmd: "manage",
          data: {
            label: this.label,
            cmd: {
              type: "setMinSize",
              payload: size ? {
                type: size.type,
                data: {
                  width: size.width,
                  height: size.height
                }
              } : null
            }
          }
        }
      });
    });
  }
  /**
   * Sets the window maximum inner size. If the `size` argument is undefined, the constraint is unset.
   * @example
   * ```typescript
   * import { appWindow, LogicalSize } from '@tauri-apps/api/window';
   * await appWindow.setMaxSize(new LogicalSize(600, 500));
   * ```
   *
   * @param size The logical or physical inner size, or `null` to unset the constraint.
   * @returns A promise indicating the success or failure of the operation.
   */
  setMaxSize(size) {
    return __async(this, null, function* () {
      if (size && size.type !== "Logical" && size.type !== "Physical") {
        throw new Error("the `size` argument must be either a LogicalSize or a PhysicalSize instance");
      }
      return invokeTauriCommand({
        __tauriModule: "Window",
        message: {
          cmd: "manage",
          data: {
            label: this.label,
            cmd: {
              type: "setMaxSize",
              payload: size ? {
                type: size.type,
                data: {
                  width: size.width,
                  height: size.height
                }
              } : null
            }
          }
        }
      });
    });
  }
  /**
   * Sets the window outer position.
   * @example
   * ```typescript
   * import { appWindow, LogicalPosition } from '@tauri-apps/api/window';
   * await appWindow.setPosition(new LogicalPosition(600, 500));
   * ```
   *
   * @param position The new position, in logical or physical pixels.
   * @returns A promise indicating the success or failure of the operation.
   */
  setPosition(position) {
    return __async(this, null, function* () {
      if (!position || position.type !== "Logical" && position.type !== "Physical") {
        throw new Error("the `position` argument must be either a LogicalPosition or a PhysicalPosition instance");
      }
      return invokeTauriCommand({
        __tauriModule: "Window",
        message: {
          cmd: "manage",
          data: {
            label: this.label,
            cmd: {
              type: "setPosition",
              payload: {
                type: position.type,
                data: {
                  x: position.x,
                  y: position.y
                }
              }
            }
          }
        }
      });
    });
  }
  /**
   * Sets the window fullscreen state.
   * @example
   * ```typescript
   * import { appWindow } from '@tauri-apps/api/window';
   * await appWindow.setFullscreen(true);
   * ```
   *
   * @param fullscreen Whether the window should go to fullscreen or not.
   * @returns A promise indicating the success or failure of the operation.
   */
  setFullscreen(fullscreen) {
    return __async(this, null, function* () {
      return invokeTauriCommand({
        __tauriModule: "Window",
        message: {
          cmd: "manage",
          data: {
            label: this.label,
            cmd: {
              type: "setFullscreen",
              payload: fullscreen
            }
          }
        }
      });
    });
  }
  /**
   * Bring the window to front and focus.
   * @example
   * ```typescript
   * import { appWindow } from '@tauri-apps/api/window';
   * await appWindow.setFocus();
   * ```
   *
   * @returns A promise indicating the success or failure of the operation.
   */
  setFocus() {
    return __async(this, null, function* () {
      return invokeTauriCommand({
        __tauriModule: "Window",
        message: {
          cmd: "manage",
          data: {
            label: this.label,
            cmd: {
              type: "setFocus"
            }
          }
        }
      });
    });
  }
  /**
   * Sets the window icon.
   * @example
   * ```typescript
   * import { appWindow } from '@tauri-apps/api/window';
   * await appWindow.setIcon('/tauri/awesome.png');
   * ```
   *
   * Note that you need the `icon-ico` or `icon-png` Cargo features to use this API.
   * To enable it, change your Cargo.toml file:
   * ```toml
   * [dependencies]
   * tauri = { version = "...", features = ["...", "icon-png"] }
   * ```
   *
   * @param icon Icon bytes or path to the icon file.
   * @returns A promise indicating the success or failure of the operation.
   */
  setIcon(icon) {
    return __async(this, null, function* () {
      return invokeTauriCommand({
        __tauriModule: "Window",
        message: {
          cmd: "manage",
          data: {
            label: this.label,
            cmd: {
              type: "setIcon",
              payload: {
                // correctly serialize Uint8Arrays
                icon: typeof icon === "string" ? icon : Array.from(icon)
              }
            }
          }
        }
      });
    });
  }
  /**
   * Whether the window icon should be hidden from the taskbar or not.
   *
   * #### Platform-specific
   *
   * - **macOS:** Unsupported.
   * @example
   * ```typescript
   * import { appWindow } from '@tauri-apps/api/window';
   * await appWindow.setSkipTaskbar(true);
   * ```
   *
   * @param skip true to hide window icon, false to show it.
   * @returns A promise indicating the success or failure of the operation.
   */
  setSkipTaskbar(skip) {
    return __async(this, null, function* () {
      return invokeTauriCommand({
        __tauriModule: "Window",
        message: {
          cmd: "manage",
          data: {
            label: this.label,
            cmd: {
              type: "setSkipTaskbar",
              payload: skip
            }
          }
        }
      });
    });
  }
  /**
   * Grabs the cursor, preventing it from leaving the window.
   *
   * There's no guarantee that the cursor will be hidden. You should
   * hide it by yourself if you want so.
   *
   * #### Platform-specific
   *
   * - **Linux:** Unsupported.
   * - **macOS:** This locks the cursor in a fixed location, which looks visually awkward.
   * @example
   * ```typescript
   * import { appWindow } from '@tauri-apps/api/window';
   * await appWindow.setCursorGrab(true);
   * ```
   *
   * @param grab `true` to grab the cursor icon, `false` to release it.
   * @returns A promise indicating the success or failure of the operation.
   */
  setCursorGrab(grab) {
    return __async(this, null, function* () {
      return invokeTauriCommand({
        __tauriModule: "Window",
        message: {
          cmd: "manage",
          data: {
            label: this.label,
            cmd: {
              type: "setCursorGrab",
              payload: grab
            }
          }
        }
      });
    });
  }
  /**
   * Modifies the cursor's visibility.
   *
   * #### Platform-specific
   *
   * - **Windows:** The cursor is only hidden within the confines of the window.
   * - **macOS:** The cursor is hidden as long as the window has input focus, even if the cursor is
   *   outside of the window.
   * @example
   * ```typescript
   * import { appWindow } from '@tauri-apps/api/window';
   * await appWindow.setCursorVisible(false);
   * ```
   *
   * @param visible If `false`, this will hide the cursor. If `true`, this will show the cursor.
   * @returns A promise indicating the success or failure of the operation.
   */
  setCursorVisible(visible) {
    return __async(this, null, function* () {
      return invokeTauriCommand({
        __tauriModule: "Window",
        message: {
          cmd: "manage",
          data: {
            label: this.label,
            cmd: {
              type: "setCursorVisible",
              payload: visible
            }
          }
        }
      });
    });
  }
  /**
   * Modifies the cursor icon of the window.
   * @example
   * ```typescript
   * import { appWindow } from '@tauri-apps/api/window';
   * await appWindow.setCursorIcon('help');
   * ```
   *
   * @param icon The new cursor icon.
   * @returns A promise indicating the success or failure of the operation.
   */
  setCursorIcon(icon) {
    return __async(this, null, function* () {
      return invokeTauriCommand({
        __tauriModule: "Window",
        message: {
          cmd: "manage",
          data: {
            label: this.label,
            cmd: {
              type: "setCursorIcon",
              payload: icon
            }
          }
        }
      });
    });
  }
  /**
   * Changes the position of the cursor in window coordinates.
   * @example
   * ```typescript
   * import { appWindow, LogicalPosition } from '@tauri-apps/api/window';
   * await appWindow.setCursorPosition(new LogicalPosition(600, 300));
   * ```
   *
   * @param position The new cursor position.
   * @returns A promise indicating the success or failure of the operation.
   */
  setCursorPosition(position) {
    return __async(this, null, function* () {
      if (!position || position.type !== "Logical" && position.type !== "Physical") {
        throw new Error("the `position` argument must be either a LogicalPosition or a PhysicalPosition instance");
      }
      return invokeTauriCommand({
        __tauriModule: "Window",
        message: {
          cmd: "manage",
          data: {
            label: this.label,
            cmd: {
              type: "setCursorPosition",
              payload: {
                type: position.type,
                data: {
                  x: position.x,
                  y: position.y
                }
              }
            }
          }
        }
      });
    });
  }
  /**
   * Changes the cursor events behavior.
   *
   * @example
   * ```typescript
   * import { appWindow } from '@tauri-apps/api/window';
   * await appWindow.setIgnoreCursorEvents(true);
   * ```
   *
   * @param ignore `true` to ignore the cursor events; `false` to process them as usual.
   * @returns A promise indicating the success or failure of the operation.
   */
  setIgnoreCursorEvents(ignore) {
    return __async(this, null, function* () {
      return invokeTauriCommand({
        __tauriModule: "Window",
        message: {
          cmd: "manage",
          data: {
            label: this.label,
            cmd: {
              type: "setIgnoreCursorEvents",
              payload: ignore
            }
          }
        }
      });
    });
  }
  /**
   * Starts dragging the window.
   * @example
   * ```typescript
   * import { appWindow } from '@tauri-apps/api/window';
   * await appWindow.startDragging();
   * ```
   *
   * @return A promise indicating the success or failure of the operation.
   */
  startDragging() {
    return __async(this, null, function* () {
      return invokeTauriCommand({
        __tauriModule: "Window",
        message: {
          cmd: "manage",
          data: {
            label: this.label,
            cmd: {
              type: "startDragging"
            }
          }
        }
      });
    });
  }
  // Listeners
  /**
   * Listen to window resize.
   *
   * @example
   * ```typescript
   * import { appWindow } from "@tauri-apps/api/window";
   * const unlisten = await appWindow.onResized(({ payload: size }) => {
   *  console.log('Window resized', size);
   * });
   *
   * // you need to call unlisten if your handler goes out of scope e.g. the component is unmounted
   * unlisten();
   * ```
   *
   * @returns A promise resolving to a function to unlisten to the event.
   * Note that removing the listener is required if your listener goes out of scope e.g. the component is unmounted.
   *
   * @since 1.0.2
   */
  onResized(handler) {
    return __async(this, null, function* () {
      return this.listen(TauriEvent.WINDOW_RESIZED, (e) => {
        e.payload = mapPhysicalSize(e.payload);
        handler(e);
      });
    });
  }
  /**
   * Listen to window move.
   *
   * @example
   * ```typescript
   * import { appWindow } from "@tauri-apps/api/window";
   * const unlisten = await appWindow.onMoved(({ payload: position }) => {
   *  console.log('Window moved', position);
   * });
   *
   * // you need to call unlisten if your handler goes out of scope e.g. the component is unmounted
   * unlisten();
   * ```
   *
   * @returns A promise resolving to a function to unlisten to the event.
   * Note that removing the listener is required if your listener goes out of scope e.g. the component is unmounted.
   *
   * @since 1.0.2
   */
  onMoved(handler) {
    return __async(this, null, function* () {
      return this.listen(TauriEvent.WINDOW_MOVED, (e) => {
        e.payload = mapPhysicalPosition(e.payload);
        handler(e);
      });
    });
  }
  /**
   * Listen to window close requested. Emitted when the user requests to closes the window.
   *
   * @example
   * ```typescript
   * import { appWindow } from "@tauri-apps/api/window";
   * import { confirm } from '@tauri-apps/api/dialog';
   * const unlisten = await appWindow.onCloseRequested(async (event) => {
   *   const confirmed = await confirm('Are you sure?');
   *   if (!confirmed) {
   *     // user did not confirm closing the window; let's prevent it
   *     event.preventDefault();
   *   }
   * });
   *
   * // you need to call unlisten if your handler goes out of scope e.g. the component is unmounted
   * unlisten();
   * ```
   *
   * @returns A promise resolving to a function to unlisten to the event.
   * Note that removing the listener is required if your listener goes out of scope e.g. the component is unmounted.
   *
   * @since 1.0.2
   */
  /* eslint-disable @typescript-eslint/promise-function-async */
  onCloseRequested(handler) {
    return __async(this, null, function* () {
      return this.listen(TauriEvent.WINDOW_CLOSE_REQUESTED, (event) => {
        const evt = new CloseRequestedEvent(event);
        void Promise.resolve(handler(evt)).then(() => {
          if (!evt.isPreventDefault()) {
            return this.close();
          }
        });
      });
    });
  }
  /* eslint-enable */
  /**
   * Listen to window focus change.
   *
   * @example
   * ```typescript
   * import { appWindow } from "@tauri-apps/api/window";
   * const unlisten = await appWindow.onFocusChanged(({ payload: focused }) => {
   *  console.log('Focus changed, window is focused? ' + focused);
   * });
   *
   * // you need to call unlisten if your handler goes out of scope e.g. the component is unmounted
   * unlisten();
   * ```
   *
   * @returns A promise resolving to a function to unlisten to the event.
   * Note that removing the listener is required if your listener goes out of scope e.g. the component is unmounted.
   *
   * @since 1.0.2
   */
  onFocusChanged(handler) {
    return __async(this, null, function* () {
      const unlistenFocus = yield this.listen(TauriEvent.WINDOW_FOCUS, (event) => {
        handler(__spreadProps(__spreadValues({}, event), { payload: true }));
      });
      const unlistenBlur = yield this.listen(TauriEvent.WINDOW_BLUR, (event) => {
        handler(__spreadProps(__spreadValues({}, event), { payload: false }));
      });
      return () => {
        unlistenFocus();
        unlistenBlur();
      };
    });
  }
  /**
   * Listen to window scale change. Emitted when the window's scale factor has changed.
   * The following user actions can cause DPI changes:
   * - Changing the display's resolution.
   * - Changing the display's scale factor (e.g. in Control Panel on Windows).
   * - Moving the window to a display with a different scale factor.
   *
   * @example
   * ```typescript
   * import { appWindow } from "@tauri-apps/api/window";
   * const unlisten = await appWindow.onScaleChanged(({ payload }) => {
   *  console.log('Scale changed', payload.scaleFactor, payload.size);
   * });
   *
   * // you need to call unlisten if your handler goes out of scope e.g. the component is unmounted
   * unlisten();
   * ```
   *
   * @returns A promise resolving to a function to unlisten to the event.
   * Note that removing the listener is required if your listener goes out of scope e.g. the component is unmounted.
   *
   * @since 1.0.2
   */
  onScaleChanged(handler) {
    return __async(this, null, function* () {
      return this.listen(TauriEvent.WINDOW_SCALE_FACTOR_CHANGED, handler);
    });
  }
  /**
   * Listen to the window menu item click. The payload is the item id.
   *
   * @example
   * ```typescript
   * import { appWindow } from "@tauri-apps/api/window";
   * const unlisten = await appWindow.onMenuClicked(({ payload: menuId }) => {
   *  console.log('Menu clicked: ' + menuId);
   * });
   *
   * // you need to call unlisten if your handler goes out of scope e.g. the component is unmounted
   * unlisten();
   * ```
   *
   * @returns A promise resolving to a function to unlisten to the event.
   * Note that removing the listener is required if your listener goes out of scope e.g. the component is unmounted.
   *
   * @since 1.0.2
   */
  onMenuClicked(handler) {
    return __async(this, null, function* () {
      return this.listen(TauriEvent.MENU, handler);
    });
  }
  /**
   * Listen to a file drop event.
   * The listener is triggered when the user hovers the selected files on the window,
   * drops the files or cancels the operation.
   *
   * @example
   * ```typescript
   * import { appWindow } from "@tauri-apps/api/window";
   * const unlisten = await appWindow.onFileDropEvent((event) => {
   *  if (event.payload.type === 'hover') {
   *    console.log('User hovering', event.payload.paths);
   *  } else if (event.payload.type === 'drop') {
   *    console.log('User dropped', event.payload.paths);
   *  } else {
   *    console.log('File drop cancelled');
   *  }
   * });
   *
   * // you need to call unlisten if your handler goes out of scope e.g. the component is unmounted
   * unlisten();
   * ```
   *
   * @returns A promise resolving to a function to unlisten to the event.
   * Note that removing the listener is required if your listener goes out of scope e.g. the component is unmounted.
   *
   * @since 1.0.2
   */
  onFileDropEvent(handler) {
    return __async(this, null, function* () {
      const unlistenFileDrop = yield this.listen(TauriEvent.WINDOW_FILE_DROP, (event) => {
        handler(__spreadProps(__spreadValues({}, event), { payload: { type: "drop", paths: event.payload } }));
      });
      const unlistenFileHover = yield this.listen(TauriEvent.WINDOW_FILE_DROP_HOVER, (event) => {
        handler(__spreadProps(__spreadValues({}, event), { payload: { type: "hover", paths: event.payload } }));
      });
      const unlistenCancel = yield this.listen(TauriEvent.WINDOW_FILE_DROP_CANCELLED, (event) => {
        handler(__spreadProps(__spreadValues({}, event), { payload: { type: "cancel" } }));
      });
      return () => {
        unlistenFileDrop();
        unlistenFileHover();
        unlistenCancel();
      };
    });
  }
  /**
   * Listen to the system theme change.
   *
   * @example
   * ```typescript
   * import { appWindow } from "@tauri-apps/api/window";
   * const unlisten = await appWindow.onThemeChanged(({ payload: theme }) => {
   *  console.log('New theme: ' + theme);
   * });
   *
   * // you need to call unlisten if your handler goes out of scope e.g. the component is unmounted
   * unlisten();
   * ```
   *
   * @returns A promise resolving to a function to unlisten to the event.
   * Note that removing the listener is required if your listener goes out of scope e.g. the component is unmounted.
   *
   * @since 1.0.2
   */
  onThemeChanged(handler) {
    return __async(this, null, function* () {
      return this.listen(TauriEvent.WINDOW_THEME_CHANGED, handler);
    });
  }
};
var CloseRequestedEvent = class {
  constructor(event) {
    this._preventDefault = false;
    this.event = event.event;
    this.windowLabel = event.windowLabel;
    this.id = event.id;
  }
  preventDefault() {
    this._preventDefault = true;
  }
  isPreventDefault() {
    return this._preventDefault;
  }
};
var WebviewWindow = class _WebviewWindow extends WindowManager {
  /**
   * Creates a new WebviewWindow.
   * @example
   * ```typescript
   * import { WebviewWindow } from '@tauri-apps/api/window';
   * const webview = new WebviewWindow('my-label', {
   *   url: 'https://github.com/tauri-apps/tauri'
   * });
   * webview.once('tauri://created', function () {
   *  // webview window successfully created
   * });
   * webview.once('tauri://error', function (e) {
   *  // an error happened creating the webview window
   * });
   * ```
   *
   * * @param label The unique webview window label. Must be alphanumeric: `a-zA-Z-/:_`.
   * @returns The WebviewWindow instance to communicate with the webview.
   */
  constructor(label, options = {}) {
    super(label);
    if (!(options === null || options === void 0 ? void 0 : options.skip)) {
      invokeTauriCommand({
        __tauriModule: "Window",
        message: {
          cmd: "createWebview",
          data: {
            options: __spreadValues({
              label
            }, options)
          }
        }
      }).then(() => __async(this, null, function* () {
        return this.emit("tauri://created");
      })).catch((e) => __async(this, null, function* () {
        return this.emit("tauri://error", e);
      }));
    }
  }
  /**
   * Gets the WebviewWindow for the webview associated with the given label.
   * @example
   * ```typescript
   * import { WebviewWindow } from '@tauri-apps/api/window';
   * const mainWindow = WebviewWindow.getByLabel('main');
   * ```
   *
   * @param label The webview window label.
   * @returns The WebviewWindow instance to communicate with the webview or null if the webview doesn't exist.
   */
  static getByLabel(label) {
    if (getAll().some((w) => w.label === label)) {
      return new _WebviewWindow(label, { skip: true });
    }
    return null;
  }
  /**
   *  Gets the focused window.
   * @example
   * ```typescript
   * import { WebviewWindow } from '@tauri-apps/api/window';
   * const focusedWindow = WebviewWindow.getFocusedWindow();
   * ```
   *
   * @returns The WebviewWindow instance to communicate with the webview or `undefined` if there is not any focused window.
   *
   * @since 1.4
   */
  static getFocusedWindow() {
    return __async(this, null, function* () {
      for (const w of getAll()) {
        if (yield w.isFocused()) {
          return w;
        }
      }
      return null;
    });
  }
};
var appWindow;
if ("__TAURI_METADATA__" in window) {
  appWindow = new WebviewWindow(window.__TAURI_METADATA__.__currentWindow.label, {
    // @ts-expect-error `skip` is not defined in the public API but it is handled by the constructor
    skip: true
  });
} else {
  console.warn(`Could not find "window.__TAURI_METADATA__". The "appWindow" value will reference the "main" window label.
Note that this is not an issue if running this frontend on a browser instead of a Tauri window.`);
  appWindow = new WebviewWindow("main", {
    // @ts-expect-error `skip` is not defined in the public API but it is handled by the constructor
    skip: true
  });
}
function mapMonitor(m) {
  return m === null ? null : {
    name: m.name,
    scaleFactor: m.scaleFactor,
    position: mapPhysicalPosition(m.position),
    size: mapPhysicalSize(m.size)
  };
}
function mapPhysicalPosition(m) {
  return new PhysicalPosition(m.x, m.y);
}
function mapPhysicalSize(m) {
  return new PhysicalSize(m.width, m.height);
}
function currentMonitor() {
  return __async(this, null, function* () {
    return invokeTauriCommand({
      __tauriModule: "Window",
      message: {
        cmd: "manage",
        data: {
          cmd: {
            type: "currentMonitor"
          }
        }
      }
    }).then(mapMonitor);
  });
}
function primaryMonitor() {
  return __async(this, null, function* () {
    return invokeTauriCommand({
      __tauriModule: "Window",
      message: {
        cmd: "manage",
        data: {
          cmd: {
            type: "primaryMonitor"
          }
        }
      }
    }).then(mapMonitor);
  });
}
function availableMonitors() {
  return __async(this, null, function* () {
    return invokeTauriCommand({
      __tauriModule: "Window",
      message: {
        cmd: "manage",
        data: {
          cmd: {
            type: "availableMonitors"
          }
        }
      }
    }).then((ms) => ms.map(mapMonitor));
  });
}
export {
  CloseRequestedEvent,
  LogicalPosition,
  LogicalSize,
  PhysicalPosition,
  PhysicalSize,
  UserAttentionType,
  WebviewWindow,
  WebviewWindowHandle,
  WindowManager,
  appWindow,
  availableMonitors,
  currentMonitor,
  getAll,
  getCurrent,
  primaryMonitor
};
//# sourceMappingURL=@tauri-apps_api_window.js.map
