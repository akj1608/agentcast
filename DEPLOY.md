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

## Custom domain (agentshow.dev)

Point `agentshow.dev` at your Render service once you register the domain.

### Cloudflare DNS

In your Cloudflare dashboard for `agentshow.dev`:

1. Remove any parking/A records pointing elsewhere.
2. Delete all **AAAA** records (Render is IPv4-only).
3. Add CNAME records (set **Proxy status** to **DNS only** / grey cloud until SSL is issued):

| Name | Target |
|------|--------|
| `@` | `agentcast-6mf3.onrender.com` |
| `www` | `agentcast-6mf3.onrender.com` |

4. In [Render Dashboard → agentcast → Custom Domains](https://dashboard.render.com/web/srv-d9o85q0ae00c73audfug), add and verify `agentshow.dev` and `www.agentshow.dev`.
5. After certificates show as valid, you can optionally enable Cloudflare proxy (orange cloud).
6. Add `https://agentshow.dev/api/auth/google/callback` to your [Google OAuth redirect URIs](https://console.cloud.google.com/apis/credentials).

Set `NEXT_PUBLIC_APP_URL=https://agentshow.dev` on Render (included in `render.yaml`).

Until DNS is live, the app stays available at `https://agentcast-6mf3.onrender.com`.

## Verify after deploy

```bash
AGENTSHOW_URL=https://your-app.onrender.com bash scripts/test-stream.sh
```

## Demo credentials

- Email: `demo@agentcast.io`
- Password: `demo1234`
