import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";

const highlightSchema = z.object({
  title: z.string().min(1).max(100),
  startSeq: z.number().int().min(0),
  endSeq: z.number().int().min(0),
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

  const highlights = await db.highlight.findMany({
    where: { sessionId: session.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ highlights });
}

export async function POST(request: Request, { params }: RouteParams) {
  const { slug } = await params;
  const user = await getUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const session = await db.session.findUnique({ where: { slug } });
  if (!session || session.creatorId !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const data = highlightSchema.parse(body);

    const highlight = await db.highlight.create({
      data: {
        sessionId: session.id,
        title: data.title,
        startSeq: data.startSeq,
        endSeq: data.endSeq,
      },
    });

    return NextResponse.json({ highlight });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to create highlight" }, { status: 500 });
  }
}
