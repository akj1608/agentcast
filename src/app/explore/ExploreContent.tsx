"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { SessionCard, type SessionData } from "@/components/sessions/SessionCard";
import { Search, Filter } from "lucide-react";

import { AGENTS } from "@/lib/agents";

const AGENT_OPTIONS = [{ value: "", label: "All agents" }, ...AGENTS.map((a) => ({ value: a.id, label: a.label }))];

export default function ExploreContent() {
  const searchParams = useSearchParams();
  const [sessions, setSessions] = useState<SessionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [status, setStatus] = useState(searchParams.get("status") || "");
  const [agent, setAgent] = useState(searchParams.get("agent") || "");

  useEffect(() => {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (status) params.set("status", status);
    if (agent) params.set("agent", agent);

    setLoading(true);
    fetch(`/api/sessions?${params}`)
      .then((r) => r.json())
      .then((data) => {
        setSessions(data.sessions || []);
        setLoading(false);
      });
  }, [query, status, agent]);

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-10">
      <h1 className="text-3xl font-bold mb-1" style={{ fontFamily: "var(--font-outfit)" }}>
        Explore
      </h1>
      <p className="text-[var(--color-text-muted)] mb-8">Discover live and recorded AI agent sessions</p>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-text-muted)]" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search sessions, tags…"
            className="input pl-10"
          />
        </div>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="input !w-auto">
          <option value="">All status</option>
          <option value="live">Live</option>
          <option value="ended">Replay</option>
        </select>
        <select value={agent} onChange={(e) => setAgent(e.target.value)} className="input !w-auto">
          {AGENT_OPTIONS.map((a) => (
            <option key={a.value} value={a.value}>{a.label}</option>
          ))}
        </select>
      </div>

      <p className="text-sm text-[var(--color-text-muted)] mb-5">
        {loading ? "Loading…" : `${sessions.length} session${sessions.length !== 1 ? "s" : ""}`}
      </p>

      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="card h-64 animate-pulse bg-[var(--color-bg-subtle)]" />
          ))}
        </div>
      ) : sessions.length === 0 ? (
        <div className="card p-16 text-center">
          <Filter className="h-8 w-8 mx-auto mb-3 text-[var(--color-text-muted)] opacity-40" />
          <p className="text-[var(--color-text-muted)]">No sessions match your filters</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {sessions.map((s, i) => (
            <SessionCard key={s.id} session={s} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}
