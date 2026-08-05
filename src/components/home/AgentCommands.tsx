"use client";

import { useState } from "react";
import { Copy, Check, Terminal } from "lucide-react";
import { AGENTS, AGENT_INSTALL_HINTS } from "@/lib/agents";

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
      className="p-1.5 rounded-md hover:bg-[var(--color-surface-hover)] text-[var(--color-text-muted)] shrink-0"
      aria-label="Copy command"
    >
      {copied ? <Check className="h-3.5 w-3.5 text-[var(--color-success)]" /> : <Copy className="h-3.5 w-3.5" />}
    </button>
  );
}

export function AgentCommands() {
  return (
    <section id="agents" className="py-16 border-t border-[var(--color-border)]">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="text-center mb-10">
          <h2 className="text-2xl font-bold mb-2" style={{ fontFamily: "var(--font-outfit)" }}>
            Supported agents & commands
          </h2>
          <p className="text-[var(--color-text-muted)] max-w-2xl mx-auto mb-6">
            Install once, pick your agent, stream live. Browser sign-in — no API tokens.
          </p>
          <div className="inline-flex items-center gap-2 rounded-xl bg-[var(--color-bg)] border border-[var(--color-border)] px-4 py-2.5 max-w-full">
            <Terminal className="h-4 w-4 text-[var(--color-text-muted)] shrink-0" />
            <code className="text-xs sm:text-sm font-mono text-[var(--color-primary)] truncate" style={{ fontFamily: "var(--font-ibm-plex-mono)" }}>
              curl -fsSL https://agentcast-6mf3.onrender.com/install.sh | bash
            </code>
            <CopyBtn text="curl -fsSL https://agentcast-6mf3.onrender.com/install.sh | bash" />
          </div>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {AGENTS.map((agent) => {
            const cmd = `agentcast ${agent.command}`;
            const install = AGENT_INSTALL_HINTS[agent.command];
            return (
              <div key={agent.id} className="card p-5">
                <div className="flex items-center gap-2 mb-3">
                  <span
                    className="h-2.5 w-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: agent.color }}
                  />
                  <h3 className="font-semibold text-sm">{agent.label}</h3>
                </div>

                <div className="flex items-center gap-2 rounded-lg bg-[var(--color-bg)] border border-[var(--color-border)] p-2 mb-3">
                  <Terminal className="h-3.5 w-3.5 text-[var(--color-text-muted)] shrink-0" />
                  <code
                    className="text-xs font-mono flex-1 overflow-x-auto whitespace-nowrap"
                    style={{ fontFamily: "var(--font-ibm-plex-mono)" }}
                  >
                    {cmd}
                  </code>
                  <CopyBtn text={cmd} />
                </div>

                {install && (
                  <p className="text-xs text-[var(--color-text-muted)] leading-relaxed">
                    <span className="text-[var(--color-text-secondary)]">Prerequisite:</span>{" "}
                    <code className="text-[10px]">{install}</code>
                  </p>
                )}
              </div>
            );
          })}
        </div>

        <p className="text-center text-sm text-[var(--color-text-muted)] mt-8">
          Generic stream:{" "}
          <code className="text-[var(--color-primary)]">agentcast stream --agent grok --title &quot;My build&quot;</code>
        </p>
      </div>
    </section>
  );
}
