import { create } from 'zustand';

export interface IgdbLookupProgress {
  current: number;
  total: number;
}

interface IgdbLookupStore {
  progress: IgdbLookupProgress | null;
  setProgress: (progress: IgdbLookupProgress | null) => void;
}

export const useIgdbLookupStore = create<IgdbLookupStore>((set) => ({
  progress: null,
  setProgress: (progress) => set({ progress }),
}));
