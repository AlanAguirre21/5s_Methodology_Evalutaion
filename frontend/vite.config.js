import react from '@vitejs/plugin-react';
import basicSsl from '@vitejs/plugin-basic-ssl';
import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';

const BACKEND_PORT = 3011;

// HTTPS (self-signed certificate, kept in .cert) so the browser lets the app open the camera from other devices
// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), basicSsl({ name: '5s-evaluation', certDir: '.cert' })],
  define: {
    'import.meta.env.VITE_BACKEND_PORT': JSON.stringify(String(BACKEND_PORT)),
  },
  server: {
    host: '0.0.0.0',
    port: 5175,
    strictPort: true,
    proxy: {'/api': `http://localhost:${BACKEND_PORT}`},
  },
  preview: {
    host: '0.0.0.0',
    port: 5175,
    strictPort: true,
  },
});
