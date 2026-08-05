import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { serializeSession } from "@/lib/sessions";
import { eventBus } from "@/lib/event-bus";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const following = await db.follow.findMany({
    where: { followerId: user.id },
    select: { followingId: true },
  });

  const followingIds = following.map((f) => f.followingId);
  if (followingIds.length === 0) {
    return NextResponse.json({ sessions: [], followingCount: 0 });
  }

  const sessions = await db.session.findMany({
    where: { creatorId: { in: followingIds }, isPublic: true },
    include: {
      creator: {
        select: { id: true, username: true, displayName: true, avatar: true },
      },
      _count: { select: { likes: true } },
    },
    orderBy: { startedAt: "desc" },
    take: 50,
  });

  return NextResponse.json({
    followingCount: followingIds.length,
    sessions: sessions.map((s) =>
      serializeSession(s, {
        likeCount: s._count.likes,
        viewerCount: eventBus.getViewerCount(s.id),
      })
    ),
  });
}
