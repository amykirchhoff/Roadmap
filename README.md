# BizX Roadmap Explorer

Interactive dashboard for analyzing roadmap differentiation across NJ business industries.

## Quick Start (local)

```bash
npm install
npm run dev
```

Then open http://localhost:5173

## Deploy to Vercel (recommended)

1. Push this folder to a GitHub repo
2. Go to [vercel.com](https://vercel.com) → New Project → Import your repo
3. Vercel will auto-detect Vite — no config needed
4. Click Deploy

Your team gets a shareable URL (e.g. `roadmap-explorer.vercel.app`). Every push to `main` auto-redeploys.

## Deploy to GitHub Pages

1. In `vite.config.js`, add your repo base path:
   ```js
   export default defineConfig({
     plugins: [react()],
     base: '/your-repo-name/',
   })
   ```
2. Install the deploy helper:
   ```bash
   npm install --save-dev gh-pages
   ```
3. Add to `package.json` scripts:
   ```json
   "deploy": "npm run build && gh-pages -d dist"
   ```
4. Run `npm run deploy`

## Updating the data

All data lives in the `const DATA = { ... }` block near the top of `src/App.jsx`. Replace it with a new export from your data pipeline and redeploy.
