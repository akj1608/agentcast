# AgentCast — System Design Document

> **Version:** 1.0  
> **Date:** August 3, 2026  
> **Author:** Abhishek  
> **Status:** Draft

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Problem Statement](#2-problem-statement)
3. [Platform Comparison](#3-platform-comparison)
4. [High-Level Design (HLD)](#4-high-level-design-hld)
5. [Low-Level Design (LLD)](#5-low-level-design-lld)
6. [Data Models](#6-data-models)
7. [API Design](#7-api-design)
8. [Real-Time Architecture](#8-real-time-architecture)
9. [Security & Privacy](#9-security--privacy)
10. [Scalability & Performance](#10-scalability--performance)
11. [Deployment Architecture](#11-deployment-architecture)
12. [Future Roadmap](#12-future-roadmap)

---

## 1. Executive Summary

**AgentCast** is a platform for live-streaming, replaying, and sharing AI coding agent sessions. It provides:

- Multi-agent support (Claude Code, Composer, Copilot, Aider, and more)
- Real-time WebSocket event streaming
- Persistent session replay with timeline
- Live viewer chat and talk-back to running sessions
- User authentication, profiles, and likes
- CLI tool for terminal-based streaming
- Open-source with self-hosting support

Unlike traditional **live coding interview platforms** (CoderPad, HackerRank FaceCode) or **browser playgrounds** (LiveCodes, CodePen), AgentCast occupies the category of **AI Agent Observability & Streaming**.

---

## 2. Problem Statement

### 2.1 The Gap

AI coding agents (Claude Code, Composer, Copilot, Aider) are transforming how software is built.

| Problem | Impact |
|---------|--------|
| Sessions are ephemeral | Knowledge is lost when the terminal closes |
| No audience engagement | Can't teach, demo, or build in public |
| Single-agent lock-in | Most tools only support one agent type |
| No discovery | Great sessions aren't findable or searchable |
| Limited replay | Can't scrub timeline, create clips, or embed |

### 2.2 Target Users

| Persona | Use Case |
|---------|----------|
| **Indie developer** | Stream building-in-public sessions |
| **Educator** | Teach AI-assisted development live |
| **Team lead** | Review how juniors use AI agents |
| **Content creator** | Produce replayable coding content |
| **Enterprise** | Audit AI agent usage in regulated environments |

### 2.3 Success Metrics

- Time-to-first-stream < 2 minutes (install CLI → live)
- Viewer latency < 500ms (p95)
- Replay load time < 1s for sessions < 1hr
- 99.9% uptime for ingest pipeline

---

## 3. Platform Comparison

### 3.1 Category Landscape

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    LIVE CODING / DEV TOOLS LANDSCAPE                     │
├─────────────────────┬─────────────────────┬─────────────────────────────┤
│  Interview Platforms │  Code Playgrounds    │  AI Agent Streaming (NEW)   │
├─────────────────────┼─────────────────────┼─────────────────────────────┤
│  CoderPad           │  LiveCodes           │  AgentCast                  │
│  HackerRank FaceCode│  CodePen             │  (this project)             │
│  CodeSignal         │  JSFiddle            │                             │
│  Coderbyte          │  Replit              │                             │
│  ClarityHire        │  StackBlitz          │                             │
└─────────────────────┴─────────────────────┴─────────────────────────────┘
```

### 3.2 Detailed Feature Matrix

| Feature | AgentCast | CoderPad | LiveCodes | CodeSignal |
|---------|:---------:|:--------:|:---------:|:----------:|
| **Primary use case** | AI agent streaming | Technical interviews | Browser playground | Assessments + interviews |
| **Live AI session feed** | ✅ | ❌ | ❌ | ❌ |
| **Multi-agent support** | ✅ (6+) | ❌ | ❌ | ❌ |
| **Session replay** | ✅ | ✅ (playback) | ❌ | ✅ |
| **Viewer talk-back** | ✅ | ❌ | ❌ | ❌ |
| **Live viewer chat** | ✅ | ✅ | ❌ | ✅ |
| **Session highlights/clips** | ✅ | ❌ | ❌ | ❌ |
| **Public discovery feed** | ✅ | ❌ | ❌ | ❌ |
| **Collaborative editor** | ❌ | ✅ | ✅ | ✅ |
| **Code execution** | Via agent | ✅ (sandbox) | ✅ (browser) | ✅ (sandbox) |
| **Video/audio** | Planned | ✅ | ❌ | ✅ |
| **90+ languages** | Via agents | ✅ (99+) | ✅ (90+) | ✅ |
| **CLI tool** | ✅ | ❌ | ❌ | ❌ |
| **Embeddable** | ✅ | ❌ | ✅ | ❌ |
| **Open source** | ✅ | ❌ | ✅ | ❌ |
| **Self-hostable** | ✅ | ❌ | ✅ | ❌ |

### 3.3 Architectural Philosophy Comparison

| Platform | Architecture | Data Location | Latency Model |
|----------|-------------|---------------|---------------|
| **LiveCodes** | 100% client-side | Browser only | Zero server round-trips |
| **CoderPad** | Server-side sandboxes | Cloud VMs | Server-mediated |
| **AgentCast** | CLI + API → ingest → SQLite → WebSocket | Local or cloud | Event streaming + replay |

### 3.4 Why Not Just Use X?

| Alternative | Why AgentCast is Different |
|-------------|---------------------------|
| **Twitch/YouTube** | No structured event feed, no talk-back to agent, no code-aware timeline |
| **asciinema** | Terminal replay only, no AI event semantics, no live interaction |
| **GitHub Copilot Workspace** | Not streamable, not shareable, no audience |
| **Replit Multiplayer** | Human-to-human collab, not AI agent observability |

---

## 4. High-Level Design (HLD)

### 4.1 System Context Diagram

```
                                    ┌──────────────┐
                                    │   Viewers    │
                                    │  (Browser)   │
                                    └──────┬───────┘
                                           │ HTTPS / WSS
                                           ▼
┌──────────────┐                    ┌──────────────┐
│  AI Agents   │                    │   AgentCast  │
│              │                    │   Platform   │
│ Claude Code  │──┐                 │              │
│ Composer     │  │  Events         │  ┌────────┐  │
│ Aider        │──┼──via CLI───────▶│  │  Web   │  │
│ Copilot      │  │                 │  │  App   │  │
│ Windsurf     │──┘                 │  └────────┘  │
└──────────────┘                    │  ┌────────┐  │
       ▲                            │  │Ingest  │  │
       │ Talk-back                  │  │Service │  │
       │ messages                   │  └────────┘  │
       │                            │  ┌────────┐  │
┌──────────────┐                    │  │Event   │  │
│   Creator    │◀───────────────────│  │Store   │  │
│  (Terminal)  │                    │  └────────┘  │
└──────────────┘                    └──────────────┘
                                           │
                    ┌──────────────────────┼──────────────────────┐
                    ▼                      ▼                      ▼
             ┌──────────┐          ┌──────────┐          ┌──────────┐
             │PostgreSQL│          │  Redis   │          │    S3    │
             │          │          │          │          │          │
             └──────────┘          └──────────┘          └──────────┘
```

### 4.2 Container Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           AgentCast Platform                             │
│                                                                          │
│  ┌─────────────┐   ┌─────────────┐   ┌─────────────┐   ┌────────────┐  │
│  │  Next.js    │   │   Ingest    │   │  Real-time  │   │   Auth     │  │
│  │  Web App    │   │   Service   │   │  Gateway    │   │  Service   │  │
│  │             │   │   (Go)      │   │  (Go/WS)    │   │  (Go)      │  │
│  │ - Landing   │   │             │   │             │   │            │  │
│  │ - Explore   │   │ - Receive   │   │ - Fanout    │   │ - GitHub   │  │
│  │ - Session   │   │   events    │   │   to viewers│   │   OAuth    │  │
│  │ - Replay    │   │ - Validate  │   │ - Presence  │   │ - API keys │  │
│  │ - API routes│   │ - Enrich    │   │ - Chat      │   │ - JWT      │  │
│  └──────┬──────┘   └──────┬──────┘   └──────┬──────┘   └─────┬──────┘  │
│         │                 │                 │                 │          │
│         └─────────────────┼─────────────────┼─────────────────┘          │
│                           ▼                 ▼                            │
│                    ┌─────────────┐   ┌─────────────┐                    │
│                    │  Event Bus  │   │   Search    │                    │
│                    │  (NATS/     │   │  (Meili-    │                    │
│                    │   Kafka)    │   │   search)   │                    │
│                    └──────┬──────┘   └─────────────┘                    │
│                           │                                              │
│         ┌─────────────────┼─────────────────┐                           │
│         ▼                 ▼                 ▼                           │
│  ┌─────────────┐   ┌─────────────┐   ┌─────────────┐                   │
│  │ PostgreSQL  │   │    Redis    │   │  S3 / R2    │                   │
│  │             │   │             │   │             │                   │
│  │ - Users     │   │ - Sessions  │   │ - Event     │                   │
│  │ - Sessions  │   │   state     │   │   chunks    │                   │
│  │ - Events    │   │ - Pub/Sub   │   │ - Clips     │                   │
│  │ - Metadata  │   │ - Rate lim  │   │ - Thumbs    │                   │
│  └─────────────┘   └─────────────┘   └─────────────┘                   │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                         Creator's Machine                                │
│                                                                          │
│  ┌─────────────┐   ┌─────────────┐   ┌─────────────┐                   │
│  │ agentcast   │   │   Agent     │   │   Hooks     │                   │
│  │ CLI/Daemon  │──▶│  (Claude,   │◀──│  (pre/post  │                   │
│  │             │   │   Composer…)  │   │   tool use) │                   │
│  └─────────────┘   └─────────────┘   └─────────────┘                   │
└─────────────────────────────────────────────────────────────────────────┘
```

### 4.3 Core Components

| Component | Responsibility | Technology |
|-----------|---------------|------------|
| **Web App** | UI, SSR, API gateway | Next.js 15, React 19 |
| **Ingest Service** | Receive & validate events from CLI | Go, gRPC/HTTP |
| **Real-time Gateway** | Fan-out events to viewers | Go, WebSocket, SSE |
| **Auth Service** | OAuth, API keys, sessions | Go, GitHub OAuth |
| **Event Store** | Append-only event log | PostgreSQL + S3 |
| **Search Index** | Full-text session search | Meilisearch |
| **CLI/Daemon** | Local agent hooks, streaming | Go/Rust binary |

### 4.4 Request Flow — Live Session

```
Creator                    CLI Daemon              Ingest Service           Real-time GW           Viewers
   │                          │                        │                       │                    │
   │  Start agent session     │                        │                       │                    │
   │─────────────────────────▶│                        │                       │                    │
   │                          │  POST /sessions        │                       │                    │
   │                          │───────────────────────▶│                       │                    │
   │                          │                        │  Create session       │                    │
   │                          │                        │  in PostgreSQL        │                    │
   │                          │◀───────────────────────│                       │                    │
   │                          │  session_id + token    │                       │                    │
   │                          │                        │                       │                    │
   │  Agent: tool_call        │                        │                       │                    │
   │─────────────────────────▶│                        │                       │                    │
   │                          │  POST /events (batch)  │                       │                    │
   │                          │───────────────────────▶│                       │                    │
   │                          │                        │  Append to event log  │                    │
   │                          │                        │──────────────────────▶│                    │
   │                          │                        │                       │  WS: event           │
   │                          │                        │                       │───────────────────▶│
   │                          │                        │                       │                    │
   │                          │                        │                       │  Viewer: talk-back  │
   │                          │                        │                       │◀───────────────────│
   │                          │◀───────────────────────│◀──────────────────────│                    │
   │◀─────────────────────────│  Inject into agent     │                       │                    │
```

### 4.5 Request Flow — Session Replay

```
Viewer                     Web App                 API                    Event Store (S3)
   │                          │                      │                          │
   │  GET /session/:slug      │                      │                          │
   │─────────────────────────▶│                      │                          │
   │                          │  Fetch metadata      │                          │
   │                          │─────────────────────▶│                          │
   │                          │                      │  Query PostgreSQL        │
   │                          │◀─────────────────────│                          │
   │                          │                      │                          │
   │                          │  Fetch event chunks  │                          │
   │                          │─────────────────────▶│─────────────────────────▶│
   │                          │◀─────────────────────│◀─────────────────────────│
   │◀─────────────────────────│  Render timeline     │                          │
   │  HTML + event JSON       │                      │                          │
```

---

## 5. Low-Level Design (LLD)

### 5.1 CLI Daemon Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    agentcast daemon                      │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ Hook Manager │  │ Event Buffer │  │  WS Client   │  │
│  │              │  │              │  │              │  │
│  │ - Claude     │  │ - Batch 50ms │  │ - Reconnect  │  │
│  │ - Composer   │──│ - Compress   │──│ - Heartbeat  │  │
│  │ - Aider      │  │ - Dedupe     │  │ - Auth token │  │
│  │ - Generic    │  │              │  │              │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
│                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ Talk-back    │  │ Local HTTP   │  │  Config      │  │
│  │ Receiver     │  │ Server       │  │  Manager     │  │
│  │              │  │              │  │              │  │
│  │ - Poll/WS    │  │ - :9473      │  │ - ~/.agentcast│ │
│  │ - Inject to  │  │ - Browser    │  │ - Project    │  │
│  │   agent stdin│  │   triggers   │  │   overrides  │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘
```

#### Hook Integration by Agent

| Agent | Hook Mechanism | Events Captured |
|-------|---------------|-----------------|
| **Claude Code** | `hooks.json` pre/post tool | prompt, tool_call, tool_result, file_write |
| **Composer** | Extension API / log watcher | composer actions, file edits, terminal |
| **Aider** | Git diff watcher + stdout parser | prompts, edits, commits |
| **Copilot** | VS Code extension | suggestions accepted, chat |
| **Generic** | PTY wrapper | stdin/stdout/stderr |

### 5.2 Event Schema

```typescript
interface SessionEvent {
  id: string;              // UUID v7 (time-sortable)
  session_id: string;
  sequence: number;        // Monotonic per session
  type: EventType;
  timestamp: number;       // Unix ms (client clock)
  server_timestamp: number;// Unix ms (server clock, authoritative)
  content: string;
  metadata?: {
    file?: string;
    language?: string;
    tool?: string;
    duration_ms?: number;
    lines_added?: number;
    lines_removed?: number;
    diff_hash?: string;    // For deduplication
  };
  redacted?: boolean;      // PII/secrets stripped
}

type EventType =
  | "session.start"
  | "session.end"
  | "prompt"
  | "thinking"
  | "tool_call"
  | "tool_result"
  | "file_read"
  | "file_write"
  | "file_delete"
  | "terminal"
  | "error"
  | "viewer_message"
  | "system";
```

### 5.3 Event Storage Strategy

```
Session: stellar-creek-6770
├── metadata (PostgreSQL)
│   ├── id, slug, title, creator_id, status, agent, model
│   ├── started_at, ended_at, view_count, tags
│   └── is_public, workspace_id
│
└── events (S3 + PostgreSQL index)
    ├── chunk-0000.json.gz  (events 0-999)
    ├── chunk-0001.json.gz  (events 1000-1999)
    └── index (PostgreSQL)
        ├── session_id, chunk_key, start_seq, end_seq, event_count
        └── Enables range queries without full S3 scan
```

**Why chunk?**
- Sessions can have 10K+ events (long streams)
- Replay loads only needed chunks (timeline scrub)
- S3 is cheaper than PostgreSQL for bulk append-only data

### 5.4 Real-Time Fan-out

```
                    ┌─────────────────┐
                    │  Ingest Service │
                    └────────┬────────┘
                             │ Publish
                             ▼
                    ┌─────────────────┐
                    │  Redis Pub/Sub  │
                    │  channel:       │
                    │  session:{id}   │
                    └────────┬────────┘
                             │
              ┌──────────────┼──────────────┐
              ▼              ▼              ▼
       ┌──────────┐   ┌──────────┐   ┌──────────┐
       │ WS Node 1│   │ WS Node 2│   │ WS Node 3│
       │ viewers: │   │ viewers: │   │ viewers: │
       │   150    │   │   200    │   │   100    │
       └──────────┘   └──────────┘   └──────────┘
```

**Presence tracking:**
```redis
SADD session:{id}:viewers {viewer_connection_id}
EXPIRE session:{id}:viewers 30  # Refreshed on heartbeat
SCARD session:{id}:viewers     # → viewer_count
```

### 5.5 Talk-Back Flow

```
Viewer                Web App              Redis Queue           CLI Daemon           Agent
  │                      │                      │                     │                  │
  │  POST /talkback      │                      │                     │                  │
  │─────────────────────▶│                      │                     │                  │
  │                      │  LPUSH talkback:{sid}│                     │                  │
  │                      │─────────────────────▶│                     │                  │
  │                      │                      │  BRPOP (blocking)   │                  │
  │                      │                      │────────────────────▶│                  │
  │                      │                      │                     │  Inject prompt   │
  │                      │                      │                     │─────────────────▶│
  │                      │                      │                     │                  │
  │                      │                      │                     │  New events flow │
  │                      │                      │                     │◀─────────────────│
  │  WS: new events      │                      │                     │                  │
  │◀─────────────────────│◀─────────────────────│◀────────────────────│                  │
```

**Permission model:**
- Talk-back requires creator opt-in (`allow_talkback: true`)
- Rate limited: 1 message per 30s per viewer
- Creator can moderate/block viewers

### 5.6 Search Index

```json
{
  "id": "s1",
  "slug": "stellar-creek-6770",
  "title": "JWT Auth Refactor",
  "creator_name": "Mukul Lohar",
  "creator_username": "mukul",
  "tags": ["go", "auth", "backend"],
  "agent": "claude-code",
  "model": "claude-sonnet-4",
  "status": "ended",
  "started_at": 1722594600,
  "view_count": 280,
  "event_summary": "Refactor auth module JWT refresh tokens middleware"
}
```

Indexed fields: `title`, `creator_name`, `creator_username`, `tags`, `event_summary`

---

## 6. Data Models

### 6.1 ER Diagram

```
┌──────────────┐       ┌──────────────┐       ┌──────────────┐
│    users     │       │   sessions   │       │    events    │
├──────────────┤       ├──────────────┤       ├──────────────┤
│ id (PK)      │──┐    │ id (PK)      │──┐    │ id (PK)      │
│ username     │  │    │ slug (UQ)    │  │    │ session_id   │──┐
│ email        │  └───▶│ creator_id   │  └───▶│ sequence     │  │
│ avatar_url   │       │ title        │       │ type         │  │
│ github_id    │       │ status       │       │ content      │  │
│ api_key_hash │       │ agent        │       │ metadata     │  │
│ created_at   │       │ model        │       │ timestamp    │  │
└──────────────┘       │ tags[]       │       └──────────────┘  │
                       │ view_count   │                          │
┌──────────────┐       │ started_at   │       ┌──────────────┐  │
│  workspaces  │       │ ended_at     │       │ event_chunks │  │
├──────────────┤       │ workspace_id │       ├──────────────┤  │
│ id (PK)      │──┐    │ is_public    │       │ session_id   │◀─┘
│ name         │  │    └──────────────┘       │ chunk_key    │
│ owner_id     │  │                           │ start_seq    │
│ plan         │  │    ┌──────────────┐       │ end_seq      │
└──────────────┘  └───▶│ (FK)         │       │ s3_path      │
                       │              │       └──────────────┘
┌──────────────┐       ┌──────────────┐
│  highlights  │       │ chat_messages│
├──────────────┤       ├──────────────┤
│ id (PK)      │       │ id (PK)      │
│ session_id   │       │ session_id   │
│ start_seq    │       │ user_id      │
│ end_seq      │       │ content      │
│ title        │       │ timestamp    │
│ clip_url     │       └──────────────┘
└──────────────┘
```

### 6.2 PostgreSQL Schema (Core Tables)

```sql
CREATE TABLE users (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username    VARCHAR(32) UNIQUE NOT NULL,
    email       VARCHAR(255) UNIQUE NOT NULL,
    display_name VARCHAR(100),
    avatar_url  TEXT,
    github_id   BIGINT UNIQUE,
    api_key_hash BYTEA,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE sessions (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug         VARCHAR(64) UNIQUE NOT NULL,
    creator_id   UUID REFERENCES users(id) NOT NULL,
    title        VARCHAR(255) NOT NULL,
    description  TEXT,
    status       VARCHAR(16) NOT NULL DEFAULT 'live',
    agent        VARCHAR(32) NOT NULL,
    model        VARCHAR(64),
    tags         TEXT[] DEFAULT '{}',
    view_count   INT DEFAULT 0,
    like_count   INT DEFAULT 0,
    project_path TEXT,
    machine_name TEXT,
    workspace_id UUID REFERENCES workspaces(id),
    is_public    BOOLEAN DEFAULT true,
    allow_talkback BOOLEAN DEFAULT false,
    started_at   TIMESTAMPTZ DEFAULT NOW(),
    ended_at     TIMESTAMPTZ,
    created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_sessions_creator ON sessions(creator_id);
CREATE INDEX idx_sessions_status ON sessions(status) WHERE status = 'live';
CREATE INDEX idx_sessions_started ON sessions(started_at DESC);

CREATE TABLE event_chunks (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id  UUID REFERENCES sessions(id) NOT NULL,
    chunk_index INT NOT NULL,
    start_seq   BIGINT NOT NULL,
    end_seq     BIGINT NOT NULL,
    event_count INT NOT NULL,
    s3_key      TEXT NOT NULL,
    size_bytes  INT,
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(session_id, chunk_index)
);
```

---

## 7. API Design

### 7.1 REST Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v1/sessions` | List sessions (filter, paginate) |
| `POST` | `/api/v1/sessions` | Create session (CLI auth) |
| `GET` | `/api/v1/sessions/:slug` | Get session + metadata |
| `PATCH` | `/api/v1/sessions/:slug` | Update title, visibility |
| `POST` | `/api/v1/sessions/:slug/end` | End session |
| `GET` | `/api/v1/sessions/:slug/events` | Get events (range query) |
| `POST` | `/api/v1/sessions/:slug/events` | Ingest events (CLI) |
| `GET` | `/api/v1/sessions/:slug/stream` | SSE live stream |
| `WS` | `/api/v1/sessions/:slug/ws` | WebSocket live stream |
| `POST` | `/api/v1/sessions/:slug/talkback` | Send talk-back message |
| `POST` | `/api/v1/sessions/:slug/chat` | Send chat message |
| `GET` | `/api/v1/sessions/:slug/chat` | Get chat history |
| `POST` | `/api/v1/sessions/:slug/highlights` | Create highlight clip |
| `GET` | `/api/v1/stats` | Platform statistics |
| `GET` | `/api/v1/search` | Full-text search |

### 7.2 Event Ingest (CLI → Server)

```http
POST /api/v1/sessions/:id/events
Authorization: Bearer <session_token>
Content-Type: application/json

{
  "events": [
    {
      "type": "file_write",
      "timestamp": 1722594612000,
      "content": "Wrote api/authn.go",
      "metadata": {
        "file": "api/authn.go",
        "language": "go",
        "lines_added": 87,
        "lines_removed": 34
      }
    }
  ]
}
```

**Response:** `202 Accepted` with `{ "ingested": 1, "last_sequence": 42 }`

### 7.3 SSE Stream Format

```
event: session_event
data: {"id":"e42","type":"file_write","content":"Wrote api/authn.go",...}

event: viewer_count
data: {"count": 23}

event: chat_message
data: {"username":"dev_jane","content":"Nice refactor!"}

event: heartbeat
data: {}
```

---

## 8. Real-Time Architecture

### 8.1 Transport Selection

| Use Case | Transport | Rationale |
|----------|-----------|-----------|
| Live event feed | SSE (primary) | Simpler, auto-reconnect, HTTP/2 multiplex |
| Live event feed (fallback) | WebSocket | Bidirectional for talk-back ack |
| Chat | WebSocket | Low-latency bidirectional |
| CLI ingest | HTTP POST (batched) | Reliable, retryable |
| Talk-back delivery | Redis BRPOP → CLI poll | Works through NAT/firewall |

### 8.2 Latency Budget

| Stage | Target (p95) |
|-------|-------------|
| Agent hook → CLI buffer | 5ms |
| CLI batch → Ingest API | 50ms (batch window) |
| Ingest → Redis publish | 10ms |
| Redis → WS gateway | 5ms |
| WS → Viewer browser | 50ms |
| **Total end-to-end** | **< 200ms** |

### 8.3 Consistency Model

- **Event ordering:** Per-session total order via monotonic `sequence`
- **Viewer count:** Eventually consistent (±2 viewers)
- **Chat:** Causal consistency within session
- **Replay:** Strong consistency (read from committed chunks)

---

## 9. Security & Privacy

### 9.1 Threat Model

| Threat | Mitigation |
|--------|-----------|
| Secret leakage in events | CLI-side redaction (API keys, .env patterns) |
| Unauthorized stream injection | Per-session HMAC token, rate limiting |
| Talk-back abuse | Rate limits, creator moderation, opt-in |
| Session hijacking | Short-lived tokens, IP binding optional |
| DDoS on live sessions | Cloudflare, per-IP rate limits |

### 9.2 Secret Redaction (CLI)

```go
var secretPatterns = []*regexp.Regexp{
    regexp.MustCompile(`(?i)(api[_-]?key|secret|token|password)\s*[:=]\s*\S+`),
    regexp.MustCompile(`sk-[a-zA-Z0-9]{20,}`),
    regexp.MustCompile(`ghp_[a-zA-Z0-9]{36}`),
    regexp.MustCompile(`AKIA[0-9A-Z]{16}`),
}
```

### 9.3 Data Retention

| Data | Retention | Deletion |
|------|-----------|----------|
| Public sessions | Indefinite | User request |
| Private sessions | 90 days (free) | Auto or manual |
| Chat messages | Same as session | Cascade delete |
| API logs | 30 days | Auto |

---

## 10. Scalability & Performance

### 10.1 Capacity Estimates

| Metric | Year 1 Target | Scaling Trigger |
|--------|--------------|-----------------|
| Concurrent live sessions | 100 | Add ingest replicas |
| Viewers per session | 1,000 | Shard WS by session |
| Events per second (platform) | 10,000 | Kafka instead of Redis Pub/Sub |
| Total sessions stored | 1M | S3 lifecycle policies |
| Search queries/sec | 500 | Meilisearch replicas |

### 10.2 Scaling Strategies

```
Phase 1 (MVP):     Single region, 1 ingest, 1 WS node, managed PG
Phase 2 (Growth):  Horizontal WS nodes, Redis cluster, CDN for replays
Phase 3 (Scale):   Multi-region, Kafka event bus, edge WS (Cloudflare Durable Objects)
```

### 10.3 Caching Layers

| Layer | What | TTL |
|-------|------|-----|
| CDN | Static assets, embed player | 1 year |
| CDN | Session metadata (public) | 60s |
| Redis | Live session state | Session duration |
| Redis | Viewer count | 30s |
| App | User profile | 5 min |

---

## 11. Deployment Architecture

### 11.1 Production Topology

```
                        ┌─────────────┐
                        │ Cloudflare  │
                        │ CDN + WAF   │
                        └──────┬──────┘
                               │
              ┌────────────────┼────────────────┐
              ▼                ▼                ▼
       ┌────────────┐  ┌────────────┐  ┌────────────┐
       │  Vercel    │  │  Fly.io    │  │  Fly.io    │
       │  (Web App) │  │  (Ingest)  │  │  (WS GW)   │
       └────────────┘  └────────────┘  └────────────┘
                               │
              ┌────────────────┼────────────────┐
              ▼                ▼                ▼
       ┌────────────┐  ┌────────────┐  ┌────────────┐
       │  Neon      │  │  Upstash   │  │  R2        │
       │  PostgreSQL│  │  Redis     │  │  (S3)      │
       └────────────┘  └────────────┘  └────────────┘
```

### 11.2 Self-Hosted (Docker Compose)

```yaml
services:
  web:
    image: agentcast/web:latest
    ports: ["3000:3000"]
  ingest:
    image: agentcast/ingest:latest
    ports: ["8080:8080"]
  ws:
    image: agentcast/ws:latest
    ports: ["8081:8081"]
  postgres:
    image: postgres:16
  redis:
    image: redis:7
  meilisearch:
    image: getmeili/meilisearch:latest
```

---

## 12. Future Roadmap

### Phase 1 — MVP (Current)
- [x] Landing page with session feed
- [x] Session replay viewer
- [x] Mock API + SSE endpoint
- [x] Feature comparison UI
- [ ] CLI prototype (Go)
- [ ] GitHub OAuth

### Phase 2 — Core Platform
- [ ] Real ingest service
- [ ] Claude Code hook integration
- [ ] Live WebSocket streaming
- [ ] Talk-back pipeline
- [ ] Session search

### Phase 3 — Growth Features
- [ ] Multi-agent support (Composer, Aider)
- [ ] Session highlights/clips
- [ ] Embeddable player
- [ ] Team workspaces
- [ ] Analytics dashboard

### Phase 4 — Enterprise
- [ ] SSO (SAML/OIDC)
- [ ] Audit logs
- [ ] On-prem deployment
- [ ] Custom retention policies
- [ ] SLA guarantees

---

## Appendix A: CLI Architecture

The AgentCast CLI (`cli/index.ts`) provides terminal-based event streaming:

| Command | Description |
|---------|-------------|
| `login <email> <password>` | Authenticate and save API token to `~/.agentcast/config.json` |
| `stream --title --agent` | Create session and enter interactive event mode |
| `send --slug --type --content` | Send a single event to an existing session |
| `poll --slug` | Poll for undelivered talk-back messages |

Events are sent via `POST /api/sessions/:slug/events` with Bearer token auth (API token or stream token).

---

## Appendix B: Glossary

| Term | Definition |
|------|-----------|
| **Agent** | AI coding assistant (Claude Code, Composer, etc.) |
| **Session** | A single agent run from start to end |
| **Event** | Atomic unit in the session timeline (prompt, file write, etc.) |
| **Talk-back** | Viewer message injected into a live agent session |
| **Highlight** | User-created clip from a session time range |
| **Daemon** | Background process that bridges agent hooks to cloud |

---

*End of document*
