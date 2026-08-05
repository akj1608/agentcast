import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { db } from "./db";
import { normalizeAvatarUrl, avatarInitials } from "./avatar";

const SECRET = new TextEncoder().encode(
  process.env.AUTH_SECRET || "agentshow-dev-secret"
);

const COOKIE_NAME = "agentshow_session";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30;

export interface AuthUser {
  id: string;
  email: string;
  username: string;
  displayName: string;
  avatar: string | null;
  apiToken: string;
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export async function createToken(userId: string) {
  return new SignJWT({ sub: userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(SECRET);
}

export async function verifyToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return payload.sub as string;
  } catch {
    return null;
  }
}

export async function setAuthCookie(userId: string) {
  const token = await createToken(userId);
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: COOKIE_MAX_AGE,
    path: "/",
  });
}

export async function clearAuthCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;

  const userId = await verifyToken(token);
  if (!userId) return null;

  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      username: true,
      displayName: true,
      avatar: true,
      apiToken: true,
    },
  });

  return user;
}

export async function getUserFromRequest(
  request: Request
): Promise<AuthUser | null> {
  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    const user = await db.user.findUnique({
      where: { apiToken: token },
      select: {
        id: true,
        email: true,
        username: true,
        displayName: true,
        avatar: true,
        apiToken: true,
      },
    });
    if (user) return user;
  }

  const cookieHeader = request.headers.get("cookie") || "";
  const match = cookieHeader.match(new RegExp(`${COOKIE_NAME}=([^;]+)`));
  if (!match) return null;

  const userId = await verifyToken(match[1]);
  if (!userId) return null;

  return db.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      username: true,
      displayName: true,
      avatar: true,
      apiToken: true,
    },
  });
}

export function serializeAuthUser(user: AuthUser) {
  return {
    ...user,
    avatar:
      normalizeAvatarUrl(user.avatar) ??
      avatarInitials(user.avatar, user.displayName),
  };
}

export function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}
