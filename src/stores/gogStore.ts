import { create } from "zustand";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { toast } from "sonner";

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────

export interface GogGameEntry {
	game_id: string;
	title: string;
	is_installed: boolean;
	installed_version: string | null;
	has_update: boolean;
	cloud_saves_supported: boolean;
	background_image: string | null;
	cd_key: string | null;
}

export interface InstalledGogGame {
	game_id: string;
	install_path: string;
	title: string;
	version: string;
	executable: string;
	install_size: number;
	platform: string;
	cloud_save_folder: string | null;
	launch_parameters: string | null;
	working_dir: string | null;
}

export interface GogCloudSaveInfo {
	game_id: string;
	local_save_path: string | null;
	remote_save_exists: boolean;
	status: "NoSave" | "LocalNewer" | "RemoteNewer" | "SameAge" | "Conflict";
	local_timestamp: string | null;
	remote_timestamp: string | null;
}

// ──────────────────────────────────────────────
// Store
// ──────────────────────────────────────────────

export interface GogDownloadProgress {
	percent: number;
	currentFile: string;
}

interface GogStore {
	loggedIn: boolean;
	displayName: string;
	downloadableGames: GogGameEntry[];
	installedGames: InstalledGogGame[];
	downloadingGame: string | null;
	downloadProgress: GogDownloadProgress | null;
	loadingGames: boolean;

	checkLoginStatus: () => Promise<void>;
	fetchDownloadableGames: () => Promise<void>;
	fetchInstalledGames: () => Promise<void>;
	downloadGame: (gameId: string, installPath: string) => Promise<void>;
	uninstallGame: (gameId: string) => Promise<void>;
	launchGame: (gameId: string) => Promise<number>;
	checkCloudSaves: (gameId: string, localSavePath?: string) => Promise<GogCloudSaveInfo>;
	uploadSaves: (gameId: string, localSavePath: string) => Promise<void>;
	downloadSaves: (gameId: string, localSavePath: string) => Promise<void>;
	syncAchievements: (gameId: string, productId: string) => Promise<number>;
}

export const useGogStore = create<GogStore>((set) => ({
	loggedIn: false,
	displayName: "",
	downloadableGames: [],
	installedGames: [],
	downloadingGame: null,
	downloadProgress: null,
	loadingGames: false,

	async checkLoginStatus() {
		try {
			const loggedIn = await invoke<boolean>("gog_is_logged_in");
			let displayName = "";
			if (loggedIn) {
				displayName = await invoke<string>("gog_get_display_name");
			}
			set({ loggedIn, displayName });
		} catch {
			set({ loggedIn: false, displayName: "" });
		}
	},

	async fetchDownloadableGames() {
		set({ loadingGames: true });
		try {
			const raw = await invoke<string>("gog_get_downloadable_games");
			const games: GogGameEntry[] = JSON.parse(raw);
			set({ downloadableGames: games });
		} catch (e: any) {
			toast.error("Failed to fetch GOG games: " + String(e));
		} finally {
			set({ loadingGames: false });
		}
	},

	async fetchInstalledGames() {
		try {
			const raw = await invoke<string>("gog_get_installed_games");
			const games: InstalledGogGame[] = JSON.parse(raw);
			set({ installedGames: games });
		} catch (e: any) {
			toast.error("Failed to fetch installed GOG games: " + String(e));
		}
	},

	async downloadGame(gameId: string, installPath: string) {
		set({ downloadingGame: gameId, downloadProgress: { percent: 0, currentFile: "" } });
		
		// Listen for download progress events
		const unlisten = await listen<string>("frontend-message", (event) => {
			const message = event.payload;
			if (message.includes("[GOG-V2-PROGRESS]")) {
				// Format: [GOG-V2-PROGRESS]gameId|progress%|filename
				const parts = message.replace("[GOG-V2-PROGRESS]", "").split("|");
				const msgGameId = parts[0];
				const progress = parseFloat(parts[1] || "0");
				const filename = parts[2] || "";
				
				if (msgGameId === gameId) {
					set({ downloadProgress: { percent: progress, currentFile: filename } });
				}
			} else if (message.includes("[GOG-V2-INFO]")) {
				console.log("GOG:", message.replace("[GOG-V2-INFO] ", ""));
			} else if (message.includes("[GOG-V2-COMPLETE]")) {
				const completedGameId = message.replace("[GOG-V2-COMPLETE]", "");
				if (completedGameId === gameId) {
					toast.success("Game installed successfully!");
				}
			}
		});
		
		try {
			await invoke("gog_download_game", { gameId, installPath });
			// Download complete - refresh game lists
			try {
				const raw = await invoke<string>("gog_get_downloadable_games");
				const dlGames: GogGameEntry[] = JSON.parse(raw);
				const raw2 = await invoke<string>("gog_get_installed_games");
				const instGames: InstalledGogGame[] = JSON.parse(raw2);
				set({ downloadableGames: dlGames, installedGames: instGames });
			} catch (e: any) {
				// Log but don't fail - download already succeeded
				console.error("Failed to refresh game lists after download:", e);
			}
		} catch (e: any) {
			toast.error("Download failed: " + String(e));
		} finally {
			set({ downloadingGame: null, downloadProgress: null });
			unlisten();
		}
	},

	async uninstallGame(gameId: string) {
		try {
			await invoke("gog_uninstall_game", { gameId });
			toast.success("Game uninstalled");
			const raw = await invoke<string>("gog_get_downloadable_games");
			const dlGames: GogGameEntry[] = JSON.parse(raw);
			const raw2 = await invoke<string>("gog_get_installed_games");
			const instGames: InstalledGogGame[] = JSON.parse(raw2);
			set({ downloadableGames: dlGames, installedGames: instGames });
		} catch (e: any) {
			toast.error("Uninstall failed: " + String(e));
		}
	},

	async launchGame(gameId: string) {
		const { useAppStore } = await import("@/stores/appStore");
		useAppStore.getState().stopBGMusic();

		try {
			const pid = await invoke<number>("gog_launch_game", {
				gameId,
				extraArgs: [],
			});
			toast.success(`Game launched (PID: ${pid})`);
			return pid;
		} catch (e: any) {
			toast.error("Launch failed: " + String(e));
			return 0;
		}
	},

	async checkCloudSaves(gameId: string, localSavePath?: string) {
		const raw = await invoke<string>("gog_cloud_save_status", {
			gameId,
			localSavePath: localSavePath ?? null,
		});
		return JSON.parse(raw) as GogCloudSaveInfo;
	},

	async uploadSaves(gameId: string, localSavePath: string) {
		try {
			await invoke("gog_upload_saves", { gameId, localSavePath });
			toast.success("Saves uploaded to GOG cloud");
		} catch (e: any) {
			const errorMsg = String(e);
			if (errorMsg.includes("no client_id") || errorMsg.includes("does not have cloud save support")) {
				toast.error("This game does not support cloud saves");
			} else {
				toast.error("Cloud save upload failed: " + errorMsg);
			}
		}
	},

	async downloadSaves(gameId: string, localSavePath: string) {
		try {
			await invoke("gog_download_saves", { gameId, localSavePath });
			toast.success("Saves downloaded from GOG cloud");
		} catch (e: any) {
			const errorMsg = String(e);
			if (errorMsg.includes("no client_id") || errorMsg.includes("does not have cloud save support")) {
				toast.error("This game does not support cloud saves");
			} else {
				toast.error("Cloud save download failed: " + errorMsg);
			}
		}
	},

	async syncAchievements(gameId: string, productId: string) {
		try {
			const count = await invoke<number>("gog_sync_achievements", {
				gameId,
				productId,
			});
			toast.success(`Synced ${count} achievements`);
			return count;
		} catch (e: any) {
			toast.error("Achievement sync failed: " + String(e));
			return 0;
		}
	},
}));
