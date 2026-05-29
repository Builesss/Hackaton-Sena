import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    open: true,
    host: true,
    proxy: {
      '/tomtom': {
        target: 'https://api.tomtom.com',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/tomtom/, ''),
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router-dom')) {
              return 'vendor';
            }
            if (id.includes('leaflet') || id.includes('react-leaflet')) {
              return 'maps';
            }
            if (id.includes('chart.js') || id.includes('react-chartjs-2')) {
              return 'charts';
            }
            return 'vendor-other';
          }
        },
      },
    },
  },
  optimizeDeps: {
    include: ['leaflet', 'react-leaflet'],
  },
});
