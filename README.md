# Agentshow

A full-stack platform for streaming, replaying, and sharing AI agent coding sessions in real time.

## Features

- **User authentication** — Register, login, profiles
- **Live streaming** — WebSocket-powered real-time event feeds
- **Session management** — Create, end, and manage sessions from dashboard
- **Multi-agent support** — Claude Code, Composer, Aider, Copilot, Windsurf
- **Live chat** — Persistent chat alongside sessions
- **Talk-back** — Viewers send messages to running AI sessions
- **Likes & profiles** — Follow creators, like sessions
- **CLI tool** — Stream events from your terminal
- **SQLite database** — Full persistence, no external services required

## Quick Start

```bash
cd agentshow
npm install
npm run db:setup    # Create database + seed demo data
npm run dev         # Start server on http://localhost:3000
```

**Demo account:** `demo@agentcast.io` / `demo1234`

## CLI Usage

```bash
# Login
npm run cli -- login demo@agentcast.io demo1234

# Start interactive streaming session
npm run cli -- stream --title "Building auth" --agent claude-code

# In the stream, type events:
prompt|Refactor the auth module to use JWT
file_write|Updated api/auth.go
quit

# Or send a single event
npm run cli -- send --slug your-slug --type prompt --content "Add tests"
```

## API

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/register` | POST | Create account |
| `/api/auth/login` | POST | Sign in |
| `/api/auth/me` | GET/DELETE | Current user / logout |
| `/api/sessions` | GET/POST | List / create sessions |
| `/api/sessions/:slug` | GET/PATCH/DELETE | Session details / update / end |
| `/api/sessions/:slug/events` | GET/POST | Get / ingest events |
| `/api/sessions/:slug/chat` | GET/POST | Chat messages |
| `/api/sessions/:slug/talkback` | GET/POST | Talk-back queue |
| `/api/sessions/:slug/like` | POST | Toggle like |
| `/api/dashboard` | GET | User dashboard data |
| `ws://host/ws?sessionId=ID` | WebSocket | Live event stream |

## Documentation

- [System Design](./docs/SYSTEM_DESIGN.md) — Architecture, HLD/LLD, diagrams

## Tech Stack

- **Frontend:** Next.js 15, React 19, Tailwind CSS 4
- **Backend:** Custom Node server with WebSocket support
- **Database:** SQLite + Prisma ORM
- **Auth:** JWT cookies + API tokens
- **Real-time:** WebSocket event bus

## Live demo

**https://agentcast-6mf3.onrender.com** (production until [agentshow.dev](https://agentshow.dev) DNS is configured)

Demo account: `demo@agentcast.io` / `demo1234`

## Deploy

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/akj1608/agentcast)

See [DEPLOY.md](./DEPLOY.md) for Docker, VPS, and manual setup.
