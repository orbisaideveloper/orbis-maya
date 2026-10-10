import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  expect: {
    timeout: 5_000,
  },
  projects: [
    {
      name: 'mobile-chromium',
      testMatch: '**/maya-home.spec.ts',
      grepInvert: /all six design cards|Home stays 2×3/,
      use: {
        ...devices['Pixel 7'],
        baseURL: 'http://127.0.0.1:4173',
      },
    },
    {
      name: 'mobile-design',
      testMatch: '**/maya-home.spec.ts',
      grep: /all six design cards|Home stays 2×3/,
      use: { ...devices['Pixel 7'], baseURL: 'http://127.0.0.1:4175' },
    },
    {
      name: 'mobile-auth',
      testMatch: '**/maya-auth.spec.ts',
      use: { ...devices['Pixel 7'], baseURL: 'http://127.0.0.1:4174' },
    },
    {
      name: 'mobile-layout',
      testMatch: ['**/maya-layout.spec.ts', '**/maya-all-pages-layout.spec.ts', '**/sonar-style-regression.spec.ts'],
      use: { ...devices['Pixel 7'], baseURL: 'http://127.0.0.1:4175' },
    },
  ],
  webServer: [{
    command: 'npm run dev -- --host 127.0.0.1 --port 4175 --strictPort',
    env: { VITE_SUPABASE_URL: '', VITE_SUPABASE_ANON_KEY: '', VITE_MAYA_GATEWAY_URL: '' },
    url: 'http://127.0.0.1:4175',
    timeout: 60_000,
    reuseExistingServer: false,
  }, {
    command:
      'npm run preview -- --host 127.0.0.1 --port 4173',
    url: 'http://127.0.0.1:4173',
    timeout: 30_000,
    reuseExistingServer: false,
  }, {
    command: 'npm run dev -- --host 127.0.0.1 --port 4174 --strictPort',
    env: { VITE_SUPABASE_URL: 'https://maya-auth.invalid', VITE_SUPABASE_ANON_KEY: 'sb_publishable_e2e', VITE_MAYA_GATEWAY_URL: 'https://maya-gateway.invalid/api/maya/request' },
    url: 'http://127.0.0.1:4174',
    timeout: 30_000,
    reuseExistingServer: false,
  }],
})
