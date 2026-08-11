import { useEffect } from 'react';
import { listen } from '@tauri-apps/api/event';
import { create } from 'zustand';
import type { IGameLaunchedMessage } from '@/types';
import { toast } from 'sonner';
import { useEpicStore } from '@/stores/epicStore';
import { useGameStore } from '@/stores/gameStore';
import { usePlayniteStore } from '@/stores/playniteStore';
import {
  useImportProgressStore,
  type ImporterId,
} from '@/stores/importProgressStore';
import { useIgdbLookupStore } from '@/stores/igdbLookupStore';

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
  setMessage: (msg) =>
    set({
      gameLaunchMessage: msg,
      gamePID: msg.gamePID,
      isGameRunning: !msg.isEnded && msg.gamePID > 0,
    }),
}));

export function useTauriListener() {
  useEffect(() => {
    const unlisten = listen('frontend-message', (event) => {
      const payload = event.payload as string;
      if (payload.includes('GL')) {
        const isEnd = payload.includes('END');
        const isError = payload.startsWith('E-');
        let gamePID = isEnd
          ? parseInt(payload.split('GL-END-')[1], 10)
          : parseInt(payload.split('GL-')[1], 10);
        if (isEnd && !isError) gamePID = 0;
        useTauriEventStore.getState().setMessage({
          gamePID,
          isEnded: isEnd,
          isError: isError,
        });
        return;
      }

      if (payload.startsWith('[EPIC-DL-PROGRESS]')) {
        const raw = payload.slice('[EPIC-DL-PROGRESS]'.length);
        const parts = raw.split('|');
        const percent = parseFloat(parts[0]) || 0;
        const speed = parts[1] ?? '';
        const eta = parts[2] ?? '';
        const appName = parts[3] ?? '';
        useEpicStore
          .getState()
          .setDownloadProgress({ percent, speed, eta, appName });
        return;
      }

      if (payload.startsWith('[EPIC-DL-UNINSTALL]')) {
        const appName = payload.slice('[EPIC-DL-UNINSTALL]'.length);
        console.log(
          `[EPIC] Uninstall complete for ${appName}, refreshing UI...`
        );

        useEpicStore.getState().fetchDownloadableGames();
        useEpicStore.getState().fetchInstalledGames();

        useGameStore.getState().fetchGames();
        return;
      }

      if (payload.startsWith('[EPIC-DL-COMPLETE]')) {
        const appName = payload.slice('[EPIC-DL-COMPLETE]'.length);
        console.log(`[EPIC] Install complete for ${appName}, refreshing UI...`);

        useEpicStore.getState().fetchDownloadableGames();
        useEpicStore.getState().fetchInstalledGames();

        useGameStore.getState().fetchGames();
        return;
      }

      if (payload.startsWith('[GOG-V2-')) {
        return;
      }

      if (payload.startsWith('[IMPORT-PROGRESS]')) {
        const raw = payload.slice('[IMPORT-PROGRESS]'.length);
        const [importer, percent, current, total, label] = raw.split('|');
        useImportProgressStore.getState().setProgress(importer as ImporterId, {
          percent: parseFloat(percent) || 0,
          current: parseInt(current, 10) || 0,
          total: parseInt(total, 10) || 0,
          label: label ?? '',
        });
        return;
      }

      if (payload.startsWith('[IMPORT-DONE]')) {
        const importer = payload.slice('[IMPORT-DONE]'.length) as ImporterId;
        useImportProgressStore.getState().clear(importer);
        return;
      }

      if (payload.startsWith('[PLAYNITE-IMPORT-PROGRESS]')) {
        const raw = payload.slice('[PLAYNITE-IMPORT-PROGRESS]'.length);
        const [percent, current, total, label] = raw.split('|');
        usePlayniteStore.getState().setProgress({
          percent: parseFloat(percent) || 0,
          current: parseInt(current, 10) || 0,
          total: parseInt(total, 10) || 0,
          label: label ?? '',
        });
        return;
      }

      if (payload.startsWith('[PLAYNITE-IMPORT-DONE]')) {
        const raw = payload.slice('[PLAYNITE-IMPORT-DONE]'.length);
        const [imported, alreadyPresent, needsRelink, total] = raw.split('|');
        usePlayniteStore.getState().setSummary({
          imported: parseInt(imported, 10) || 0,
          alreadyPresent: parseInt(alreadyPresent, 10) || 0,
          needsRelink: parseInt(needsRelink, 10) || 0,
          total: parseInt(total, 10) || 0,
        });
        usePlayniteStore.getState().setImporting(false);
        useGameStore.getState().fetchGames();
        return;
      }

      if (payload.startsWith('[PLAYNITE-IMPORT-WARN]')) {
        usePlayniteStore
          .getState()
          .addWarning(payload.slice('[PLAYNITE-IMPORT-WARN]'.length));
        return;
      }

      if (payload.startsWith('[PLAYNITE-IMPORT-INFO]')) {
        usePlayniteStore
          .getState()
          .setIgdbStatus(payload.slice('[PLAYNITE-IMPORT-INFO]'.length));
        return;
      }

      if (payload.startsWith('[IGDB-LOOKUP-PROGRESS]')) {
        const raw = payload.slice('[IGDB-LOOKUP-PROGRESS]'.length);
        const [current, total] = raw.split('|');
        useIgdbLookupStore.getState().setProgress({
          current: parseInt(current, 10) || 0,
          total: parseInt(total, 10) || 0,
        });
        return;
      }

      if (
        payload.startsWith('[GOG-DL-INFO]') ||
        payload.startsWith('[GOG-DL-PROGRESS]') ||
        payload.startsWith('[GOG-CLOUD]') ||
        payload.startsWith('[GOG-ACH]') ||
        payload.startsWith('[GOG-LAUNCH]') ||
        payload.startsWith('[GOG-INFO]')
      ) {
        console.log(payload);
        return;
      }

      const match = payload.match(/\[([^\]]+)\](.*)/);
      if (match) {
        const params = match[1].split('-');
        const title = params[0];
        const type = params[1];
        const content = match[2];
        if (type === 'error') toast.error(`${title}: ${content}`);
        else if (type === 'success') toast.success(`${title}: ${content}`);
        else toast.info(`${title}: ${content}`);
      }
    });

    return () => {
      unlisten.then((fn) => fn());
    };
  }, []);
}
