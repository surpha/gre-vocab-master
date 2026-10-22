import { create } from 'zustand';

export type SyncState = 'local' | 'idle' | 'syncing' | 'synced' | 'error';

interface UIState {
  searchOpen: boolean;
  detailWordId: number | null;
  accountOpen: boolean;
  userEmail: string | null;
  syncState: SyncState;
  setSearchOpen: (open: boolean) => void;
  openWordDetail: (wordId: number) => void;
  closeWordDetail: () => void;
  setAccountOpen: (open: boolean) => void;
  setUserEmail: (email: string | null) => void;
  setSyncState: (state: SyncState) => void;
}

export const useUIStore = create<UIState>()((set) => ({
  searchOpen: false,
  detailWordId: null,
  accountOpen: false,
  userEmail: null,
  syncState: 'local',
  setSearchOpen: (searchOpen) => set({ searchOpen }),
  openWordDetail: (detailWordId) => set({ detailWordId, searchOpen: false }),
  closeWordDetail: () => set({ detailWordId: null }),
  setAccountOpen: (accountOpen) => set({ accountOpen }),
  setUserEmail: (userEmail) => set({ userEmail }),
  setSyncState: (syncState) => set({ syncState }),
}));
