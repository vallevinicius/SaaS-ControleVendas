import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // Espelha o path mapping "@/*" definido em tsconfig.json.
      // O Vite não lê tsconfig "paths" automaticamente, então o alias
      // precisa ser declarado aqui também.
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 3099,
  },
});
