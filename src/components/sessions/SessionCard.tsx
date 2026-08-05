import Link from "next/link";
import { getAgentLabel, getAgentColor } from "@/lib/agents";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { Eye, Play, Radio, Heart } from "lucide-react";

export interface SessionData {
  id: string;
  slug: string;
  title: string;
  status: string;
  agent: string;
  model: string | null;
  tags: string[];
  viewCount: number;
  viewerCount: number;
  likeCount: number;
  startedAt: string;
  creator: {
    username: string;
    displayName: string;
    avatar: string;
  } | null;
}

interface SessionCardProps {
  session: SessionData;
  index?: number;
}

export function SessionCard({ session, index = 0 }: SessionCardProps) {
  const isLive = session.status === "live";
  const agentColor = getAgentColor(session.agent);

  return (
    <Link
      href={`/session/${session.slug}`}
      className="card overflow-hidden group animate-slide-up block"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <div className="relative h-36 overflow-hidden" style={{ background: `linear-gradient(135deg, ${agentColor}15, ${agentColor}05)` }}>
        <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
          {isLive ? (
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-50 dark:bg-red-950 text-[var(--color-live)] text-xs font-semibold mb-2 border border-red-200 dark:border-red-900">
              <Radio className="h-3 w-3 live-dot" />
              LIVE · {session.viewerCount}
            </span>
          ) : (
            <span className="flex items-center gap-1 text-[var(--color-text-muted)] text-xs mb-2">
              <Eye className="h-3 w-3" />
              {session.viewCount} views
            </span>
          )}
          <h3
            className="font-semibold text-sm text-center line-clamp-2 group-hover:text-[var(--color-primary)] transition-colors"
            style={{ fontFamily: "var(--font-outfit)" }}
          >
            {session.title}
          </h3>
          {!isLive && (
            <span className="flex items-center gap-1 text-xs text-[var(--color-primary)] mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <Play className="h-3 w-3 fill-current" /> Watch replay
            </span>
          )}
        </div>
      </div>

      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <UserAvatar
              name={session.creator?.displayName || "?"}
              avatar={session.creator?.avatar}
              size="sm"
            />
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{session.creator?.displayName}</p>
              <p className="text-xs text-[var(--color-text-muted)]">@{session.creator?.username}</p>
            </div>
          </div>
          <span className="flex items-center gap-1 text-xs text-[var(--color-text-muted)]">
            <Heart className="h-3 w-3" />
            {session.likeCount}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span
            className="text-xs px-2 py-0.5 rounded-md font-medium"
            style={{ backgroundColor: `${agentColor}18`, color: agentColor }}
          >
            {getAgentLabel(session.agent)}
            {session.model && ` · ${session.model}`}
          </span>
        </div>

        {session.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {session.tags.slice(0, 3).map((tag) => (
              <span key={tag} className="text-xs px-2 py-0.5 rounded-full bg-[var(--color-bg-subtle)] text-[var(--color-text-muted)]">
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}
