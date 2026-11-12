import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Khi chạy dev, mọi request /api được chuyển sang server Express (cổng 5000)
export default defineConfig({
  plugins: [react()],
  server: { port: 5173, proxy: { '/api': 'http://localhost:5000' } },
});
