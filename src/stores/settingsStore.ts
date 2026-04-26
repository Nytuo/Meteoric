import { create } from 'zustand';
import { invoke } from '@tauri-apps/api/core';
import type { ISettings } from '@/types';
import { db } from '@/lib/db';
import { toast } from 'sonner';
import i18n from '@/i18n';

const ACCENT_CLASSES = [
  'accent-blue',
  'accent-purple',
  'accent-green',
  'accent-teal',
  'accent-orange',
  'accent-red',
];

function applyThemeClasses(theme: string, accent: string) {
  const html = document.documentElement;
  if (theme === 'dark') {
    html.classList.add('dark');
  } else {
    html.classList.remove('dark');
  }
  ACCENT_CLASSES.forEach((c) => html.classList.remove(c));
  if (accent && accent !== 'default') {
    html.classList.add(`accent-${accent}`);
  }
}

interface SettingsStore {
  settings: ISettings;
  apiKeys: Record<string, string>;

  fetchSettings: () => Promise<void>;
  updateSettings: (patch: Partial<ISettings>) => void;
  applySettings: (settings: ISettings) => void;
  changeLanguage: (lang: string) => void;
  changeTheme: (theme: string) => void;
  changeAccent: (accent: string) => void;
  fetchApiKeys: () => Promise<void>;
  setApiKey: (key: string, value: string) => void;
  saveApiKeys: () => Promise<void>;
}

export const useSettingsStore = create<SettingsStore>((set, get) => ({
  settings: {},
  apiKeys: {},

  async fetchSettings() {
    try {
      const settings = await db.getSettings();
      if (settings.gap !== undefined) settings.gap = settings.gap.toString();
      else settings.gap = '10';

      if (settings.zoom !== undefined) settings.zoom = settings.zoom.toString();
      else settings.zoom = '10';

      set({ settings });

      i18n.changeLanguage(settings.language || 'en');

      applyThemeClasses(settings.theme || 'dark', settings.accent || 'default');
    } catch {
      toast.error('Failed to load settings');
    }
  },

  updateSettings(patch) {
    set({ settings: { ...get().settings, ...patch } });
  },

  applySettings(settings) {
    set({ settings });
    db.setSettings(settings);
    applyThemeClasses(settings.theme || 'dark', settings.accent || 'default');
    toast.success('Settings saved');
  },

  changeLanguage(lang) {
    i18n.changeLanguage(lang);
    const s = { ...get().settings, language: lang };
    set({ settings: s });
    db.setSettings(s);
  },

  changeTheme(theme) {
    const s = { ...get().settings, theme };
    set({ settings: s });
    db.setSettings(s);
    applyThemeClasses(theme, s.accent || 'default');
  },

  changeAccent(accent) {
    const s = { ...get().settings, accent };
    set({ settings: s });
    db.setSettings(s);
    applyThemeClasses(s.theme || 'dark', accent);
  },

  async fetchApiKeys() {
    try {
      const res = await invoke<Record<string, string>>('get_env_map');
      set({ apiKeys: res });
    } catch {}
  },

  setApiKey(key, value) {
    set({ apiKeys: { ...get().apiKeys, [key]: value } });
  },

  async saveApiKeys() {
    try {
      await invoke('set_env_map', { envMap: get().apiKeys });
      toast.success('API keys saved');
    } catch (e: any) {
      toast.error('Failed to save API keys: ' + e);
    }
  },
}));
