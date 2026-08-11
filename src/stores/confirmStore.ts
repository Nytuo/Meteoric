import { create } from 'zustand';

export interface ConfirmOptions {
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
}

interface ConfirmState extends ConfirmOptions {
  open: boolean;
  resolve: ((value: boolean) => void) | null;
  confirm: (options: ConfirmOptions) => Promise<boolean>;
  handleConfirm: () => void;
  handleCancel: () => void;
}

export const useConfirmStore = create<ConfirmState>((set, get) => ({
  open: false,
  title: '',
  description: undefined,
  confirmLabel: undefined,
  cancelLabel: undefined,
  destructive: true,
  resolve: null,

  confirm: (options) => {
    return new Promise<boolean>((resolve) => {
      get().resolve?.(false);
      set({ ...options, open: true, resolve });
    });
  },

  handleConfirm: () => {
    get().resolve?.(true);
    set({ open: false, resolve: null });
  },

  handleCancel: () => {
    get().resolve?.(false);
    set({ open: false, resolve: null });
  },
}));
