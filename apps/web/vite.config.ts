import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // ADICIONE ESTA SEÇÃO
  server: {
    port: 3000,
    host: true, // Permite que o Docker acesse o servidor
  },
})