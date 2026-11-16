import { defineConfig, Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import os from 'os'

function networkLogger(): Plugin {
  return {
    name: 'network-logger',
    configureServer(server) {
      server.httpServer?.once('listening', () => {
        setTimeout(() => {
          const ifaces = os.networkInterfaces();
          const ips: string[] = [];
          for (const [, addrs] of Object.entries(ifaces)) {
            if (!addrs) continue;
            for (const addr of addrs) {
              if (addr.internal) continue;
              if (addr.family === 'IPv4' || (addr as any).family === 4) {
                ips.push(`http://${addr.address}:5173/`);
              } else if (addr.family === 'IPv6' || (addr as any).family === 6) {
                if (!addr.address.startsWith('fe80:')) {
                  ips.push(`http://[${addr.address}]:5173/`);
                }
              }
            }
          }
          if (ips.length > 0) {
            console.log('\n  \x1b[36m\x1b[1m>> Network Access (LAN / Wi-Fi):\x1b[0m');
            ips.forEach((url) => console.log(`  \x1b[32m\x1b[1m>> Network:\x1b[0m \x1b[4m${url}\x1b[0m`));
            console.log('');
          }
        }, 120);
      });
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), networkLogger()],
  build: {
    chunkSizeWarningLimit: 350,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom'],
          'vendor-motion': ['framer-motion'],
        },
      },
    },
  },
  server: {
    port: 5173,
    host: '::', // Dual-stack: binds to all IPv6 and IPv4 network interfaces
    cors: true,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
    },
  },
})

