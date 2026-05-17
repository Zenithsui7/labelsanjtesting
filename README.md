# Label-Sanj — React + Vite + Firebase

Premium silk sarees e-commerce site built with React, Vite, and Firebase.

---

## 🚀 Deploy

### GitHub Pages (automatic)

1. Push this repo to GitHub.
2. Go to **Settings → Pages → Source** and select **GitHub Actions**.
3. Every push to `main` auto-builds and deploys via `.github/workflows/deploy.yml`.

> **Project repo?** If your site lives at `https://<user>.github.io/<repo>/` (not a custom domain),  
> add a repository variable `VITE_BASE` = `/<repo>/` under **Settings → Secrets and variables → Actions → Variables**.

### Vercel

1. Import the repo on [vercel.com](https://vercel.com).
2. Framework preset: **Vite** — Vercel detects it automatically.
3. Deploy. Done. (`vercel.json` handles SPA routing.)

### Netlify

1. Import the repo on [netlify.com](https://netlify.com).
2. Build command: `npm run build`, publish dir: `dist`.
3. Deploy. Done. (`netlify.toml` handles SPA routing.)

---

## 🛠 Local Development

```bash
npm install
npm run dev
```

---

## 🔥 Firebase Setup

The app uses **Firestore** and **Firebase Auth**. Your Firebase config lives in  
`src/firebase.js` — make sure the project credentials are correct before deploying.

Firestore rules are in `firestore.rules`.  
To deploy rules: `npx firebase-tools deploy --only firestore:rules`

To create the owner/admin account: `node create-owner.js`
