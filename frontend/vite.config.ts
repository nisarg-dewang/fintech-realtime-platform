import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq, req) => {
            // Ensure Authorization and other headers from the browser are forwarded
            const auth = (req.headers as Record<string, string | string[] | undefined>)['authorization'];
            if (auth) proxyReq.setHeader('Authorization', auth);
          });
        },
      },
      // WebSocket: not proxied; frontend connects directly to backend in dev to avoid proxy EPIPE on disconnect
    },
  },
});
