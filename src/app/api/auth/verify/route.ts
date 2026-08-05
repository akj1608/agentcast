import { NextResponse } from "next/server";
import { getUserFromRequest, serializeAuthUser } from "@/lib/auth";

export async function GET(request: Request) {
  const user = await getUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({
    user: serializeAuthUser(user),
    server: process.env.NEXT_PUBLIC_APP_URL || process.env.AGENTSHOW_URL || null,
  });
}
