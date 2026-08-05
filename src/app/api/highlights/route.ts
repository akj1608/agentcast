import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { normalizeAvatarUrl, avatarInitials } from "@/lib/avatar";

export async function GET() {
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

  return NextResponse.json({
    highlights: highlights
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
                  avatarInitials(
                    h.session.creator.avatar,
                    h.session.creator.displayName
                  ),
              }
            : null,
        },
      })),
  });
}
