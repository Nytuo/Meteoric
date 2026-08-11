import { create } from 'zustand';

export interface PlayniteImportProgress {
  percent: number;
  current: number;
  total: number;
  label: string;
}

export interface PlayniteImportSummary {
  imported: number;
  alreadyPresent: number;
  needsRelink: number;
  total: number;
}

interface PlayniteStore {
  importing: boolean;
  progress: PlayniteImportProgress | null;
  summary: PlayniteImportSummary | null;
  warnings: string[];
  igdbStatus: string | null;

  setImporting: (importing: boolean) => void;
  setProgress: (progress: PlayniteImportProgress | null) => void;
  setSummary: (summary: PlayniteImportSummary | null) => void;
  addWarning: (warning: string) => void;
  setIgdbStatus: (status: string | null) => void;
  reset: () => void;
}

export const usePlayniteStore = create<PlayniteStore>((set) => ({
  importing: false,
  progress: null,
  summary: null,
  warnings: [],
  igdbStatus: null,

  setImporting: (importing) => set({ importing }),
  setProgress: (progress) => set({ progress }),
  setSummary: (summary) => set({ summary }),
  addWarning: (warning) =>
    set((state) => ({ warnings: [...state.warnings, warning].slice(-50) })),
  setIgdbStatus: (igdbStatus) => set({ igdbStatus }),
  reset: () =>
    set({ progress: null, summary: null, warnings: [], igdbStatus: null }),
}));
