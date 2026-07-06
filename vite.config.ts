import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Liliput base path - must match the deployment prefix
const basePath = '/dev/crgarcia12/techadvisor/liliput-task-2a1a850a'

export default defineConfig({
  plugins: [react()],
  base: basePath,
  server: {
    host: '0.0.0.0',
    port: parseInt(process.env.PORT || '5173'),
    strictPort: true
  },
  preview: {
    host: '0.0.0.0',
    port: parseInt(process.env.PORT || '4173'),
    strictPort: true
  }
})
