"use client";

import { useState, useEffect } from "react";
import { Scissors, Plus, Share2, Check, Loader2 } from "lucide-react";

interface Highlight {
  id: string;
  title: string;
  startSeq: number;
  endSeq: number;
  createdAt: string;
}

interface HighlightsPanelProps {
  sessionSlug: string;
  isOwner: boolean;
  minSeq: number;
  maxSeq: number;
  activeHighlightId?: string | null;
  onSelectHighlight?: (id: string | null) => void;
}

export function HighlightsPanel({
  sessionSlug,
  isOwner,
  minSeq,
  maxSeq,
  activeHighlightId,
  onSelectHighlight,
}: HighlightsPanelProps) {
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [startSeq, setStartSeq] = useState(minSeq);
  const [endSeq, setEndSeq] = useState(maxSeq);
  const [copied, setCopied] = useState<string | null>(null);

  const load = () => {
    fetch(`/api/sessions/${sessionSlug}/highlights`)
      .then((r) => r.json())
      .then((d) => setHighlights(d.highlights || []))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [sessionSlug]);

  useEffect(() => {
    if (maxSeq >= minSeq) {
      setStartSeq((s) => Math.max(minSeq, Math.min(s, maxSeq)));
      setEndSeq((e) => Math.max(minSeq, Math.min(e, maxSeq)));
    }
  }, [minSeq, maxSeq]);

  const createHighlight = async () => {
    if (!title.trim() || startSeq > endSeq) return;
    setCreating(true);
    try {
      const res = await fetch(`/api/sessions/${sessionSlug}/highlights`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim(), startSeq, endSeq }),
      });
      if (res.ok) {
        setTitle("");
        setShowForm(false);
        load();
      }
    } finally {
      setCreating(false);
    }
  };

  const shareUrl = (id: string) => {
    const base = typeof window !== "undefined" ? window.location.origin : "";
    return `${base}/session/${sessionSlug}?highlight=${id}`;
  };

  const copyLink = async (id: string) => {
    const url = shareUrl(id);
    await navigator.clipboard.writeText(url);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  if (loading) {
    return (
      <div className="card p-4 text-sm text-[var(--color-text-muted)] flex items-center gap-2">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading highlights…
      </div>
    );
  }

  return (
    <div className="card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm flex items-center gap-1.5">
          <Scissors className="h-4 w-4 text-[var(--color-primary)]" />
          Highlights
        </h3>
        {isOwner && maxSeq >= minSeq && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="text-xs text-[var(--color-primary)] font-medium hover:underline flex items-center gap-1"
          >
            <Plus className="h-3 w-3" />
            Clip moment
          </button>
        )}
      </div>

      {showForm && isOwner && (
        <div className="rounded-lg border border-[var(--color-border)] p-3 space-y-3 bg-[var(--color-bg)]">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Highlight title…"
            className="input !py-2 text-sm w-full"
          />
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-[var(--color-text-muted)]">From event #</label>
              <input
                type="number"
                min={minSeq}
                max={maxSeq}
                value={startSeq}
                onChange={(e) => setStartSeq(Number(e.target.value))}
                className="input !py-1.5 text-sm w-full mt-1"
              />
            </div>
            <div>
              <label className="text-xs text-[var(--color-text-muted)]">To event #</label>
              <input
                type="number"
                min={minSeq}
                max={maxSeq}
                value={endSeq}
                onChange={(e) => setEndSeq(Number(e.target.value))}
                className="input !py-1.5 text-sm w-full mt-1"
              />
            </div>
          </div>
          <button
            onClick={createHighlight}
            disabled={creating || !title.trim() || startSeq > endSeq}
            className="btn-primary w-full !py-2 text-sm disabled:opacity-50"
          >
            {creating ? "Saving…" : "Save highlight"}
          </button>
        </div>
      )}

      {highlights.length === 0 ? (
        <p className="text-xs text-[var(--color-text-muted)]">
          {isOwner
            ? "Clip key moments from your session to share short replays."
            : "No highlights yet."}
        </p>
      ) : (
        <ul className="space-y-2">
          {highlights.map((h) => {
            const active = activeHighlightId === h.id;
            return (
              <li
                key={h.id}
                className={`rounded-lg border p-2.5 transition-colors ${
                  active
                    ? "border-[var(--color-primary)] bg-[var(--color-primary-light)]"
                    : "border-[var(--color-border)] hover:border-[var(--color-primary)]/40"
                }`}
              >
                <button
                  type="button"
                  onClick={() => onSelectHighlight?.(active ? null : h.id)}
                  className="w-full text-left"
                >
                  <p className="text-sm font-medium truncate">{h.title}</p>
                  <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                    Events {h.startSeq}–{h.endSeq} · {h.endSeq - h.startSeq + 1} steps
                  </p>
                </button>
                <button
                  onClick={() => copyLink(h.id)}
                  className="mt-2 text-xs text-[var(--color-primary)] flex items-center gap-1 hover:underline"
                >
                  {copied === h.id ? (
                    <>
                      <Check className="h-3 w-3" /> Copied!
                    </>
                  ) : (
                    <>
                      <Share2 className="h-3 w-3" /> Share clip
                    </>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
