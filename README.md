# Family Finance Hub

A personal home finance organizer for two partners. Tracks income, bills, budgets, savings goals, and home project estimates. Runs entirely in the browser — no account, no server, no subscription.

![Family Finance Hub](https://img.shields.io/badge/React-18-61dafb?style=flat-square&logo=react)
![Recharts](https://img.shields.io/badge/Recharts-2.x-22b5bf?style=flat-square)
![localStorage](https://img.shields.io/badge/Storage-localStorage-f5a623?style=flat-square)
![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)

---

## Features

- **Dashboard** — monthly income, bills, budget, and net cash flow at a glance with charts
- **Income Tracker** — separate entries for Partner 1 and Partner 2, supports weekly / bi-weekly / monthly / yearly
- **Bills Tracker** — categorized recurring bills with due-day tracking, autopay flag, and paid/unpaid toggle
- **Budget Planner** — category budgets with spending log, bar charts, and over-budget warnings
- **Savings Goals** — custom goals with target, saved amount, deadline, monthly contribution calculator, and color picker
- **Project Estimator** — line-item builder per project (Home Depot, Walmart, Lowes, etc.) with funding tracker
- **Bill Calendar** — full monthly calendar with bills marked on their due dates
- **Settings** — JSON export / import backup and GitHub deployment guide

All data is stored automatically in `localStorage`. Nothing leaves your device.

---

## Quick Start (Local)

```bash
# 1. Clone the repo
git clone https://github.com/YOUR_USERNAME/family-finance-hub.git
cd family-finance-hub

# 2. Install dependencies
npm install

# 3. Start the dev server
npm start
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Deploy to GitHub Pages (Free Hosting)

### One-time setup

```bash
# Run the setup script (do this once)
chmod +x deploy.sh
./deploy.sh YOUR_GITHUB_USERNAME
```

This will:
1. Initialize a git repo (if needed)
2. Set the remote origin
3. Build the app
4. Deploy to GitHub Pages

### After setup — redeploy any time

```bash
npm run deploy
```

Your app will be live at:
```
https://YOUR_USERNAME.github.io/family-finance-hub
```

---

## Deploy to Vercel (Recommended — Faster)

```bash
# Install Vercel CLI once
npm install -g vercel

# Deploy from the project folder
vercel
```

Follow the prompts. Your app will be live at a `*.vercel.app` URL in under 60 seconds.

To update after changes:
```bash
vercel --prod
```

---

## Project Structure

```
family-finance-hub/
├── public/
│   ├── index.html
│   └── favicon.ico
├── src/
│   ├── App.js          ← Main app (all components in one file)
│   └── index.js        ← React entry point
├── package.json
├── deploy.sh           ← One-command GitHub Pages deploy
└── README.md
```

---

## Backup Your Data

Your data lives in your browser's `localStorage`. To back it up:

1. Go to **Settings** in the app
2. Click **Export JSON Backup**
3. Save the file somewhere safe (Google Drive, Dropbox, etc.)

To restore on a new device or browser:

1. Go to **Settings**
2. Click **Import JSON**
3. Select your backup file

---

## Tech Stack

| Library | Purpose |
|---------|---------|
| React 18 | UI framework |
| Recharts | Charts and graphs |
| localStorage | Client-side data persistence |
| Google Fonts | Playfair Display + DM Sans |

No backend. No database. No auth. No fees.

---

## License

MIT — use it, modify it, share it freely.
