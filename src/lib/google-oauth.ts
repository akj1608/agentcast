import { SignJWT, jwtVerify } from "jose";

const SECRET = new TextEncoder().encode(
  process.env.AUTH_SECRET || "agentshow-dev-secret"
);

export function getGoogleConfig() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.AGENTSHOW_URL ||
    "http://localhost:3000";

  return {
    clientId,
    clientSecret,
    redirectUri: `${baseUrl.replace(/\/$/, "")}/api/auth/google/callback`,
    enabled: Boolean(clientId && clientSecret),
  };
}

export async function createOAuthState() {
  return new SignJWT({ purpose: "google_oauth" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("10m")
    .sign(SECRET);
}

export async function verifyOAuthState(state: string) {
  try {
    const { payload } = await jwtVerify(state, SECRET);
    if (payload.purpose !== "google_oauth") return false;
    return true;
  } catch {
    return false;
  }
}

export function getGoogleAuthUrl(state: string) {
  const { clientId, redirectUri } = getGoogleConfig();
  const params = new URLSearchParams({
    client_id: clientId!,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email profile",
    state,
    access_type: "online",
    prompt: "select_account",
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
}

export async function exchangeGoogleCode(code: string) {
  const { clientId, clientSecret, redirectUri } = getGoogleConfig();

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId!,
      client_secret: clientSecret!,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });

  const tokenData = await tokenRes.json();
  if (!tokenRes.ok) {
    throw new Error(tokenData.error_description || "Google token exchange failed");
  }

  const userRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
    headers: { Authorization: `Bearer ${tokenData.access_token}` },
  });

  const profile = await userRes.json();
  if (!userRes.ok || !profile.email) {
    throw new Error("Failed to fetch Google profile");
  }

  return {
    googleId: profile.id as string,
    email: profile.email as string,
    displayName: (profile.name as string) || profile.email.split("@")[0],
    avatar: profile.picture as string | undefined,
  };
}
