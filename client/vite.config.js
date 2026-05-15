import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (/react|react-dom|react-router/.test(id)) {
              return 'vendor-react'
            }
            if (/framer-motion/.test(id)) {
              return 'vendor-motion'
            }
            if (/lucide-react|sonner/.test(id)) {
              return 'vendor-ui'
            }
            return 'vendor-misc'
          }
        },
      },
    },
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', 'framer-motion'],
  },
})