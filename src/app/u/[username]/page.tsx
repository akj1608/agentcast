import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { serializeSession } from "@/lib/sessions";
import { eventBus } from "@/lib/event-bus";
import { SessionCard } from "@/components/sessions/SessionCard";
import { ProfileHeader } from "@/components/community/ProfileHeader";
import { getCurrentUser } from "@/lib/auth";

interface PageProps {
  params: Promise<{ username: string }>;
}

export const dynamic = "force-dynamic";

export default async function UserProfilePage({ params }: PageProps) {
  const { username } = await params;

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

  if (!user) notFound();

  const currentUser = await getCurrentUser();
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
      creator: { select: { id: true, username: true, displayName: true, avatar: true } },
      _count: { select: { likes: true } },
    },
    orderBy: { startedAt: "desc" },
  });

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-10">
      <ProfileHeader
        username={user.username}
        displayName={user.displayName}
        avatar={user.avatar}
        bio={user.bio}
        sessionCount={user._count.sessions}
        followerCount={user._count.followers}
        followingCount={user._count.following}
        isFollowing={isFollowing}
        isSelf={currentUser?.id === user.id}
      />

      <h2 className="font-semibold mb-4">Sessions</h2>
      {sessions.length === 0 ? (
        <p className="text-[var(--color-text-muted)]">No public sessions yet.</p>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {sessions.map((s, i) => (
            <SessionCard
              key={s.id}
              session={serializeSession(s, {
                likeCount: s._count.likes,
                viewerCount: eventBus.getViewerCount(s.id),
              })!}
              index={i}
            />
          ))}
        </div>
      )}
    </div>
  );
}
