import { useSyncExternalStore } from 'react'
export const themes = ['astral-blue', 'astral-gold', 'plain-light'] as const
export type Theme = typeof themes[number]
const key = 'orbis-maya-theme-v1'
let memory: Theme = 'astral-blue'
export function readTheme(): Theme {
  try {
    const value = localStorage.getItem(key)
    if (themes.includes(value as Theme)) return value as Theme
  } catch { /* Keep the preference usable when storage is unavailable. */ }
  return memory
}
export function setTheme(theme: Theme) {
  memory = theme
  try { localStorage.setItem(key, theme) } catch { /* Session fallback. */ }
  window.dispatchEvent(new Event('maya-theme'))
}
function subscribe(listener: () => void) {
  window.addEventListener('maya-theme', listener)
  window.addEventListener('storage', listener)
  return () => {
    window.removeEventListener('maya-theme', listener)
    window.removeEventListener('storage', listener)
  }
}
export function useTheme() { return useSyncExternalStore(subscribe, readTheme) }
