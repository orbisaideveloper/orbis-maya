import {defineConfig} from '@playwright/test'
import base from './playwright.config'
export default defineConfig({...base,workers:1,projects:[{...base.projects![0],testMatch:['**/maya-layout.spec.ts','**/maya-all-pages-layout.spec.ts'],use:{...base.projects![0].use,baseURL:'http://127.0.0.1:4175'}}],webServer:{command:'npm run dev -- --host 127.0.0.1 --port 4175 --strictPort',env:{VITE_SUPABASE_URL:'',VITE_SUPABASE_ANON_KEY:'',VITE_MAYA_GATEWAY_URL:''},url:'http://127.0.0.1:4175',timeout:60000,reuseExistingServer:false}})
