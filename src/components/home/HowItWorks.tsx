"use client";

import { useState } from "react";
import { Copy, Check, Terminal } from "lucide-react";
import { SITE_URL } from "@/lib/site";

const INSTALL_CMD = `curl -fsSL ${SITE_URL}/install.sh | bash`;

const steps = [
  {
    step: "01",
    title: "Install the CLI",
    command: INSTALL_CMD,
    desc: "One command installs AgentCast and signs you in via browser — no tokens to copy.",
  },
  {
    step: "02",
    title: "Run a session",
    command: "agentcast claude",
    desc: "Wraps Claude Code and streams your session live. Sign in once with agentcast login if needed.",
  },
  {
    step: "03",
    title: "Watch it here",
    command: "agentcast.io/session/your-session",
    desc: "Your session streams live and lands in your dashboard — share a private link or publish to the feed.",
  },
];

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
      className="p-1.5 rounded-md hover:bg-[var(--color-surface-hover)] text-[var(--color-text-muted)]"
      aria-label="Copy command"
    >
      {copied ? <Check className="h-3.5 w-3.5 text-[var(--color-success)]" /> : <Copy className="h-3.5 w-3.5" />}
    </button>
  );
}

export function HowItWorks() {
  return (
    <section id="get-started" className="py-16 bg-[var(--color-bg-subtle)]">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="text-center mb-10">
          <h2 className="text-2xl font-bold mb-2" style={{ fontFamily: "var(--font-outfit)" }}>
            Stream your first session
          </h2>
          <p className="text-[var(--color-text-muted)]">
            Install once, then stream Claude, Cursor, Grok, Codex, Gemini, and more
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-5">
          {steps.map(({ step, title, command, desc }) => (
            <div key={step} className="card p-6">
              <span className="text-xs font-bold text-[var(--color-primary)] tracking-widest">{step}</span>
              <h3 className="font-semibold mt-2 mb-2">{title}</h3>
              <p className="text-sm text-[var(--color-text-muted)] mb-4 leading-relaxed">{desc}</p>
              <div className="flex items-center gap-2 rounded-lg bg-[var(--color-bg)] border border-[var(--color-border)] p-2.5">
                <Terminal className="h-3.5 w-3.5 text-[var(--color-text-muted)] shrink-0" />
                <code className="text-xs font-mono flex-1 overflow-x-auto whitespace-nowrap" style={{ fontFamily: "var(--font-ibm-plex-mono)" }}>
                  {command}
                </code>
                <CopyBtn text={command} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
