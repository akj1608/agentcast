import Link from "next/link";
import { ArrowLeft, Terminal } from "lucide-react";
import { AGENTS, AGENT_INSTALL_HINTS } from "@/lib/agents";
import { SITE_URL } from "@/lib/site";

export default function CliDocsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-10">
      <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)] mb-6">
        <ArrowLeft className="h-4 w-4" /> Dashboard
      </Link>
      <h1 className="text-3xl font-bold mb-2" style={{ fontFamily: "var(--font-outfit)" }}>CLI Reference</h1>
      <p className="text-[var(--color-text-muted)] mb-8">Stream AI agent sessions from your terminal — works from any directory</p>

      <div className="space-y-6">
        <section className="card p-6 border-[var(--color-primary)]/20">
          <h2 className="font-semibold mb-3 flex items-center gap-2">
            <Terminal className="h-4 w-4 text-[var(--color-primary)]" /> Quick install
          </h2>
          <pre className="text-sm font-mono bg-[var(--color-bg)] p-4 rounded-lg border border-[var(--color-border)] overflow-x-auto" style={{ fontFamily: "var(--font-ibm-plex-mono)" }}>
{`curl -fsSL ${SITE_URL}/install.sh | bash
agentshow login    # browser sign-in (one time)
agentshow grok     # or claude, cursor, codex, gemini, …
agentshow agents   # full list + install hints`}
          </pre>
        </section>

        <section className="card p-6">
          <h2 className="font-semibold mb-4">Supported agents</h2>
          <div className="space-y-4">
            {AGENTS.map((agent) => (
              <div key={agent.id} className="border-b border-[var(--color-border)] pb-4 last:border-0 last:pb-0">
                <p className="font-medium text-sm mb-1">{agent.label}</p>
                <code className="text-xs text-[var(--color-primary)] block mb-1">agentshow {agent.command}</code>
                <p className="text-xs text-[var(--color-text-muted)]">
                  Prerequisite: {AGENT_INSTALL_HINTS[agent.command]}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="card p-6">
          <h2 className="font-semibold mb-3">Manual event stream</h2>
          <pre className="text-sm font-mono bg-[var(--color-bg)] p-4 rounded-lg border border-[var(--color-border)] overflow-x-auto" style={{ fontFamily: "var(--font-ibm-plex-mono)" }}>
{`agentshow stream --agent grok --title "My build"
# TYPE|content  or plain text for prompts
prompt|Refactor auth to use JWT
quit`}
          </pre>
        </section>
      </div>
    </div>
  );
}
