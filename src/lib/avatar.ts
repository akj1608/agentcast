/** Normalize avatar values from OAuth providers into a display-safe form. */
export function normalizeAvatarUrl(avatar: string | null | undefined): string | null {
  if (!avatar) return null;

  const trimmed = avatar.trim();
  if (!trimmed) return null;

  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }

  if (trimmed.startsWith("//")) {
    return `https:${trimmed}`;
  }

  if (trimmed.includes("googleusercontent.com")) {
    const withProto = trimmed.startsWith("http") ? trimmed : `https://${trimmed.replace(/^\/\//, "")}`;
    return withProto;
  }

  // Bare Google photo id (e.g. ACg8ocJZg3GxgrnLu8fWq8sGSUWZO0lpVhn_OBRr24MeYGfrn2nJ4Q)
  if (/^[A-Za-z0-9_-]{20,}(?:=s\d+-c)?$/.test(trimmed)) {
    const id = trimmed.replace(/=s\d+-c$/, "");
    return `https://lh3.googleusercontent.com/a/${id}=s96-c`;
  }

  return null;
}

export function avatarInitials(
  avatar: string | null | undefined,
  displayName: string
): string {
  if (
    avatar &&
    avatar.length <= 3 &&
    !avatar.includes("/") &&
    !avatar.startsWith("http")
  ) {
    return avatar.toUpperCase();
  }

  return displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function resolveAvatar(
  avatar: string | null | undefined,
  displayName: string
): { imageUrl: string | null; initials: string } {
  const imageUrl = normalizeAvatarUrl(avatar);
  return {
    imageUrl,
    initials: avatarInitials(avatar, displayName),
  };
}
