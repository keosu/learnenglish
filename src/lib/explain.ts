import { create } from 'zustand'
import type { Track } from '../types'

export const useExplain = create<{ track: Track | null; open: (track: Track | null) => void }>()((set) => ({
  track: null,
  open: (track) => set({ track }),
}))
