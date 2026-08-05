import { clsx } from "clsx";
import { normalizeAvatarUrl, avatarInitials } from "@/lib/avatar";

const SIZES = {
  sm: "h-7 w-7 text-xs",
  md: "h-8 w-8 text-xs",
  lg: "h-16 w-16 text-xl",
} as const;

interface UserAvatarProps {
  name: string;
  avatar?: string | null;
  size?: keyof typeof SIZES;
  className?: string;
}

export function UserAvatar({ name, avatar, size = "md", className }: UserAvatarProps) {
  const sizeClass = SIZES[size];
  const imageUrl = normalizeAvatarUrl(avatar);
  const initials = avatarInitials(avatar, name || "?");

  if (imageUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={imageUrl}
        alt=""
        className={clsx("rounded-full object-cover shrink-0", sizeClass, className)}
        referrerPolicy="no-referrer"
      />
    );
  }

  return (
    <div
      className={clsx(
        "rounded-full bg-[var(--color-primary-light)] text-[var(--color-primary)] flex items-center justify-center font-semibold shrink-0 overflow-hidden",
        sizeClass,
        className
      )}
      aria-hidden
    >
      <span className="truncate max-w-full px-0.5">{initials}</span>
    </div>
  );
}
