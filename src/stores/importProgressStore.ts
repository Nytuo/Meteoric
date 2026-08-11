import { create } from 'zustand';

export type ImporterId = 'steam' | 'gog' | 'epic' | 'csv';

export interface ImportProgress {
  percent: number;
  current: number;
  total: number;
  label: string;
}

interface ImportProgressStore {
  progress: Partial<Record<ImporterId, ImportProgress | null>>;
  setProgress: (importer: ImporterId, progress: ImportProgress | null) => void;
  clear: (importer: ImporterId) => void;
}

export const useImportProgressStore = create<ImportProgressStore>((set) => ({
  progress: {},
  setProgress: (importer, progress) =>
    set((state) => ({ progress: { ...state.progress, [importer]: progress } })),
  clear: (importer) =>
    set((state) => ({ progress: { ...state.progress, [importer]: null } })),
}));
