import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";
import { normalizeAvatarUrl, avatarInitials } from "@/lib/avatar";

export async function GET(request: Request) {
  const currentUser = await getUserFromRequest(request);

  const creators = await db.user.findMany({
    where: {
      sessions: { some: { isPublic: true } },
    },
    select: {
      id: true,
      username: true,
      displayName: true,
      avatar: true,
      bio: true,
      _count: {
        select: { sessions: true, followers: true },
      },
    },
    orderBy: { followers: { _count: "desc" } },
    take: 24,
  });

  let followingSet = new Set<string>();
  if (currentUser) {
    const follows = await db.follow.findMany({
      where: { followerId: currentUser.id },
      select: { followingId: true },
    });
    followingSet = new Set(follows.map((f) => f.followingId));
  }

  return NextResponse.json({
    creators: creators.map((c) => ({
      id: c.id,
      username: c.username,
      displayName: c.displayName,
      bio: c.bio,
      avatar:
        normalizeAvatarUrl(c.avatar) ?? avatarInitials(c.avatar, c.displayName),
      sessionCount: c._count.sessions,
      followerCount: c._count.followers,
      isFollowing: followingSet.has(c.id),
      isSelf: currentUser?.id === c.id,
    })),
  });
}
