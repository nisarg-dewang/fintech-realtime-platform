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
                configure: function (proxy) {
                    proxy.on('proxyReq', function (proxyReq, req) {
                        // Ensure Authorization and other headers from the browser are forwarded
                        var auth = req.headers['authorization'];
                        if (auth)
                            proxyReq.setHeader('Authorization', auth);
                    });
                },
            },
            // WebSocket: not proxied; frontend connects directly to backend in dev to avoid proxy EPIPE on disconnect
        },
    },
});
