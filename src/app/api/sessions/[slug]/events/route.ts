import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";
import { ingestEvents } from "@/lib/sessions";

const eventSchema = z.object({
  events: z.array(
    z.object({
      type: z.string(),
      content: z.string(),
      metadata: z.record(z.unknown()).optional(),
    })
  ),
});

interface RouteParams {
  params: Promise<{ slug: string }>;
}

async function authorizeStream(request: Request, slug: string) {
  const session = await db.session.findUnique({ where: { slug } });
  if (!session) return { error: "Session not found", status: 404 };

  const authHeader = request.headers.get("authorization");
  const streamToken = authHeader?.startsWith("Bearer ")
    ? authHeader.slice(7)
    : null;

  const user = await getUserFromRequest(request);

  const isOwner = user && user.id === session.creatorId;
  const hasStreamToken = streamToken && streamToken === session.streamToken;

  if (!isOwner && !hasStreamToken) {
    return { error: "Unauthorized", status: 401 };
  }

  return { session };
}

export async function GET(request: Request, { params }: RouteParams) {
  const { slug } = await params;
  const { searchParams } = new URL(request.url);
  const from = parseInt(searchParams.get("from") || "0", 10);
  const limit = parseInt(searchParams.get("limit") || "100", 10);

  const session = await db.session.findUnique({ where: { slug } });
  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  const events = await db.sessionEvent.findMany({
    where: { sessionId: session.id, sequence: { gte: from } },
    orderBy: { sequence: "asc" },
    take: limit,
  });

  return NextResponse.json({
    events: events.map((e) => ({
      id: e.id,
      sequence: e.sequence,
      type: e.type,
      content: e.content,
      metadata: e.metadata ? JSON.parse(e.metadata) : null,
      timestamp: e.timestamp.getTime(),
    })),
  });
}

export async function POST(request: Request, { params }: RouteParams) {
  const { slug } = await params;
  const auth = await authorizeStream(request, slug);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = await request.json();
    const data = eventSchema.parse(body);
    const created = await ingestEvents(auth.session.id, data.events);

    return NextResponse.json({
      ingested: created.length,
      lastSequence: created[created.length - 1]?.sequence,
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors[0].message }, { status: 400 });
    }
    if (err instanceof Error) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    return NextResponse.json({ error: "Ingest failed" }, { status: 500 });
  }
}
