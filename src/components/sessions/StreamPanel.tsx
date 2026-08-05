"use client";

import { useState } from "react";
import { Send, Zap, Check } from "lucide-react";
import type { SessionEvent } from "@/hooks/useSessionLive";

const EVENT_TYPES = [
  "prompt",
  "thinking",
  "tool_call",
  "tool_result",
  "file_write",
  "file_read",
  "terminal",
  "error",
  "system",
];

interface StreamPanelProps {
  sessionSlug: string;
  onEventSent?: (event: SessionEvent) => void;
}

export function StreamPanel({ sessionSlug, onEventSent }: StreamPanelProps) {
  const [type, setType] = useState("prompt");
  const [content, setContent] = useState("");
  const [file, setFile] = useState("");
  const [sending, setSending] = useState(false);
  const [lastError, setLastError] = useState("");
  const [lastSuccess, setLastSuccess] = useState(false);

  const send = async () => {
    if (!content.trim() || sending) return;
    setSending(true);
    setLastError("");
    setLastSuccess(false);
    try {
      const metadata = file.trim()
        ? { file: file.trim(), linesAdded: 10, linesRemoved: 0 }
        : undefined;

      const res = await fetch(`/api/sessions/${sessionSlug}/events`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          events: [{ type, content: content.trim(), metadata }],
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send event");

      // Optimistic update — show event immediately in feed
      const optimistic: SessionEvent = {
        id: `opt-${Date.now()}`,
        sequence: data.lastSequence ?? Date.now(),
        type,
        content: content.trim(),
        metadata: metadata ?? null,
        timestamp: Date.now(),
      };
      onEventSent?.(optimistic);

      setContent("");
      setLastSuccess(true);
      setTimeout(() => setLastSuccess(false), 2000);

      // Refetch latest events to get real IDs
      const fresh = await fetch(`/api/sessions/${sessionSlug}/events`);
      if (fresh.ok) {
        const { events } = await fresh.json();
        const latest = events[events.length - 1];
        if (latest) onEventSent?.(latest);
      }
    } catch (err) {
      setLastError(err instanceof Error ? err.message : "Send failed");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="card p-4 border-[var(--color-primary)]/30 bg-[var(--color-primary-light)]/30">
      <h3 className="font-semibold text-sm mb-1 flex items-center gap-2">
        <Zap className="h-4 w-4 text-[var(--color-primary)]" />
        Stream events
        {lastSuccess && (
          <span className="text-xs text-[var(--color-success)] flex items-center gap-1">
            <Check className="h-3 w-3" /> Sent
          </span>
        )}
      </h3>
      <p className="text-xs text-[var(--color-text-muted)] mb-3">
        Push events to your live session. Viewers see them instantly.
      </p>

      <div className="space-y-2">
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="input !py-2 text-sm"
        >
          {EVENT_TYPES.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
        <input
          type="text"
          value={file}
          onChange={(e) => setFile(e.target.value)}
          placeholder="File path (optional, e.g. src/auth.ts)"
          className="input !py-2 text-sm font-mono"
          style={{ fontFamily: "var(--font-ibm-plex-mono)" }}
        />
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) void send();
          }}
          placeholder="Event content… (⌘+Enter to send)"
          className="input min-h-[80px] text-sm resize-none"
        />
        {lastError && (
          <p className="text-xs text-[var(--color-danger)]">{lastError}</p>
        )}
        <button
          onClick={() => void send()}
          disabled={sending || !content.trim()}
          className="btn-primary w-full flex items-center justify-center gap-2 !py-2.5 disabled:opacity-50"
        >
          <Send className="h-4 w-4" />
          {sending ? "Sending…" : "Send event"}
        </button>
      </div>
    </div>
  );
}
