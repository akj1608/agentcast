"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { SITE_URL } from "@/lib/site";
import {
  Plus,
  Radio,
  Copy,
  Check,
  Terminal,
  Trash2,
  ExternalLink,
} from "lucide-react";

interface DashboardSession {
  id: string;
  slug: string;
  title: string;
  status: string;
  agent: string;
  viewCount: number;
  likeCount: number;
  startedAt: string;
}

interface DashboardData {
  user: {
    apiToken: string;
    displayName: string;
    username: string;
  };
  sessions: DashboardSession[];
}

import { AGENTS } from "@/lib/agents";

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [newSession, setNewSession] = useState({
    title: "",
    agent: "claude-code",
    model: "",
    tags: "",
    description: "",
  });

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  const load = () => {
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      });
  };

  useEffect(() => {
    if (user) load();
  }, [user]);

  const createSession = async () => {
    if (!newSession.title.trim()) return;
    setCreating(true);
    try {
      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newSession.title,
          agent: newSession.agent,
          model: newSession.model || undefined,
          tags: newSession.tags.split(",").map((t) => t.trim()).filter(Boolean),
          description: newSession.description || undefined,
        }),
      });
      const result = await res.json();
      if (res.ok) {
        setShowCreate(false);
        setNewSession({ title: "", agent: "claude-code", model: "", tags: "", description: "" });
        router.push(`/session/${result.session.slug}`);
      }
    } finally {
      setCreating(false);
    }
  };

  const endSession = async (slug: string) => {
    await fetch(`/api/sessions/${slug}`, { method: "DELETE" });
    load();
  };

  const copyToken = () => {
    if (data?.user.apiToken) {
      navigator.clipboard.writeText(data.user.apiToken);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (authLoading || loading) {
    return <div className="p-10 text-center text-[var(--color-text-muted)]">Loading dashboard…</div>;
  }

  if (!data) return null;

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold" style={{ fontFamily: "var(--font-outfit)" }}>
            Dashboard
          </h1>
          <p className="text-[var(--color-text-muted)]">Manage your streaming sessions</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-2">
          <Plus className="h-4 w-4" /> New session
        </button>
      </div>

      <div className="grid lg:grid-cols-3 gap-5 mb-8">
        <div className="card p-5 lg:col-span-2">
          <h2 className="font-semibold mb-3 flex items-center gap-2">
            <Terminal className="h-4 w-4 text-[var(--color-primary)]" />
            CLI setup
          </h2>
          <p className="text-sm text-[var(--color-text-muted)] mb-4">
            Use your API token to stream events from the command line.
          </p>
          <div className="space-y-2">
            <div className="flex items-center gap-2 rounded-lg bg-[var(--color-bg)] border border-[var(--color-border)] p-3">
              <code className="text-xs font-mono flex-1 truncate" style={{ fontFamily: "var(--font-ibm-plex-mono)" }}>
                export AGENTSHOW_TOKEN={data.user.apiToken}
              </code>
              <button onClick={copyToken} className="p-1.5 rounded hover:bg-[var(--color-surface-hover)]">
                {copied ? <Check className="h-4 w-4 text-[var(--color-success)]" /> : <Copy className="h-4 w-4" />}
              </button>
            </div>
            <code className="block text-xs font-mono text-[var(--color-text-muted)] p-3 bg-[var(--color-bg)] rounded-lg border border-[var(--color-border)]" style={{ fontFamily: "var(--font-ibm-plex-mono)" }}>
              {`curl -fsSL ${SITE_URL}/install.sh | bash\nagentshow login your@email.com\nagentshow stream --title "My Session" --agent claude`}
            </code>
          </div>
          <Link href="/docs/cli" className="text-sm text-[var(--color-primary)] mt-3 inline-block hover:underline">
            View CLI documentation →
          </Link>
        </div>

        <div className="card p-5">
          <h2 className="font-semibold mb-3">Your stats</h2>
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-[var(--color-text-muted)]">Total sessions</dt>
              <dd className="font-semibold">{data.sessions.length}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-[var(--color-text-muted)]">Live now</dt>
              <dd className="font-semibold text-[var(--color-live)]">
                {data.sessions.filter((s) => s.status === "live").length}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-[var(--color-text-muted)]">Total views</dt>
              <dd className="font-semibold">
                {data.sessions.reduce((a, s) => a + s.viewCount, 0)}
              </dd>
            </div>
          </dl>
        </div>
      </div>

      <h2 className="font-semibold mb-4">Your sessions</h2>
      {data.sessions.length === 0 ? (
        <div className="card p-12 text-center">
          <p className="text-[var(--color-text-muted)] mb-4">No sessions yet. Create your first one!</p>
          <button onClick={() => setShowCreate(true)} className="btn-primary">Create session</button>
        </div>
      ) : (
        <div className="space-y-2">
          {data.sessions.map((session) => (
            <div key={session.id} className="card p-4 flex items-center justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  {session.status === "live" && (
                    <span className="flex items-center gap-1 text-xs text-[var(--color-live)] font-semibold">
                      <Radio className="h-3 w-3 live-dot" /> LIVE
                    </span>
                  )}
                  <span className="text-xs text-[var(--color-text-muted)]">{session.agent}</span>
                </div>
                <Link
                  href={`/session/${session.slug}`}
                  className="font-medium hover:text-[var(--color-primary)] truncate block"
                >
                  {session.title}
                </Link>
                <p className="text-xs text-[var(--color-text-muted)]">
                  {session.viewCount} views · {session.likeCount} likes
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Link href={`/session/${session.slug}`} className="btn-secondary !p-2">
                  <ExternalLink className="h-4 w-4" />
                </Link>
                {session.status === "live" && (
                  <button
                    onClick={() => endSession(session.slug)}
                    className="btn-secondary !p-2 text-[var(--color-danger)]"
                    title="End session"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreate && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="card w-full max-w-md p-6">
            <h2 className="text-lg font-bold mb-4">New session</h2>
            <div className="space-y-3">
              <input
                className="input"
                placeholder="Session title"
                value={newSession.title}
                onChange={(e) => setNewSession({ ...newSession, title: e.target.value })}
              />
              <select
                className="input"
                value={newSession.agent}
                onChange={(e) => setNewSession({ ...newSession, agent: e.target.value })}
              >
                {AGENTS.map((a) => (
                  <option key={a.id} value={a.id}>{a.label}</option>
                ))}
              </select>
              <input
                className="input"
                placeholder="Model (optional)"
                value={newSession.model}
                onChange={(e) => setNewSession({ ...newSession, model: e.target.value })}
              />
              <input
                className="input"
                placeholder="Tags (comma separated)"
                value={newSession.tags}
                onChange={(e) => setNewSession({ ...newSession, tags: e.target.value })}
              />
              <textarea
                className="input min-h-[80px]"
                placeholder="Description (optional)"
                value={newSession.description}
                onChange={(e) => setNewSession({ ...newSession, description: e.target.value })}
              />
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={() => setShowCreate(false)} className="btn-secondary flex-1">Cancel</button>
              <button onClick={createSession} disabled={creating} className="btn-primary flex-1 disabled:opacity-50">
                {creating ? "Creating…" : "Go live"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
