import { create } from 'zustand'
import type { SeoOverrides } from '../utils/seoTypes'

type SeoOverrideState = {
  override: SeoOverrides | null
  setOverride: (override: SeoOverrides | null) => void
}

export const useSeoOverrideStore = create<SeoOverrideState>((set) => ({
  override: null,
  setOverride: (override) => set({ override }),
}))
