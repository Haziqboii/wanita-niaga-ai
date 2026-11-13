import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import { geminiApiPlugin } from './server/vitePlugin.ts'

export default defineConfig({
  plugins: [react(), tailwindcss(), geminiApiPlugin()],
})
