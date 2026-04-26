import { create } from 'zustand';
import { invoke } from '@tauri-apps/api/core';

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

  playBGMusic: (src: string) => void;
  stopBGMusic: () => void;
  isMusicPlaying: () => boolean;
  stopAllAudio: () => void;
  playSFX: (src: string) => void;

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
  toggleAchievements: () =>
    set((s) => ({ achievementsVisible: !s.achievementsVisible })),
  toggleAchievementsVisible: () =>
    set((s) => ({ achievementsVisible: !s.achievementsVisible })),
  setAlreadyLaunched: () => set({ alreadyLaunched: true }),

  playBGMusic(src) {
    if (!src) return;

    if (fadeInterval) {
      clearInterval(fadeInterval);
      fadeInterval = undefined;
    }
    if (fadingAudio) {
      fadingAudio.pause();
      fadingAudio = null;
    }
    if (audio) {
      audio.pause();
      audio = null;
    }
    audio = new Audio(src);
    audio.loop = true;
    audio.volume = 0.4;
    audio.play();
  },

  stopBGMusic() {
    if (!audio) return;
    if (fadeInterval) {
      clearInterval(fadeInterval);
      fadeInterval = undefined;
    }

    fadingAudio = audio;
    audio = null;
    const target = fadingAudio;
    const STEPS = 20;
    let step = 0;
    fadeInterval = setInterval(() => {
      step++;
      target.volume = Math.max(0, 0.4 - (step / STEPS) * 0.4);
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

  playSFX(src) {
    if (!src) return;
    const sfx = new Audio(src);
    sfx.volume = 0.8;
    sfx.play().catch(() => {});
  },

  startRoutine() {
    invoke('startup_routine').catch(() => {});
  },

  async getAppVersion() {
    return invoke<string>('get_app_version');
  },

  async downloadYTAudio(url, id) {
    await invoke<string>('download_yt_audio', { url, id });
  },
}));
