import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Get base path from environment or use Liliput default
const basePath = process.env.BASE_PATH || '/dev/crgarcia12/techadvisor/liliput-task-8f6ccca6';

export default defineConfig({
  plugins: [react()],
  base: basePath + '/',
  server: {
    port: 3000,
    host: '0.0.0.0'
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets'
  }
});
