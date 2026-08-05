import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { setAuthCookie, getInitials, serializeAuthUser } from "@/lib/auth";
import { normalizeAvatarUrl } from "@/lib/avatar";
import { exchangeGoogleCode, verifyOAuthState } from "@/lib/google-oauth";
import { customAlphabet } from "nanoid";

const suffix = customAlphabet("abcdefghijklmnopqrstuvwxyz0123456789", 4);

function usernameFromEmail(email: string) {
  const base = email
    .split("@")[0]
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "")
    .slice(0, 16);
  return base.length >= 3 ? base : `user${suffix()}`;
}

async function uniqueUsername(email: string) {
  let username = usernameFromEmail(email);
  let attempt = 0;
  while (attempt < 10) {
    const existing = await db.user.findUnique({ where: { username } });
    if (!existing) return username;
    username = `${usernameFromEmail(email)}${suffix()}`;
    attempt++;
  }
  return `user${suffix()}${suffix()}`;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");

  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.AGENTCAST_URL ||
    "http://localhost:3000";

  if (error) {
    return NextResponse.redirect(`${appUrl}/login?error=google_denied`);
  }

  if (!code || !state) {
    return NextResponse.redirect(`${appUrl}/login?error=google_missing`);
  }

  const cookieHeader = request.headers.get("cookie") || "";
  const stateCookie = cookieHeader.match(/google_oauth_state=([^;]+)/)?.[1];
  const nextCookie = cookieHeader.match(/google_oauth_next=([^;]+)/)?.[1];
  const redirectPath =
    nextCookie && nextCookie.startsWith("/") && !nextCookie.startsWith("//")
      ? decodeURIComponent(nextCookie)
      : "/dashboard?welcome=google";

  if (!stateCookie || stateCookie !== state || !(await verifyOAuthState(state))) {
    return NextResponse.redirect(`${appUrl}/login?error=google_state`);
  }

  try {
    const profile = await exchangeGoogleCode(code);

    let user = await db.user.findFirst({
      where: {
        OR: [{ googleId: profile.googleId }, { email: profile.email }],
      },
    });

    if (user) {
      if (!user.googleId || profile.avatar) {
        user = await db.user.update({
          where: { id: user.id },
          data: {
            ...(user.googleId ? {} : { googleId: profile.googleId }),
            ...(profile.avatar
              ? { avatar: normalizeAvatarUrl(profile.avatar) ?? profile.avatar }
              : {}),
          },
        });
      }
    } else {
      user = await db.user.create({
        data: {
          email: profile.email,
          username: await uniqueUsername(profile.email),
          displayName: profile.displayName,
          googleId: profile.googleId,
          avatar:
            normalizeAvatarUrl(profile.avatar) ||
            profile.avatar ||
            getInitials(profile.displayName),
        },
      });
    }

    await setAuthCookie(user.id);

    const response = NextResponse.redirect(`${appUrl}${redirectPath}`);
    response.cookies.delete("google_oauth_state");
    response.cookies.delete("google_oauth_next");
    return response;
  } catch {
    return NextResponse.redirect(`${appUrl}/login?error=google_failed`);
  }
}
