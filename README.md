# BizX Roadmap Explorer

Interactive dashboard for analyzing roadmap differentiation across NJ business industries.

## Deploy via GitHub Actions → GitHub Pages

This repo is set up to auto-deploy on every push to `main`. One-time setup:

### Step 1: Create the GitHub repo

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR-ORG/YOUR-REPO-NAME.git
git push -u origin main
```

### Step 2: Update the base path

In `vite.config.js`, set `BASE_PATH` to match your repo name exactly:

```js
const BASE_PATH = '/your-repo-name/'
```

Commit and push that change.

### Step 3: Enable GitHub Pages

1. Go to your repo on GitHub → **Settings → Pages**
2. Under **Source**, select **GitHub Actions**
3. Save

Your dashboard will be live at:
```
https://YOUR-ORG.github.io/your-repo-name/
```

Every subsequent push to `main` auto-redeploys. Watch build progress under the **Actions** tab.

---

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:5173

## Updating the data

All data lives in the `const DATA = { ... }` block near the top of `src/App.jsx`.
Replace it with a fresh export and push — the workflow handles the rest.
