# My Expense Tracker
Private, offline personal expense manager. Plain HTML/CSS/JS + Chart.js (CDN). Data lives only in your browser's localStorage.

## Architecture
- `index.html` – four views (Home, Transactions, Analysis, Settings), modal form, confirm dialog
- `style.css` – CSS variables for light/dark themes, mobile-first layout
- `script.js` – state, storage, renderers, validation, CSV/JSON export, import, demo data
- `manifest.json` / `service-worker.js` – PWA install + offline cache

## Run locally
Service workers need http, not file://. In this folder run `python3 -m http.server 8000` and open http://localhost:8000 (or use VS Code "Live Server"). Opening index.html directly also works, minus offline/PWA.

## Upload to GitHub
1. Create a new repository (e.g. `expense-tracker`) on github.com.
2. In this folder: `git init && git add . && git commit -m "My Expense Tracker"`
3. `git branch -M main && git remote add origin https://github.com/<you>/expense-tracker.git && git push -u origin main`

## Deploy free with GitHub Pages
Repository → Settings → Pages → Source: "Deploy from a branch" → Branch `main`, folder `/ (root)` → Save. After a minute your app is live at `https://<you>.github.io/expense-tracker/`.

## Install as PWA on Android
Open the Pages URL in Chrome, wait for it to load once (so it caches), then menu ⋮ → "Install app" / "Add to Home screen". It opens full-screen and works offline.

## Convert to an Android APK
- Easiest: [PWABuilder.com](https://www.pwabuilder.com) → enter your Pages URL → Android package (uses Trusted Web Activity). For a store-quality icon, replace the placeholder icon in `manifest.json` with PNG files (192×192 and 512×512).
- Alternative: Bubblewrap CLI (`npm i -g @bubblewrap/cli`, `bubblewrap init --manifest <url>/manifest.json`, `bubblewrap build`) or wrap the folder with Capacitor.

## Tips
Data is per-browser: export a JSON backup regularly (Settings → Export JSON). Clearing browser site data erases the app's data.
