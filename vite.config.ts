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
            manifest: {
              name: 'ORBIS Maya',
              short_name: 'Maya',
              description:
                'AI Mystic Dream & Astro Analyzer by ORBIS',
              start_url: '/',
              display: 'standalone',
              background_color: '#070914',
              theme_color: '#070914',
              lang: 'bn',
            },
          }),
        ]
      : []

  return {
    plugins: [react(), ...pwaPlugins],
  }
})
