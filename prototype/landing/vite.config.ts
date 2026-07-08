import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    strictPort: true,
    fs: {
      // Allow importing composite mockup images stored in Cursor's assets workspace.
      allow: [
        // Landing app files
        __dirname,
        // Cursor-generated mockup images
        '/Users/user/.cursor/projects/Users-user-Private-POS/assets',
      ],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
