import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // Один origin для React в разработке и REST API на Spring Boot.
      '/api': { target: 'http://localhost:8080', changeOrigin: true }
    }
  }
});
