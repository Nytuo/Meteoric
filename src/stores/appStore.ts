import { create } from "zustand";
import { invoke } from "@tauri-apps/api/core";

interface AppStore {
	sidebarOpen: boolean;
	blockUI: boolean;
	gameLaunching: boolean;
	achievementsVisible: boolean;
	alreadyLaunched: boolean;

	setSidebarOpen: (open: boolean) => void;
	changeSidebarOpen: (open: boolean) => void;
	setBlockUI: (block: boolean) => void;
	changeBlockUI: (block: boolean) => void;
	setGameLaunching: (launching: boolean) => void;
	toggleAchievements: () => void;
	toggleAchievementsVisible: () => void;
	setAlreadyLaunched: () => void;

	// Audio
	playBGMusic: (src: string) => void;
	stopBGMusic: () => void;
	isMusicPlaying: () => boolean;
	stopAllAudio: () => void;

	// Tauri
	startRoutine: () => void;
	getAppVersion: () => Promise<string>;
	downloadYTAudio: (url: string, id: string) => Promise<void>;
}

let audio: HTMLAudioElement | null = null;
let fadingAudio: HTMLAudioElement | null = null;
let fadeInterval: ReturnType<typeof setInterval> | undefined;

export const useAppStore = create<AppStore>((set, get) => ({
	sidebarOpen: true,
	blockUI: false,
	gameLaunching: false,
	achievementsVisible: false,
	alreadyLaunched: false,

	setSidebarOpen: (open) => set({ sidebarOpen: open }),
	changeSidebarOpen: (open) => set({ sidebarOpen: open }),
	setBlockUI: (block) => set({ blockUI: block }),
	changeBlockUI: (block) => set({ blockUI: block }),
	setGameLaunching: (launching) => set({ gameLaunching: launching }),
	toggleAchievements: () => set((s) => ({ achievementsVisible: !s.achievementsVisible })),
	toggleAchievementsVisible: () => set((s) => ({ achievementsVisible: !s.achievementsVisible })),
	setAlreadyLaunched: () => set({ alreadyLaunched: true }),

	playBGMusic(src) {
		if (!src) return;
		// Stop any in-progress fade immediately so its element doesn't keep playing
		if (fadeInterval) { clearInterval(fadeInterval); fadeInterval = undefined; }
		if (fadingAudio) { fadingAudio.pause(); fadingAudio = null; }
		if (audio) { audio.pause(); audio = null; }
		audio = new Audio(src);
		audio.loop = true;
		audio.volume = 1;
		audio.play();
	},

	stopBGMusic() {
		if (!audio) return;
		if (fadeInterval) { clearInterval(fadeInterval); fadeInterval = undefined; }
		// Move the playing element to fadingAudio so playBGMusic can still reach it
		fadingAudio = audio;
		audio = null;
		const target = fadingAudio;
		const STEPS = 20; // 20 × 50 ms = 1 s
		let step = 0;
		fadeInterval = setInterval(() => {
			step++;
			target.volume = Math.max(0, 1 - step / STEPS);
			if (step >= STEPS) {
				clearInterval(fadeInterval);
				fadeInterval = undefined;
				target.pause();
				if (fadingAudio === target) fadingAudio = null;
			}
		}, 50);
	},

	isMusicPlaying() {
		return !!audio && !audio.paused;
	},

	stopAllAudio() {
		get().stopBGMusic();
	},

	startRoutine() {
		invoke("startup_routine").catch(() => {});
	},

	async getAppVersion() {
		return invoke<string>("get_app_version");
	},

	async downloadYTAudio(url, id) {
		await invoke<string>("download_yt_audio", { url, id });
	},
}));
