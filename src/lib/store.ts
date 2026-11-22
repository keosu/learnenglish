import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Track } from '../types'
import { logListen } from './db'
import { speak, speechSupported, stopSpeaking } from './speech'

export const RATES = [0.7, 0.85, 1, 1.15]

export function nextRate(rate: number) {
  return RATES[(RATES.indexOf(rate) + 1) % RATES.length] ?? 1
}

interface Settings {
  rate: number
  voiceURI: string | null
  showZh: boolean
  blind: boolean
  shadow: boolean
  set: (patch: Partial<Omit<Settings, 'set'>>) => void
}

export const useSettings = create<Settings>()(persist((set) => ({
  rate: 0.85,
  voiceURI: null,
  showZh: true,
  blind: false,
  shadow: false,
  set: (patch) => set(patch),
}), { name: 'echo-settings' }))

interface Player {
  queue: Track[]
  label: string
  index: number
  playing: boolean
  repeatOne: boolean
  speakingKey: string | null
  word: number | null
  notice: string | null
  load: (queue: Track[], label: string, index?: number, autoplay?: boolean) => void
  play: () => void
  pause: () => void
  toggle: () => void
  jump: (index: number, autoplay?: boolean) => void
  step: (delta: number) => void
  once: (track: Track, slow?: boolean) => void
  setRepeat: (value: boolean) => void
  dismiss: () => void
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))
let runId = 0

export const usePlayer = create<Player>()((set, get) => {
  const fail = (result: string) => set({ playing: false, speakingKey: null, word: null, notice: result === 'unsupported' ? '这个浏览器不支持语音朗读' : '朗读被系统打断了，再点一次播放' })

  const say = async (id: number, track: Track, rate: number) => {
    set({ speakingKey: track.key, word: null })
    const result = await speak(track.en, { rate, voiceURI: useSettings.getState().voiceURI, onWord: (word) => id === runId && set({ word }) })
    if (id === runId) set({ speakingKey: null, word: null })
    return result
  }

  const run = async () => {
    const id = ++runId
    await sleep(80)
    while (id === runId) {
      const { queue, index } = get()
      const track = queue[index]
      if (!track) return set({ playing: false })
      const { rate, shadow } = useSettings.getState()
      const started = Date.now()
      const result = await say(id, track, rate)
      if (id !== runId) return
      if (result === 'error') return fail(result)
      void logListen(track)
      await sleep(shadow ? Math.min(14000, (Date.now() - started) * 1.15 + 600) : 450)
      if (id !== runId) return
      if (get().repeatOne) continue
      if (index + 1 >= queue.length) return set({ playing: false })
      set({ index: index + 1 })
    }
  }

  const halt = () => {
    runId += 1
    stopSpeaking()
  }

  return {
    queue: [],
    label: '',
    index: 0,
    playing: false,
    repeatOne: false,
    speakingKey: null,
    word: null,
    notice: null,
    load: (queue, label, index = 0, autoplay = false) => {
      halt()
      set({ queue, label, index: Math.min(index, Math.max(queue.length - 1, 0)), playing: false, speakingKey: null, word: null })
      if (autoplay) get().play()
    },
    play: () => {
      if (!speechSupported) return fail('unsupported')
      if (!get().queue.length) return
      halt()
      set({ playing: true, notice: null })
      void run()
    },
    pause: () => {
      halt()
      set({ playing: false, speakingKey: null, word: null })
    },
    toggle: () => (get().playing ? get().pause() : get().play()),
    jump: (index, autoplay) => {
      const { queue, playing } = get()
      if (index < 0 || index >= queue.length) return
      halt()
      set({ index, speakingKey: null, word: null })
      if (autoplay ?? playing) get().play()
    },
    step: (delta) => get().jump(get().index + delta),
    once: (track, slow) => {
      if (!speechSupported) return fail('unsupported')
      halt()
      const { queue } = get()
      const at = queue.findIndex((item) => item.key === track.key)
      set({ playing: false, notice: null, ...(at >= 0 ? { index: at } : {}) })
      const id = runId
      void sleep(80).then(async () => {
        if (id !== runId) return
        const rate = useSettings.getState().rate * (slow ? 0.7 : 1)
        const result = await say(id, track, rate)
        if (id === runId && result === 'error') fail(result)
        if (id === runId && result === 'end') void logListen(track)
      })
    },
    setRepeat: (repeatOne) => set({ repeatOne }),
    dismiss: () => set({ notice: null }),
  }
})
