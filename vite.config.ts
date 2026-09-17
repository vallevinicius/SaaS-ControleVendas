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
    // Repassa as chamadas de API pro Express (porta 4000) por trás do mesmo
    // endereço do Vite — o navegador só enxerga localhost:3099, front e API
    // "parecem" a mesma porta (e evita CORS em dev). Ver VITE_API_URL no
    // .env, que passa a ser um caminho relativo ("/api") em vez de uma URL
    // absoluta com porta própria.
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
    },
  },
});
