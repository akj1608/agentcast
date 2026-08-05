"use client";

import Link from "next/link";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { FollowButton } from "@/components/community/FollowButton";

export interface CreatorCardData {
  id: string;
  username: string;
  displayName: string;
  bio: string | null;
  avatar: string;
  sessionCount: number;
  followerCount: number;
  isFollowing: boolean;
  isSelf: boolean;
}

export function CreatorCard({ creator }: { creator: CreatorCardData }) {
  return (
    <div className="card p-5 flex flex-col">
      <div className="flex items-start gap-3 mb-3">
        <Link href={`/u/${creator.username}`}>
          <UserAvatar name={creator.displayName} avatar={creator.avatar} size="lg" />
        </Link>
        <div className="min-w-0 flex-1">
          <Link
            href={`/u/${creator.username}`}
            className="font-semibold text-sm hover:text-[var(--color-primary)] truncate block"
          >
            {creator.displayName}
          </Link>
          <p className="text-xs text-[var(--color-text-muted)]">@{creator.username}</p>
        </div>
      </div>
      {creator.bio && (
        <p className="text-xs text-[var(--color-text-secondary)] line-clamp-2 mb-3 flex-1">
          {creator.bio}
        </p>
      )}
      <div className="flex items-center justify-between gap-2 mt-auto pt-2">
        <div className="text-xs text-[var(--color-text-muted)]">
          <strong className="text-[var(--color-text)]">{creator.sessionCount}</strong> sessions ·{" "}
          <strong className="text-[var(--color-text)]">{creator.followerCount}</strong> followers
        </div>
        <FollowButton
          username={creator.username}
          initialFollowing={creator.isFollowing}
          isSelf={creator.isSelf}
        />
      </div>
    </div>
  );
}
