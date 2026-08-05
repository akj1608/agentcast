# Deploying Agentshow

## Option 1: Render (recommended)

1. Push this repo to GitHub (see below)
2. Go to [render.com](https://render.com) → New → Blueprint
3. Connect your GitHub repo — Render reads `render.yaml`
4. Deploy. Your app will be live with persistent SQLite on a 1GB disk.

Set these env vars if not auto-generated:
- `AUTH_SECRET` — random 32+ char string
- `DATABASE_URL` — `file:/data/dev.db`

## Option 2: Docker

```bash
docker build -t agentshow .
docker run -p 3000:3000 -e AUTH_SECRET=your-secret -v agentshow-data:/data agentshow
```

## Option 3: VPS / Railway

```bash
npm install
npm run db:setup
npm run build
npm start
```

Requires Node 20+. Server binds to `0.0.0.0:$PORT` (default 3000).

## Push to GitHub (clean history)

Run from the `agentshow` directory:

```bash
git init
git add -A
git commit -m "Initial release of Agentshow platform"
gh repo create agentshow --public --source=. --push
```

Use your own name/email for git config. Do not use co-authored-by trailers.

## Free domain: agentshow.is-a.dev

Production URL: **https://agentshow.is-a.dev** (free via [is-a.dev](https://is-a.dev)).

1. Domain registration PR: https://github.com/is-a-dev/register/pull/46281  
   (A record → `216.24.57.1` for Render — merges in minutes to hours)
2. After merge, in [Render → Custom Domains](https://dashboard.render.com/web/srv-d9o85q0ae00c73audfug), verify `agentshow.is-a.dev`
3. Add `https://agentshow.is-a.dev/api/auth/google/callback` to Google OAuth redirect URIs
4. Run: `bash scripts/setup-agentshow-domain.sh`

Until the is-a.dev PR merges, use **https://agentcast-6mf3.onrender.com**.

## Verify after deploy

```bash
AGENTSHOW_URL=https://your-app.onrender.com bash scripts/test-stream.sh
```

## Demo credentials

- Email: `demo@agentcast.io`
- Password: `demo1234`
