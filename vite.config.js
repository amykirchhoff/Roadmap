import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Set this to your GitHub repo name, e.g. '/roadmap-explorer/'
// If you rename the repo, update this value to match.
const BASE_PATH = '/Roadmap/'

export default defineConfig({
  plugins: [react()],
  base: BASE_PATH,
})
