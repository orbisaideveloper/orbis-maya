import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(async () => {
  const pwaPlugins =
    process.env.MAYA_PWA_BUILD === '1'
      ? [
          (
            await import('vite-plugin-pwa')
          ).VitePWA({
            registerType: 'autoUpdate',
            workbox: { maximumFileSizeToCacheInBytes: 5 * 1024 * 1024 },
            manifest: {
              name: 'Orbis Astro',
              short_name: 'Orbis Astro',
              description:
                'Astrology, dreams and Ask Maya by Orbis',
              start_url: '/',
              display: 'standalone',
              background_color: '#4553a8',
              theme_color: '#4553a8',
              lang: 'bn',
              icons: [{ src: '/brand/orbis-maya.png', sizes: '1254x1254', type: 'image/png', purpose: 'any' }],
            },
          }),
        ]
      : []

  return {
    plugins: [react(), ...pwaPlugins],
  }
})
