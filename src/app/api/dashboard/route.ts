import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser, serializeAuthUser } from "@/lib/auth";
import { serializeSession } from "@/lib/sessions";
import { eventBus } from "@/lib/event-bus";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sessions = await db.session.findMany({
    where: { creatorId: user.id },
    include: {
      creator: {
        select: { id: true, username: true, displayName: true, avatar: true },
      },
      _count: { select: { likes: true, events: true } },
    },
    orderBy: { startedAt: "desc" },
  });

  const fullUser = await db.user.findUnique({
    where: { id: user.id },
    select: {
      id: true,
      email: true,
      username: true,
      displayName: true,
      bio: true,
      avatar: true,
      apiToken: true,
      createdAt: true,
      _count: { select: { followers: true, following: true } },
    },
  });

  return NextResponse.json({
    user: fullUser ? serializeAuthUser(fullUser) : null,
    sessions: sessions.map((s) =>
      serializeSession(s, {
        likeCount: s._count.likes,
        viewerCount: eventBus.getViewerCount(s.id),
      })
    ),
  });
}
