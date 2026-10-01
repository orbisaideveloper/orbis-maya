export const destinations = [
  { path: '/', key: 'home' },
  { path: '/dream', key: 'dream' },
  { path: '/astro', key: 'astro' },
  { path: '/chat', key: 'chat' },
  { path: '/history', key: 'history' },
  { path: '/settings', key: 'settings' },
  { path: '/account', key: 'account' },
] as const

export function subscribeToLocation(onChange: () => void) {
  window.addEventListener('hashchange', onChange)
  return () => window.removeEventListener('hashchange', onChange)
}

export function readLocation() {
  return window.location.hash.slice(1) || '/'
}
