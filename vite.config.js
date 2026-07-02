import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // Split heavy deps into their own chunks so the main bundle stays small
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/three')) return 'three';
          if (id.includes('node_modules/@react-spring')) return 'react-spring';
          if (id.includes('node_modules/react-dom') || id.includes('node_modules/react-router-dom')) return 'react-vendor';
          if (id.includes('node_modules/react/')) return 'react-vendor';
        },
      },
    },
    // Target modern browsers for smaller output (no legacy transforms)
    target: 'es2020',
    // Enable CSS code splitting
    cssCodeSplit: true,
  },
})
