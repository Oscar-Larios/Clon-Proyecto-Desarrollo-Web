import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Set VITE_BASE_PATH in your repo's GitHub Actions or .env for the repo name
// e.g.  VITE_BASE_PATH=/tennis-bracket-manager/
export default defineConfig({
  plugins: [react()],
  base: process.env.VITE_BASE_PATH || '/',
})
