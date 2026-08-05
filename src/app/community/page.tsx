"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { Users, Radio, Loader2 } from "lucide-react";
import { SessionCard, type SessionData } from "@/components/sessions/SessionCard";
import { CreatorCard, type CreatorCardData } from "@/components/community/CreatorCard";

export default function CommunityContent() {
  const { user, loading: authLoading } = useAuth();
  const [tab, setTab] = useState<"following" | "discover">("discover");
  const [sessions, setSessions] = useState<SessionData[]>([]);
  const [creators, setCreators] = useState<CreatorCardData[]>([]);
  const [followingCount, setFollowingCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (user) setTab("following");
  }, [user, authLoading]);

  useEffect(() => {
    setLoading(true);
    if (tab === "following" && user) {
      fetch("/api/following")
        .then((r) => r.json())
        .then((d) => {
          setSessions(d.sessions || []);
          setFollowingCount(d.followingCount || 0);
        })
        .finally(() => setLoading(false));
    } else {
      fetch("/api/creators")
        .then((r) => r.json())
        .then((d) => setCreators(d.creators || []))
        .finally(() => setLoading(false));
    }
  }, [tab, user]);

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2" style={{ fontFamily: "var(--font-outfit)" }}>
          Community
        </h1>
        <p className="text-[var(--color-text-muted)]">
          Follow creators and discover sessions from people you care about.
        </p>
      </div>

      <div className="flex gap-1 mb-8 border-b border-[var(--color-border)]">
        {user && (
          <button
            onClick={() => setTab("following")}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors flex items-center gap-1.5 ${
              tab === "following"
                ? "border-[var(--color-primary)] text-[var(--color-primary)]"
                : "border-transparent text-[var(--color-text-muted)]"
            }`}
          >
            <Radio className="h-4 w-4" />
            Following feed
          </button>
        )}
        <button
          onClick={() => setTab("discover")}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors flex items-center gap-1.5 ${
            tab === "discover"
              ? "border-[var(--color-primary)] text-[var(--color-primary)]"
              : "border-transparent text-[var(--color-text-muted)]"
          }`}
        >
          <Users className="h-4 w-4" />
          Discover creators
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-[var(--color-text-muted)] gap-2">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading…
        </div>
      ) : tab === "following" ? (
        !user ? (
          <div className="card p-10 text-center">
            <p className="text-[var(--color-text-muted)] mb-4">Sign in to see sessions from creators you follow.</p>
            <Link href="/login" className="btn-primary inline-block">
              Sign in
            </Link>
          </div>
        ) : followingCount === 0 ? (
          <div className="card p-10 text-center">
            <p className="text-[var(--color-text-muted)] mb-4">
              You&apos;re not following anyone yet. Discover creators and hit Follow.
            </p>
            <button onClick={() => setTab("discover")} className="btn-primary">
              Discover creators
            </button>
          </div>
        ) : sessions.length === 0 ? (
          <p className="text-center text-[var(--color-text-muted)] py-12">
            No recent sessions from people you follow.
          </p>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {sessions.map((s, i) => (
              <SessionCard key={s.id} session={s} index={i} />
            ))}
          </div>
        )
      ) : creators.length === 0 ? (
        <p className="text-center text-[var(--color-text-muted)] py-12">No creators yet.</p>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {creators.map((c) => (
            <CreatorCard key={c.id} creator={c} />
          ))}
        </div>
      )}
    </div>
  );
}
