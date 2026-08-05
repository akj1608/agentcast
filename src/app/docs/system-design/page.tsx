import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function SystemDesignPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 py-10">
      <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)] mb-6">
        <ArrowLeft className="h-4 w-4" /> Home
      </Link>
      <h1 className="text-3xl font-bold mb-2" style={{ fontFamily: "var(--font-outfit)" }}>System Design</h1>
      <p className="text-[var(--color-text-muted)] mb-8">
        Full architecture documentation is in <code className="text-[var(--color-primary)]">docs/SYSTEM_DESIGN.md</code>
      </p>

      <div className="card p-6 mb-6">
        <h2 className="font-semibold mb-4">Architecture overview</h2>
        <pre className="text-xs font-mono text-[var(--color-text-secondary)] overflow-x-auto leading-relaxed" style={{ fontFamily: "var(--font-ibm-plex-mono)" }}>
{`┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  AI Agents   │     │  CLI / API   │     │   Ingest     │
│ Claude/Composer│────▶│  (events)    │────▶│   Service    │
└──────────────┘     └──────────────┘     └──────┬───────┘
                                                  │
                     ┌──────────────┐     ┌───────▼───────┐
                     │   Viewers    │◀────│  WebSocket    │
                     │  (Browser)   │     │  Gateway      │
                     └──────────────┘     └───────────────┘
                                                  │
                           ┌──────────────────────┼──────────┐
                           ▼                      ▼          ▼
                    ┌──────────┐          ┌──────────┐ ┌────────┐
                    │ SQLite   │          │ Event Bus│ │  Auth  │
                    │ (Prisma) │          │ (memory) │ │ (JWT)  │
                    └──────────┘          └──────────┘ └────────┘`}
        </pre>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        {[
          { title: "High-Level Design", desc: "Context diagrams, container architecture, request flows" },
          { title: "Low-Level Design", desc: "Event schema, storage strategy, WebSocket fan-out" },
          { title: "Data Models", desc: "Prisma schema, ER relationships" },
          { title: "API Design", desc: "REST endpoints, WebSocket protocol" },
          { title: "Real-Time", desc: "SSE/WebSocket transport, latency budget" },
          { title: "Security", desc: "Auth, API tokens, secret redaction" },
        ].map((item) => (
          <div key={item.title} className="card p-4">
            <h3 className="font-medium text-[var(--color-primary)]">{item.title}</h3>
            <p className="text-sm text-[var(--color-text-muted)] mt-1">{item.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
