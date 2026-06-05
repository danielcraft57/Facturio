import { create } from 'zustand'
import type { RealtimeEvent } from '../types/realtime'

type RealtimeEventsState = {
  events: RealtimeEvent[]
  pushEvent: (event: RealtimeEvent) => void
  clearEvents: () => void
}

const MAX_EVENTS = 120

export const useRealtimeEventsStore = create<RealtimeEventsState>((set) => ({
  events: [],
  pushEvent: (event) =>
    set((state) => ({
      events: [event, ...state.events].slice(0, MAX_EVENTS),
    })),
  clearEvents: () => set({ events: [] }),
}))
