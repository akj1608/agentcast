import { NextResponse } from "next/server";
import {
  createOAuthState,
  getGoogleAuthUrl,
  getGoogleConfig,
} from "@/lib/google-oauth";

export async function GET(request: Request) {
  const { enabled } = getGoogleConfig();
  if (!enabled) {
    return NextResponse.json(
      { error: "Google sign-in is not configured on this server" },
      { status: 503 }
    );
  }

  const url = new URL(request.url);
  const nextPath = url.searchParams.get("next");
  const safeNext =
    nextPath && nextPath.startsWith("/") && !nextPath.startsWith("//") ? nextPath : null;

  const state = await createOAuthState();
  const response = NextResponse.redirect(getGoogleAuthUrl(state));
  response.cookies.set("google_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  });
  if (safeNext) {
    response.cookies.set("google_oauth_next", safeNext, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 600,
      path: "/",
    });
  }

  return response;
}
