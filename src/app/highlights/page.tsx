import { Scissors } from "lucide-react";
import { db } from "@/lib/db";
import { HighlightCard, type HighlightFeedItem } from "@/components/highlights/HighlightCard";
import { normalizeAvatarUrl, avatarInitials } from "@/lib/avatar";

export const dynamic = "force-dynamic";

export default async function HighlightsPage() {
  const highlights = await db.highlight.findMany({
    include: {
      session: {
        include: {
          creator: {
            select: { username: true, displayName: true, avatar: true },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 48,
  });

  const items: HighlightFeedItem[] = highlights
    .filter((h) => h.session.isPublic)
    .map((h) => ({
      id: h.id,
      title: h.title,
      startSeq: h.startSeq,
      endSeq: h.endSeq,
      eventCount: h.endSeq - h.startSeq + 1,
      createdAt: h.createdAt.toISOString(),
      session: {
        slug: h.session.slug,
        title: h.session.title,
        agent: h.session.agent,
        status: h.session.status,
        creator: h.session.creator
          ? {
              username: h.session.creator.username,
              displayName: h.session.creator.displayName,
              avatar:
                normalizeAvatarUrl(h.session.creator.avatar) ??
                avatarInitials(h.session.creator.avatar, h.session.creator.displayName),
            }
          : null,
      },
    }));

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-10">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <Scissors className="h-7 w-7 text-[var(--color-primary)]" />
          <h1 className="text-3xl font-bold" style={{ fontFamily: "var(--font-outfit)" }}>
            Highlights
          </h1>
        </div>
        <p className="text-[var(--color-text-muted)]">
          Clip and share key moments from AI coding sessions.
        </p>
      </div>

      {items.length === 0 ? (
        <div className="card p-12 text-center">
          <Scissors className="h-10 w-10 text-[var(--color-text-muted)] mx-auto mb-4 opacity-50" />
          <p className="text-[var(--color-text-muted)] mb-2">No highlights yet.</p>
          <p className="text-sm text-[var(--color-text-muted)]">
            Session owners can clip moments from the event feed and share them here.
          </p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {items.map((h) => (
            <HighlightCard key={h.id} highlight={h} />
          ))}
        </div>
      )}
    </div>
  );
}
