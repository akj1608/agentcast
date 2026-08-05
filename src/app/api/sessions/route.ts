import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";
import { generateSlug, parseTags, serializeSession } from "@/lib/sessions";
import { eventBus } from "@/lib/event-bus";

const createSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  agent: z.string().min(1),
  model: z.string().optional(),
  tags: z.union([z.string(), z.array(z.string())]).optional(),
  projectPath: z.string().optional(),
  machineName: z.string().optional(),
  isPublic: z.boolean().optional(),
  allowTalkback: z.boolean().optional(),
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const agent = searchParams.get("agent");
  const q = searchParams.get("q");
  const creatorId = searchParams.get("creatorId");
  const limit = parseInt(searchParams.get("limit") || "20", 10);
  const offset = parseInt(searchParams.get("offset") || "0", 10);

  const where: Record<string, unknown> = { isPublic: true };
  if (status) where.status = status;
  if (agent) where.agent = agent;
  if (creatorId) where.creatorId = creatorId;
  if (q) {
    where.OR = [
      { title: { contains: q } },
      { description: { contains: q } },
      { tags: { contains: q } },
    ];
  }

  const [sessions, total] = await Promise.all([
    db.session.findMany({
      where,
      include: {
        creator: {
          select: { id: true, username: true, displayName: true, avatar: true },
        },
        _count: { select: { likes: true } },
      },
      orderBy: { startedAt: "desc" },
      take: limit,
      skip: offset,
    }),
    db.session.count({ where }),
  ]);

  const user = await getUserFromRequest(request);

  const result = await Promise.all(
    sessions.map(async (s) => {
      const liked = user
        ? !!(await db.like.findUnique({
            where: { sessionId_userId: { sessionId: s.id, userId: user.id } },
          }))
        : false;
      return serializeSession(s, {
        likeCount: s._count.likes,
        viewerCount: eventBus.getViewerCount(s.id),
        liked,
      });
    })
  );

  const stats = {
    totalSessions: await db.session.count(),
    liveNow: await db.session.count({ where: { status: "live" } }),
    totalCreators: await db.user.count(),
    totalViews: await db.session.aggregate({ _sum: { viewCount: true } }),
  };

  return NextResponse.json({
    sessions: result,
    total,
    stats: {
      totalSessions: stats.totalSessions,
      liveNow: stats.liveNow,
      totalCreators: stats.totalCreators,
      totalViews: stats.totalViews._sum.viewCount || 0,
    },
  });
}

export async function POST(request: Request) {
  const user = await getUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const data = createSchema.parse(body);

    const session = await db.session.create({
      data: {
        slug: generateSlug(),
        title: data.title,
        description: data.description,
        agent: data.agent,
        model: data.model,
        tags: parseTags(data.tags || ""),
        projectPath: data.projectPath,
        machineName: data.machineName,
        isPublic: data.isPublic ?? true,
        allowTalkback: data.allowTalkback ?? true,
        creatorId: user.id,
        status: "live",
      },
      include: {
        creator: {
          select: { id: true, username: true, displayName: true, avatar: true },
        },
      },
    });

    await db.sessionEvent.create({
      data: {
        sessionId: session.id,
        sequence: 0,
        type: "system",
        content: `Session started by ${user.displayName}`,
      },
    });

    return NextResponse.json({
      session: serializeSession(session, { likeCount: 0, viewerCount: 0 }),
      streamToken: session.streamToken,
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to create session" }, { status: 500 });
  }
}
