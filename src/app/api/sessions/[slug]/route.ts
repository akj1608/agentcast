import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";
import { serializeSession, endSession } from "@/lib/sessions";
import { eventBus } from "@/lib/event-bus";

interface RouteParams {
  params: Promise<{ slug: string }>;
}

export async function GET(request: Request, { params }: RouteParams) {
  const { slug } = await params;

  const session = await db.session.findUnique({
    where: { slug },
    include: {
      creator: {
        select: { id: true, username: true, displayName: true, avatar: true, bio: true },
      },
      _count: { select: { likes: true, events: true } },
    },
  });

  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  if (!session.isPublic) {
    const user = await getUserFromRequest(request);
    if (!user || user.id !== session.creatorId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  await db.session.update({
    where: { id: session.id },
    data: { viewCount: { increment: 1 } },
  });

  const user = await getUserFromRequest(request);
  const liked = user
    ? !!(await db.like.findUnique({
        where: { sessionId_userId: { sessionId: session.id, userId: user.id } },
      }))
    : false;

  const events = await db.sessionEvent.findMany({
    where: { sessionId: session.id },
    orderBy: { sequence: "asc" },
  });

  return NextResponse.json({
    session: serializeSession(session, {
      likeCount: session._count.likes,
      viewerCount: eventBus.getViewerCount(session.id),
      liked,
    }),
    events: events.map((e) => ({
      id: e.id,
      sequence: e.sequence,
      type: e.type,
      content: e.content,
      metadata: e.metadata ? JSON.parse(e.metadata) : null,
      timestamp: e.timestamp.getTime(),
    })),
    eventCount: session._count.events,
  });
}

export async function PATCH(request: Request, { params }: RouteParams) {
  const { slug } = await params;
  const user = await getUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const session = await db.session.findUnique({ where: { slug } });
  if (!session || session.creatorId !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const updated = await db.session.update({
    where: { id: session.id },
    data: {
      title: body.title ?? session.title,
      description: body.description ?? session.description,
      isPublic: body.isPublic ?? session.isPublic,
      allowTalkback: body.allowTalkback ?? session.allowTalkback,
    },
    include: {
      creator: {
        select: { id: true, username: true, displayName: true, avatar: true },
      },
    },
  });

  return NextResponse.json({ session: serializeSession(updated) });
}

export async function DELETE(request: Request, { params }: RouteParams) {
  const { slug } = await params;
  const user = await getUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const session = await db.session.findUnique({ where: { slug } });
  if (!session || session.creatorId !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await endSession(session.id);
  return NextResponse.json({ ok: true });
}
