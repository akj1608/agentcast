import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";
import { serializeSession } from "@/lib/sessions";
import { eventBus } from "@/lib/event-bus";

interface RouteParams {
  params: Promise<{ username: string }>;
}

export async function GET(request: Request, { params }: RouteParams) {
  const { username } = await params;
  const currentUser = await getUserFromRequest(request);

  const user = await db.user.findUnique({
    where: { username },
    select: {
      id: true,
      username: true,
      displayName: true,
      bio: true,
      avatar: true,
      createdAt: true,
      _count: { select: { sessions: true, followers: true, following: true } },
    },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  let isFollowing = false;
  if (currentUser && currentUser.id !== user.id) {
    isFollowing = !!(await db.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: currentUser.id,
          followingId: user.id,
        },
      },
    }));
  }

  const sessions = await db.session.findMany({
    where: { creatorId: user.id, isPublic: true },
    include: {
      creator: {
        select: { id: true, username: true, displayName: true, avatar: true },
      },
      _count: { select: { likes: true } },
    },
    orderBy: { startedAt: "desc" },
  });

  return NextResponse.json({
    user: {
      ...user,
      sessionCount: user._count.sessions,
      followerCount: user._count.followers,
      followingCount: user._count.following,
      isFollowing,
      isSelf: currentUser?.id === user.id,
    },
    sessions: sessions.map((s) =>
      serializeSession(s, {
        likeCount: s._count.likes,
        viewerCount: eventBus.getViewerCount(s.id),
      })
    ),
  });
}

export async function POST(request: Request, { params }: RouteParams) {
  const { username } = await params;
  const currentUser = await getUserFromRequest(request);
  if (!currentUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const target = await db.user.findUnique({ where: { username } });
  if (!target) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  if (target.id === currentUser.id) {
    return NextResponse.json({ error: "Cannot follow yourself" }, { status: 400 });
  }

  const existing = await db.follow.findUnique({
    where: {
      followerId_followingId: {
        followerId: currentUser.id,
        followingId: target.id,
      },
    },
  });

  if (existing) {
    await db.follow.delete({ where: { id: existing.id } });
    return NextResponse.json({ following: false });
  }

  await db.follow.create({
    data: { followerId: currentUser.id, followingId: target.id },
  });

  return NextResponse.json({ following: true });
}
