import { create } from 'zustand';

export interface LibraryPosition {
  scrollTop: number;
  anchorId: string | null;
  anchorIndex: number;
  anchorOffset: number;
}

interface LibraryViewStore extends LibraryPosition {
  visibleCount: number;

  setPosition: (position: LibraryPosition) => void;
  setVisibleCount: (value: number) => void;
  reset: () => void;
}

const EMPTY: LibraryPosition = {
  scrollTop: 0,
  anchorId: null,
  anchorIndex: -1,
  anchorOffset: 0,
};

export const useLibraryViewStore = create<LibraryViewStore>((set) => ({
  ...EMPTY,
  visibleCount: 0,

  setPosition: (position) => set(position),
  setVisibleCount: (value) => set({ visibleCount: value }),
  reset: () => set({ ...EMPTY, visibleCount: 0 }),
}));
