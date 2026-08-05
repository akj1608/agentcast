import Link from "next/link";
import { SessionCard, type SessionData } from "./SessionCard";
import { ArrowRight, Radio } from "lucide-react";

interface SessionFeedProps {
  title: string;
  sessions: SessionData[];
  showLive?: boolean;
  viewAllHref?: string;
  emptyMessage?: string;
}

export function SessionFeed({
  title,
  sessions,
  showLive,
  viewAllHref,
  emptyMessage,
}: SessionFeedProps) {
  return (
    <section className="py-10">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex items-center justify-between mb-5">
          <h2
            className="text-lg font-bold flex items-center gap-2"
            style={{ fontFamily: "var(--font-outfit)" }}
          >
            {showLive && <Radio className="h-4 w-4 text-[var(--color-live)] live-dot" />}
            {title}
          </h2>
          {viewAllHref && (
            <Link
              href={viewAllHref}
              className="flex items-center gap-1 text-sm text-[var(--color-primary)] hover:underline"
            >
              View all <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          )}
        </div>

        {sessions.length === 0 ? (
          <div className="card p-12 text-center border-dashed">
            <Radio className="h-8 w-8 text-[var(--color-text-muted)] mx-auto mb-3 opacity-40" />
            <p className="text-[var(--color-text-muted)]">
              {emptyMessage || "No sessions yet"}
            </p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {sessions.map((session, i) => (
              <SessionCard key={session.id} session={session} index={i} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
