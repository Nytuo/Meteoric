import { create } from 'zustand';
import { invoke } from '@tauri-apps/api/core';
import { toast } from 'sonner';

interface SteamStore {
  syncAchievements: (gameId: string, appId: string) => Promise<number>;
}

export const useSteamStore = create<SteamStore>(() => ({
  async syncAchievements(gameId: string, appId: string) {
    try {
      const count = await invoke<number>('steam_sync_achievements', {
        gameId,
        appId,
      });
      toast.success(`Synced ${count} achievements`);
      return count;
    } catch (e: any) {
      toast.error('Achievement sync failed: ' + String(e));
      return 0;
    }
  },
}));
