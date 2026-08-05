import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";
import { eventBus } from "@/lib/event-bus";

const chatSchema = z.object({
  content: z.string().min(1).max(500),
});

interface RouteParams {
  params: Promise<{ slug: string }>;
}

export async function GET(_request: Request, { params }: RouteParams) {
  const { slug } = await params;
  const session = await db.session.findUnique({ where: { slug } });
  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  const messages = await db.chatMessage.findMany({
    where: { sessionId: session.id },
    orderBy: { createdAt: "asc" },
    take: 200,
    include: {
      user: { select: { username: true, displayName: true } },
    },
  });

  return NextResponse.json({
    messages: messages.map((m) => ({
      id: m.id,
      username: m.username,
      content: m.content,
      timestamp: m.createdAt.getTime(),
      isCreator: m.userId === session.creatorId,
    })),
  });
}

export async function POST(request: Request, { params }: RouteParams) {
  const { slug } = await params;
  const user = await getUserFromRequest(request);

  const session = await db.session.findUnique({ where: { slug } });
  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  try {
    const body = await request.json();
    const data = chatSchema.parse(body);

    const username = user?.username || body.username || "anonymous";
    const message = await db.chatMessage.create({
      data: {
        sessionId: session.id,
        userId: user?.id,
        username,
        content: data.content,
      },
    });

    const payload = {
      id: message.id,
      username: message.username,
      content: message.content,
      timestamp: message.createdAt.getTime(),
      isCreator: user?.id === session.creatorId,
    };

    eventBus.publish({ type: "chat", sessionId: session.id, data: payload });

    if (session.status === "live") {
      const { ingestEvents } = await import("@/lib/sessions");
      await ingestEvents(session.id, [
        {
          type: "viewer_message",
          content: data.content,
          metadata: { username, isCreator: user?.id === session.creatorId },
        },
      ]);
    }

    return NextResponse.json({ message: payload });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
  }
}
