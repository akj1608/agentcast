import { NextResponse } from "next/server";
import { clearAuthCookie, getCurrentUser, serializeAuthUser } from "@/lib/auth";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ user: null });
  }
  return NextResponse.json({ user: serializeAuthUser(user) });
}

export async function DELETE() {
  await clearAuthCookie();
  return NextResponse.json({ ok: true });
}
