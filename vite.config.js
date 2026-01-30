import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Configuración básica de Vite con React
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
  },
});