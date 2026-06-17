import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// El backend asume el front en :4200 (CORS abierto, no afecta).
// Usamos 4201 para poder levantar Angular y React en paralelo durante la migración.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 4201,
  },
});
