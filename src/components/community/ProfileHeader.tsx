"use client";

import { UserAvatar } from "@/components/ui/UserAvatar";
import { FollowButton } from "@/components/community/FollowButton";
import { normalizeAvatarUrl, avatarInitials } from "@/lib/avatar";

interface ProfileHeaderProps {
  username: string;
  displayName: string;
  avatar: string | null;
  bio: string | null;
  sessionCount: number;
  followerCount: number;
  followingCount: number;
  isFollowing?: boolean;
  isSelf?: boolean;
}

export function ProfileHeader({
  username,
  displayName,
  avatar,
  bio,
  sessionCount,
  followerCount,
  followingCount,
  isFollowing = false,
  isSelf = false,
}: ProfileHeaderProps) {
  const resolvedAvatar =
    normalizeAvatarUrl(avatar) ?? avatarInitials(avatar, displayName);

  return (
    <div className="card p-6 mb-8 flex flex-col sm:flex-row sm:items-start gap-5">
      <UserAvatar name={displayName} avatar={resolvedAvatar} size="lg" className="rounded-2xl shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-outfit)" }}>
              {displayName}
            </h1>
            <p className="text-[var(--color-text-muted)]">@{username}</p>
          </div>
          <FollowButton username={username} initialFollowing={isFollowing} isSelf={isSelf} />
        </div>
        {bio && <p className="text-sm mt-2 text-[var(--color-text-secondary)]">{bio}</p>}
        <div className="flex gap-4 mt-3 text-sm text-[var(--color-text-muted)]">
          <span>
            <strong className="text-[var(--color-text)]">{sessionCount}</strong> sessions
          </span>
          <span>
            <strong className="text-[var(--color-text)]">{followerCount}</strong> followers
          </span>
          <span>
            <strong className="text-[var(--color-text)]">{followingCount}</strong> following
          </span>
        </div>
      </div>
    </div>
  );
}
