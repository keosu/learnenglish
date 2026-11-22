import { useEffect, useState } from 'react'
import { create } from 'zustand'

interface InstallEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: string }>
}

export const useInstall = create<{ event: InstallEvent | null }>()(() => ({ event: null }))

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault()
    useInstall.setState({ event: event as InstallEvent })
  })
  window.addEventListener('appinstalled', () => useInstall.setState({ event: null }))
}

export async function promptInstall() {
  const event = useInstall.getState().event
  if (!event) return
  await event.prompt()
  await event.userChoice
  useInstall.setState({ event: null })
}

export const isStandalone = () => typeof window !== 'undefined' && (matchMedia('(display-mode: fullscreen)').matches || matchMedia('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone === true)

export const isIOS = () => typeof navigator !== 'undefined' && /iphone|ipad|ipod/i.test(navigator.userAgent)

export function useFullscreen() {
  const [active, setActive] = useState(() => typeof document !== 'undefined' && Boolean(document.fullscreenElement))
  useEffect(() => {
    const sync = () => setActive(Boolean(document.fullscreenElement))
    document.addEventListener('fullscreenchange', sync)
    return () => document.removeEventListener('fullscreenchange', sync)
  }, [])
  const supported = typeof document !== 'undefined' && document.fullscreenEnabled && !isStandalone()
  const toggle = () => (document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen({ navigationUI: 'hide' })).catch(() => undefined)
  return { active, supported, toggle }
}

type Theme = 'light' | 'dark'

const systemTheme = (): Theme => (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')

function apply(theme: Theme) {
  document.documentElement.dataset.theme = theme
  document.documentElement.style.colorScheme = theme
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#0f0e0c' : '#f3efe7')
}

const savedTheme = () => (typeof localStorage === 'undefined' ? null : localStorage.getItem('echo-theme') as Theme | null)

export const useThemeChoice = create<{ choice: Theme | 'system'; system: Theme }>()(() => ({
  choice: savedTheme() ?? 'system',
  system: typeof window === 'undefined' ? 'dark' : systemTheme(),
}))

export function chooseTheme(next: Theme | 'system') {
  if (next === 'system') localStorage.removeItem('echo-theme')
  else localStorage.setItem('echo-theme', next)
  useThemeChoice.setState({ choice: next })
}

export function useTheme() {
  const { choice, system } = useThemeChoice()
  return choice === 'system' ? system : choice
}

export function useApplyTheme() {
  const theme = useTheme()
  useEffect(() => apply(theme), [theme])
  useEffect(() => {
    const media = matchMedia('(prefers-color-scheme: dark)')
    const sync = () => useThemeChoice.setState({ system: systemTheme() })
    media.addEventListener('change', sync)
    return () => media.removeEventListener('change', sync)
  }, [])
}
