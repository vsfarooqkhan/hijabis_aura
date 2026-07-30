import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: { port: 5180, open: false },
  build: {
    // Only the genuinely shared, always-needed vendors are pinned to their own
    // chunks, so a copy edit doesn't invalidate them in everyone's cache.
    // Recharts and the Zod/react-hook-form stack are deliberately NOT listed:
    // naming them here would hoist them out of the lazy route chunks that are
    // the only things importing them, and they'd get preloaded on every visit.
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom'],
          motion: ['framer-motion'],
        },
      },
    },
    chunkSizeWarningLimit: 600,
  },
})
