import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Base URL is '/' for Vercel / Netlify / custom domains.
// For GitHub Pages *project* repos (https://<user>.github.io/<repo>/)
// set the VITE_BASE env variable in your repo's Actions secrets/variables, e.g. "/<repo>/"
// Leave it unset (or set to "/") for user/org pages or custom domains.
export default defineConfig({
  plugins: [react()],
  base: process.env.VITE_BASE || '/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  },
})
