# Deploying AgentCast

## Option 1: Render (recommended)

1. Push this repo to GitHub (see below)
2. Go to [render.com](https://render.com) → New → Blueprint
3. Connect your GitHub repo — Render reads `render.yaml`
4. Deploy. Your app will be live with persistent SQLite on a 1GB disk.

Set these env vars if not auto-generated:
- `AUTH_SECRET` — random 32+ char string
- `DATABASE_URL` — `file:/data/dev.db`
- `NEXT_PUBLIC_APP_URL` — `https://agentcast-6mf3.onrender.com`

## Option 2: Docker

```bash
docker build -t agentcast .
docker run -p 3000:3000 -e AUTH_SECRET=your-secret -v agentcast-data:/data agentcast
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

Run from the `agentcast` directory:

```bash
git init
git add -A
git commit -m "Initial release of AgentCast platform"
gh repo create agentcast --public --source=. --push
```

Use your own name/email for git config. Do not use co-authored-by trailers.

## Production URL

**https://agentcast-6mf3.onrender.com** — no custom domain required.

Google OAuth redirect URI:
`https://agentcast-6mf3.onrender.com/api/auth/google/callback`

## Verify after deploy

```bash
AGENTCAST_URL=https://agentcast-6mf3.onrender.com bash scripts/test-stream.sh
```

## Demo credentials

- Email: `demo@agentcast.io`
- Password: `demo1234`
