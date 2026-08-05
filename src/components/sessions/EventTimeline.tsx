"use client";

import { getAgentLabel } from "@/lib/agents";

export interface TimelineItem {
  id: string;
  type: string;
  content: string;
  timestamp: number;
  sequence?: number;
  metadata?: Record<string, unknown> | null;
  username?: string;
  isAgent?: boolean;
}

function formatClock(ms: number) {
  return new Date(ms).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function getSpeaker(item: TimelineItem, agentName: string) {
  if (item.type === "viewer_message" || item.username) {
    const name = item.username || "viewer";
    return { label: `@${name.toUpperCase()} · VIEWER`, variant: "viewer" as const };
  }
  if (item.type === "agent_reply" || item.isAgent) {
    return { label: agentName.toUpperCase(), variant: "agent" as const };
  }
  if (item.type === "prompt") {
    return { label: "PROMPT", variant: "prompt" as const };
  }
  if (item.type === "system") {
    return { label: "SYSTEM", variant: "system" as const };
  }
  return { label: item.type.replace(/_/g, " ").toUpperCase(), variant: "agent" as const };
}

const variantStyles = {
  viewer: "border-l-orange-400 bg-orange-500/5",
  agent: "border-l-teal-400 bg-teal-500/5",
  prompt: "border-l-indigo-400 bg-indigo-500/5",
  system: "border-l-slate-400 bg-slate-500/5",
};

interface EventTimelineProps {
  items: TimelineItem[];
  agent: string;
  model?: string | null;
}

export function EventTimeline({ items, agent, model }: EventTimelineProps) {
  const agentName = getAgentLabel(agent);

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-[var(--color-text-muted)] text-sm gap-2">
        <p>Waiting for events…</p>
        <p className="text-xs">Stream from CLI or use the Stream Panel to push events live.</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-[var(--color-border)]">
      <div className="px-4 py-3 border-b border-[var(--color-border)] bg-[var(--color-bg-subtle)] flex items-center justify-between">
        <span className="text-xs font-semibold tracking-wider text-[var(--color-text-muted)]">EVENT LOG</span>
        <span className="text-xs text-[var(--color-text-muted)]">
          {agentName}{model ? ` · ${model}` : ""} · {items.length} events
        </span>
      </div>

      <div className="p-3 space-y-3 max-h-[600px] overflow-y-auto">
        {items.map((item) => {
          const speaker = getSpeaker(item, agentName);
          const style = variantStyles[speaker.variant];

          return (
            <div
              key={item.id}
              className={`rounded-lg border border-[var(--color-border)] border-l-4 p-4 ${style}`}
            >
              <div className="flex items-center justify-between gap-2 mb-2">
                <span
                  className="text-xs font-bold tracking-wide text-[var(--color-text-secondary)]"
                  style={{ fontFamily: "var(--font-ibm-plex-mono)" }}
                >
                  {speaker.label}
                </span>
                <span
                  className="text-xs text-[var(--color-text-muted)] shrink-0"
                  style={{ fontFamily: "var(--font-ibm-plex-mono)" }}
                >
                  {formatClock(item.timestamp)}
                </span>
              </div>

              {item.metadata?.replyTo != null && (
                <p className="text-xs text-[var(--color-text-muted)] mb-2 italic">
                  Replying to: {String(item.metadata.replyTo)}
                </p>
              )}

              <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{item.content}</p>

              {item.metadata?.file != null && (
                <div className="mt-2 flex items-center gap-2 text-xs font-mono text-[var(--color-text-muted)]" style={{ fontFamily: "var(--font-ibm-plex-mono)" }}>
                  <span>{String(item.metadata.file)}</span>
                  {item.metadata.linesAdded !== undefined && (
                    <span className="text-[var(--color-success)]">+{String(item.metadata.linesAdded)}</span>
                  )}
                  {item.metadata.linesRemoved ? (
                    <span className="text-[var(--color-danger)]">−{String(item.metadata.linesRemoved)}</span>
                  ) : null}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
