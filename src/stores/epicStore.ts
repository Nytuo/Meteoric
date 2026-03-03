import { create } from "zustand";
import { invoke } from "@tauri-apps/api/core";
import { toast } from "sonner";

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────

export interface EpicGameEntry {
	app_name: string;
	title: string;
	namespace: string;
	catalog_item_id: string;
	build_version: string;
	install_size: number | null;
	is_installed: boolean;
	installed_version: string | null;
	has_update: boolean;
	cloud_saves_supported: boolean;
}

export interface InstalledEpicGame {
	app_name: string;
	install_path: string;
	title: string;
	version: string;
	executable: string;
	install_size: number;
	manifest_path: string;
	namespace: string;
	catalog_item_id: string;
	can_run_offline: boolean;
	requires_ownership_token: boolean;
	platform: string;
	cloud_save_folder: string | null;
	cloud_save_folder_mac: string | null;
	launch_parameters: string | null;
}

export interface CloudSaveInfo {
	app_name: string;
	local_path: string | null;
	status: "NoSave" | "LocalNewer" | "RemoteNewer" | "SameAge" | "Conflict";
}

export interface DownloadProgress {
	percent: number;
	speed: string;
	eta: string;
	appName: string;
}

// ──────────────────────────────────────────────
// Store
// ──────────────────────────────────────────────

interface EpicStore {
	loggedIn: boolean;
	displayName: string;
	downloadableGames: EpicGameEntry[];
	installedGames: InstalledEpicGame[];
	downloadingGame: string | null; // app_name currently downloading
	downloadProgress: DownloadProgress | null;
	loadingGames: boolean;

	setDownloadProgress: (progress: DownloadProgress | null) => void;

	checkLoginStatus: () => Promise<void>;
	fetchDownloadableGames: () => Promise<void>;
	fetchInstalledGames: () => Promise<void>;
	downloadGame: (appName: string, installPath: string) => Promise<void>;
	updateGame: (appName: string) => Promise<void>;
	uninstallGame: (appName: string) => Promise<void>;
	launchGame: (appName: string, offline?: boolean) => Promise<number>;
	checkCloudSaves: (appName: string) => Promise<CloudSaveInfo>;
	uploadSaves: (appName: string) => Promise<void>;
	downloadSaves: (appName: string) => Promise<void>;
	deleteCloudSaves: (appName: string) => Promise<void>;
	syncAchievements: (gameId: string, appName: string, namespace: string) => Promise<number>;
}

export const useEpicStore = create<EpicStore>((set) => ({
	loggedIn: false,
	displayName: "",
	downloadableGames: [],
	installedGames: [],
	downloadingGame: null,
	downloadProgress: null,
	loadingGames: false,

	setDownloadProgress(progress) {
		set({ downloadProgress: progress });
	},

	async checkLoginStatus() {
		try {
			const loggedIn = await invoke<boolean>("epic_is_logged_in");
			let displayName = "";
			if (loggedIn) {
				displayName = await invoke<string>("epic_get_display_name");
			}
			set({ loggedIn, displayName });
		} catch {
			set({ loggedIn: false, displayName: "" });
		}
	},

	async fetchDownloadableGames() {
		set({ loadingGames: true });
		try {
			const raw = await invoke<string>("epic_get_downloadable_games");
			const games: EpicGameEntry[] = JSON.parse(raw);
			set({ downloadableGames: games });
		} catch (e: any) {
			toast.error("Failed to fetch Epic games: " + String(e));
		} finally {
			set({ loadingGames: false });
		}
	},

	async fetchInstalledGames() {
		try {
			const raw = await invoke<string>("epic_get_installed_games");
			const games: InstalledEpicGame[] = JSON.parse(raw);
			set({ installedGames: games });
		} catch (e: any) {
			toast.error("Failed to fetch installed Epic games: " + String(e));
		}
	},

	async downloadGame(appName: string, installPath: string) {
		set({ downloadingGame: appName, downloadProgress: null });
		try {
			await invoke("epic_download_game", { appName, installPath });
			toast.success(`${appName} installed successfully`);
			// Refresh lists
			const raw = await invoke<string>("epic_get_downloadable_games");
			const dlGames: EpicGameEntry[] = JSON.parse(raw);
			const raw2 = await invoke<string>("epic_get_installed_games");
			const instGames: InstalledEpicGame[] = JSON.parse(raw2);
			set({ downloadableGames: dlGames, installedGames: instGames });
		} catch (e: any) {
			toast.error("Download failed: " + String(e));
		} finally {
			set({ downloadingGame: null, downloadProgress: null });
		}
	},

	async updateGame(appName: string) {
		set({ downloadingGame: appName });
		try {
			await invoke("epic_update_game", { appName });
			toast.success(`${appName} updated`);
			const raw = await invoke<string>("epic_get_downloadable_games");
			const dlGames: EpicGameEntry[] = JSON.parse(raw);
			set({ downloadableGames: dlGames });
		} catch (e: any) {
			toast.error("Update failed: " + String(e));
		} finally {
			set({ downloadingGame: null });
		}
	},

	async uninstallGame(appName: string) {
		try {
			await invoke("epic_uninstall_game", { appName });
			toast.success(`${appName} uninstalled`);
			const raw = await invoke<string>("epic_get_downloadable_games");
			const dlGames: EpicGameEntry[] = JSON.parse(raw);
			const raw2 = await invoke<string>("epic_get_installed_games");
			const instGames: InstalledEpicGame[] = JSON.parse(raw2);
			set({ downloadableGames: dlGames, installedGames: instGames });
		} catch (e: any) {
			toast.error("Uninstall failed: " + String(e));
		}
	},

	async launchGame(appName: string, offline = false) {
		// Stop background music when launching a game
		const { useAppStore } = await import("@/stores/appStore");
		useAppStore.getState().stopBGMusic();

		try {
			const pid = await invoke<number>("epic_launch_game", {
				appName,
				offline,
				extraArgs: [],
			});
			toast.success(`${appName} launched (PID: ${pid})`);
			return pid;
		} catch (e: any) {
			toast.error("Launch failed: " + String(e));
			return 0;
		}
	},

	async checkCloudSaves(appName: string) {
		const raw = await invoke<string>("epic_cloud_save_status", { appName });
		return JSON.parse(raw) as CloudSaveInfo;
	},

	async uploadSaves(appName: string) {
		try {
			await invoke("epic_upload_saves", { appName });
			toast.success("Saves uploaded");
		} catch (e: any) {
			toast.error("Upload failed: " + String(e));
		}
	},

	async downloadSaves(appName: string) {
		try {
			await invoke("epic_download_saves", { appName });
			toast.success("Saves downloaded");
		} catch (e: any) {
			toast.error("Download failed: " + String(e));
		}
	},

	async deleteCloudSaves(appName: string) {
		try {
			await invoke("epic_delete_cloud_saves", { appName });
			toast.success("Cloud saves deleted");
		} catch (e: any) {
			toast.error("Delete failed: " + String(e));
		}
	},

	async syncAchievements(gameId: string, appName: string, namespace: string) {
		try {
			const count = await invoke<number>("epic_sync_achievements", {
				gameId,
				appName,
				namespace,
			});
			toast.success(`Synced ${count} achievements`);
			return count;
		} catch (e: any) {
			toast.error("Achievement sync failed: " + String(e));
			return 0;
		}
	},

	async debugCacheInfo() {
		const info = await invoke<string>("epic_debug_cache_info");
		console.log("=== EPIC CACHE DEBUG INFO ===");
		console.log(info);
		return info;
	},

	async reloadCache() {
		try {
			const count = await invoke<number>("epic_reload_cache");
			console.log(`[EPIC] Reloaded cache: ${count} games`);
			return count;
		} catch (e: any) {
			console.error("Failed to reload cache:", e);
			throw e;
		}
	},
}));
