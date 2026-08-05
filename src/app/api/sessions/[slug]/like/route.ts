import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";

interface RouteParams {
  params: Promise<{ slug: string }>;
}

export async function POST(request: Request, { params }: RouteParams) {
  const { slug } = await params;
  const user = await getUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const session = await db.session.findUnique({ where: { slug } });
  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  const existing = await db.like.findUnique({
    where: { sessionId_userId: { sessionId: session.id, userId: user.id } },
  });

  if (existing) {
    await db.like.delete({ where: { id: existing.id } });
    const count = await db.like.count({ where: { sessionId: session.id } });
    return NextResponse.json({ liked: false, likeCount: count });
  }

  await db.like.create({
    data: { sessionId: session.id, userId: user.id },
  });
  const count = await db.like.count({ where: { sessionId: session.id } });
  return NextResponse.json({ liked: true, likeCount: count });
}
