import { create } from 'zustand'

type LiveSyncState = {
  invoicesVersion: number
  quotesVersion: number
  bumpInvoices: () => void
  bumpQuotes: () => void
}

export const useLiveSyncStore = create<LiveSyncState>((set) => ({
  invoicesVersion: 0,
  quotesVersion: 0,
  bumpInvoices: () => set((s) => ({ invoicesVersion: s.invoicesVersion + 1 })),
  bumpQuotes: () => set((s) => ({ quotesVersion: s.quotesVersion + 1 })),
}))
