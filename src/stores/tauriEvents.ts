import { useEffect } from "react";
import { listen } from "@tauri-apps/api/event";
import { create } from "zustand";
import type { IGameLaunchedMessage } from "@/types";
import { toast } from "sonner";
import { useEpicStore } from "@/stores/epicStore";
import { useGameStore } from "@/stores/gameStore";

interface TauriEventStore {
	gameLaunchMessage: IGameLaunchedMessage;
	gamePID: number;
	isGameRunning: boolean;
	setMessage: (msg: IGameLaunchedMessage) => void;
}

export const useTauriEventStore = create<TauriEventStore>((set) => ({
	gameLaunchMessage: { gamePID: 0 },
	gamePID: 0,
	isGameRunning: false,
	setMessage: (msg) => set({
		gameLaunchMessage: msg,
		gamePID: msg.gamePID,
		isGameRunning: !msg.isEnded && msg.gamePID > 0,
	}),
}));

export function useTauriListener() {
	useEffect(() => {
		const unlisten = listen("frontend-message", (event) => {
			const payload = event.payload as string;
			if (payload.includes("GL")) {
				const isEnd = payload.includes("END");
				const isError = payload.startsWith("E-");
				let gamePID = isEnd
					? parseInt(payload.split("GL-END-")[1], 10)
					: parseInt(payload.split("GL-")[1], 10);
				if (isEnd && !isError) gamePID = 0;
				useTauriEventStore.getState().setMessage({
					gamePID,
					isEnded: isEnd,
					isError: isError,
				});
				return;
			}

			// Download progress — update store, never toast
			if (payload.startsWith("[EPIC-DL-PROGRESS]")) {
				// format: [EPIC-DL-PROGRESS]{percent}%|{speed} MB/s|ETA: {eta}s|{appName}
				const raw = payload.slice("[EPIC-DL-PROGRESS]".length);
				const parts = raw.split("|");
				const percent = parseFloat(parts[0]) || 0;
				const speed = parts[1] ?? "";
				const eta = parts[2] ?? "";
				const appName = parts[3] ?? "";
				useEpicStore.getState().setDownloadProgress({ percent, speed, eta, appName });
				return;
			}

			// Uninstall complete — refresh game lists
			if (payload.startsWith("[EPIC-DL-UNINSTALL]")) {
				const appName = payload.slice("[EPIC-DL-UNINSTALL]".length);
				console.log(`[EPIC] Uninstall complete for ${appName}, refreshing UI...`);
				// Refresh Epic store
				useEpicStore.getState().fetchDownloadableGames();
				useEpicStore.getState().fetchInstalledGames();
				// Refresh main game store to update UI
				useGameStore.getState().fetchGames();
				return;
			}

			// Download/install complete — refresh game lists
			if (payload.startsWith("[EPIC-DL-COMPLETE]")) {
				const appName = payload.slice("[EPIC-DL-COMPLETE]".length);
				console.log(`[EPIC] Install complete for ${appName}, refreshing UI...`);
				// Refresh Epic store
				useEpicStore.getState().fetchDownloadableGames();
				useEpicStore.getState().fetchInstalledGames();
				// Refresh main game store to update UI
				useGameStore.getState().fetchGames();
				return;
			}

			// GOG V2 messages — handled in gogStore, skip toast here
			if (payload.startsWith("[GOG-V2-")) {
				// These are handled by the gogStore listener:
				// - [GOG-V2-PROGRESS] updates download progress in store
				// - [GOG-V2-INFO] logs to console only
				// - [GOG-V2-COMPLETE] shows success toast in gogStore
				return;
			}

			// GOG informational messages — log only, no toast
			if (
				payload.startsWith("[GOG-DL-INFO]") ||
				payload.startsWith("[GOG-DL-PROGRESS]") ||
				payload.startsWith("[GOG-CLOUD]") ||
				payload.startsWith("[GOG-ACH]") ||
				payload.startsWith("[GOG-LAUNCH]") ||
				payload.startsWith("[GOG-INFO]")
			) {
				console.log(payload);
				return;
			}

			// Generic notification
			const match = payload.match(/\[([^\]]+)\](.*)/);
			if (match) {
				const params = match[1].split("-");
				const title = params[0];
				const type = params[1];
				const content = match[2];
				if (type === "error") toast.error(`${title}: ${content}`);
				else if (type === "success") toast.success(`${title}: ${content}`);
				else toast.info(`${title}: ${content}`);
			}
		});

		return () => {
			unlisten.then((fn) => fn());
		};
	}, []);
}
