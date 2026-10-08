const paths = {
  eye: 'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12ZM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z',
  eyeOff: 'm3 3 18 18M2 12s4-7 10-7c5 0 10 7 10 7s-4 7-10 7S2 12 2 12Z',
  like: 'M7 10v12H3V10Zm0 0 5-8h2v8h6l1 2-3 10H7',
  dislike: 'M7 14V2H3v12Zm0 0 5 8h2v-8h6l1-2-3-10H7',
  copy: 'M8 8h13v13H8ZM3 16V3h13',
  mic: 'M9 4a3 3 0 0 1 6 0v8a3 3 0 0 1-6 0ZM5 10v2a7 7 0 0 0 14 0v-2M12 19v3M8 22h8',
  stop: 'M6 6h12v12H6Z',
  home: 'M3 10 12 3l9 7v11h-6v-7H9v7H3Z',
  dream: 'M6 18a5 5 0 0 1 0-10 6 6 0 0 1 11-1 5.5 5.5 0 0 1 1 11H6Z',
  astro: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm0 4a6 6 0 1 0 0 12 6 6 0 0 0 0-12Zm0-4v4m0 12v4M2 12h4m12 0h4M5 5l3 3m8 8 3 3M5 19l3-3m8-8 3-3',
  chat: 'M21 11a9 9 0 0 1-9 9H4l-3 3V11a10 10 0 0 1 20 0ZM7 11h1m4 0h1m4 0h1',
  saved: 'M6 3h12v19l-6-4-6 4Z',
  today: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm4 6-3 5-5 3 3-5Z',
  settings: 'M9 2h6l1 3 3 1 3 3v6l-3 1-1 3-3 3H9l-1-3-3-1-3-3V9l3-1 1-3ZM12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z',
  profile: 'M12 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8ZM3 22v-3a9 9 0 0 1 18 0v3',
  bell: 'M6 8a6 6 0 0 1 12 0v7l3 3H3l3-3ZM10 21h4',
  arrow: 'm9 5 7 7-7 7', back: 'm15 5-7 7 7 7', send: 'm3 3 18 9-18 9 4-9Zm4 9h14',
} as const
export default function Icon({name}: Readonly<{name:keyof typeof paths}>) {
  return <svg className="maya-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[name]} /></svg>
}
