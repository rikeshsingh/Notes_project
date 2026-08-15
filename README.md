# Notes Project

This is a small static notes app with optional Firebase Firestore real-time sync.

What you get
- Static frontend (HTML/CSS/JS) in this repo
- Optional Node static server (`server.js`) for local testing with `data.json`
- Optional Firestore integration (client-side). Add your Firebase config to `firebase-config.js` to enable.

Run locally

1. Install Node (v16+ recommended).
2. Start the local server:

```bash
node server.js
# open http://localhost:9001
```

Enable Firestore (optional)

1. Create a Firebase project and Firestore database.
2. In Project settings → Your apps, create or select a Web app and copy the config object.
3. Paste the config into `firebase-config.js` as `window.FIREBASE_CONFIG = { ... }`.
4. (For testing) set Firestore rules to allow public read/write temporarily.

Deploy to GitHub + Vercel

This repo includes a GitHub Actions workflow to deploy to Vercel on push. To enable:

1. Create a GitHub repository and push this project.
2. In Vercel, create a new project and link the GitHub repo (or get `VERCEL_ORG_ID` and `VERCEL_PROJECT_ID`).
3. Create a Vercel token:
   - Vercel → Settings → Tokens → Create Token
4. In your GitHub repository, go to Settings → Secrets and Variables → Actions and add these secrets:
   - `VERCEL_TOKEN` — the token from Vercel
   - `VERCEL_ORG_ID` — your Vercel organization ID
   - `VERCEL_PROJECT_ID` — your Vercel project ID

Once secrets are set, pushing to `main` will trigger the workflow and deploy to Vercel.

Notes
- The client contains `firebase-config.js` which keeps Firebase config client-side (this is OK). Secure Firestore rules before public use.
- For static hosting on Vercel you do not need `server.js`; it's provided for local testing.

If you want, I can open a PR branch and push these changes for you (you will need to grant repo access). Alternatively, follow the steps above and I can help with any part.
# SRE / DevOps Interview Q&A (Static)

This is a static HTML/CSS/JS app containing Docker, Kubernetes, Terraform and SRE interview questions and answers. The project was simplified to run locally without Docker or Kubernetes.

Local quick runs (no Docker required)

- Python (built-in):

```bash
python run_server.py
# then open http://localhost:9000
```

- Node (built-in modules only):

```bash
node server.js
# then open http://localhost:9000
```

Files present:

- `index.html`, `styles.css`, `script.js` — static site
- `server.js` — simple Node static server (no dependencies)
- `run_server.py` — simple Python static server

Navigation:

- Open `index.html` (or start a server) to see the Home page with links to each topic.
- Click a topic (Docker, Kubernetes, Terraform, SRE) to open the dedicated page for that category.


Notes:

- You can also open `index.html` directly in a browser, but some browsers restrict loading local modules/resources for security.
- Docker/Kubernetes/Terraform files were removed per request.
