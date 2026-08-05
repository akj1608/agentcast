import Link from "next/link";
import { Scissors, Play } from "lucide-react";
import { getAgentLabel, getAgentColor } from "@/lib/agents";
import { UserAvatar } from "@/components/ui/UserAvatar";

export interface HighlightFeedItem {
  id: string;
  title: string;
  startSeq: number;
  endSeq: number;
  eventCount: number;
  createdAt: string;
  session: {
    slug: string;
    title: string;
    agent: string;
    status: string;
    creator: {
      username: string;
      displayName: string;
      avatar: string;
    } | null;
  };
}

export function HighlightCard({ highlight }: { highlight: HighlightFeedItem }) {
  const agentColor = getAgentColor(highlight.session.agent);
  const href = `/session/${highlight.session.slug}?highlight=${highlight.id}`;

  return (
    <Link href={href} className="card overflow-hidden group block animate-slide-up">
      <div
        className="relative h-28 flex flex-col items-center justify-center p-4"
        style={{ background: `linear-gradient(135deg, ${agentColor}18, ${agentColor}08)` }}
      >
        <Scissors className="h-6 w-6 text-[var(--color-primary)] mb-2 opacity-80" />
        <h3
          className="font-semibold text-sm text-center line-clamp-2 group-hover:text-[var(--color-primary)] transition-colors px-2"
          style={{ fontFamily: "var(--font-outfit)" }}
        >
          {highlight.title}
        </h3>
        <span className="text-xs text-[var(--color-text-muted)] mt-1 flex items-center gap-1">
          <Play className="h-3 w-3" />
          {highlight.eventCount} events
        </span>
      </div>
      <div className="p-4 space-y-2">
        <p className="text-xs text-[var(--color-text-muted)] line-clamp-1">
          From: {highlight.session.title}
        </p>
        {highlight.session.creator && (
          <div className="flex items-center gap-2">
            <UserAvatar
              name={highlight.session.creator.displayName}
              avatar={highlight.session.creator.avatar}
              size="sm"
            />
            <span className="text-xs text-[var(--color-text-secondary)] truncate">
              {highlight.session.creator.displayName}
            </span>
          </div>
        )}
        <span
          className="inline-block text-xs px-2 py-0.5 rounded-md font-medium"
          style={{ backgroundColor: `${agentColor}18`, color: agentColor }}
        >
          {getAgentLabel(highlight.session.agent)}
        </span>
      </div>
    </Link>
  );
}
