import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";
import { eventBus } from "@/lib/event-bus";
import { ingestEvents } from "@/lib/sessions";

const talkbackSchema = z.object({
  content: z.string().min(1).max(500),
});

interface RouteParams {
  params: Promise<{ slug: string }>;
}

export async function GET(request: Request, { params }: RouteParams) {
  const { slug } = await params;
  const user = await getUserFromRequest(request);

  const session = await db.session.findUnique({ where: { slug } });
  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  const isOwner = user && user.id === session.creatorId;
  if (!isOwner) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const pending = await db.talkbackMessage.findMany({
    where: { sessionId: session.id, delivered: false },
    orderBy: { createdAt: "asc" },
  });

  if (pending.length > 0) {
    await db.talkbackMessage.updateMany({
      where: { id: { in: pending.map((p) => p.id) } },
      data: { delivered: true },
    });

    for (const msg of pending) {
      await ingestEvents(session.id, [
        {
          type: "viewer_message",
          content: `${msg.username}: ${msg.content}`,
        },
      ]);
    }
  }

  return NextResponse.json({ messages: pending });
}

export async function POST(request: Request, { params }: RouteParams) {
  const { slug } = await params;
  const user = await getUserFromRequest(request);

  const session = await db.session.findUnique({ where: { slug } });
  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  if (!session.allowTalkback) {
    return NextResponse.json({ error: "Talk-back disabled" }, { status: 403 });
  }

  if (session.status !== "live") {
    return NextResponse.json({ error: "Session not live" }, { status: 400 });
  }

  try {
    const body = await request.json();
    const data = talkbackSchema.parse(body);
    const username = user?.username || body.username || "viewer";

    const message = await db.talkbackMessage.create({
      data: {
        sessionId: session.id,
        username,
        content: data.content,
      },
    });

    const payload = {
      id: message.id,
      username: message.username,
      content: message.content,
      timestamp: message.createdAt.getTime(),
    };

    eventBus.publish({ type: "talkback", sessionId: session.id, data: payload });

    await ingestEvents(session.id, [
      {
        type: "viewer_message",
        content: data.content,
        metadata: { username, source: "talkback" },
      },
    ]);

    return NextResponse.json({ message: payload });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to send talk-back" }, { status: 500 });
  }
}
