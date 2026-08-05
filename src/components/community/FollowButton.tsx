"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { UserPlus, UserCheck, Loader2 } from "lucide-react";

interface FollowButtonProps {
  username: string;
  initialFollowing?: boolean;
  isSelf?: boolean;
}

export function FollowButton({ username, initialFollowing = false, isSelf }: FollowButtonProps) {
  const { user } = useAuth();
  const [following, setFollowing] = useState(initialFollowing);
  const [loading, setLoading] = useState(false);

  if (isSelf) return null;

  const toggle = async () => {
    if (!user) {
      window.location.href = `/login?next=${encodeURIComponent(`/u/${username}`)}`;
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/users/${username}`, { method: "POST" });
      const data = await res.json();
      if (res.ok) setFollowing(data.following);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={
        following
          ? "btn-secondary text-sm flex items-center gap-1.5 !py-2"
          : "btn-primary text-sm flex items-center gap-1.5 !py-2"
      }
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : following ? (
        <>
          <UserCheck className="h-4 w-4" />
          Following
        </>
      ) : (
        <>
          <UserPlus className="h-4 w-4" />
          Follow
        </>
      )}
    </button>
  );
}
