import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { serializeSession } from "@/lib/sessions";
import { eventBus } from "@/lib/event-bus";
import { SessionViewer } from "@/components/sessions/SessionViewer";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const session = await db.session.findUnique({ where: { slug } });
  if (!session) return { title: "Session not found" };
  return { title: `${session.title} · Agentshow` };
}

export default async function SessionPage({ params }: PageProps) {
  const { slug } = await params;

  const session = await db.session.findUnique({
    where: { slug },
    include: {
      creator: { select: { id: true, username: true, displayName: true, avatar: true } },
      _count: { select: { likes: true } },
    },
  });

  if (!session) notFound();

  const user = await getCurrentUser();
  const isOwner = user?.id === session.creatorId;
  const liked = user
    ? !!(await db.like.findUnique({
        where: { sessionId_userId: { sessionId: session.id, userId: user.id } },
      }))
    : false;

  const [events, chat] = await Promise.all([
    db.sessionEvent.findMany({
      where: { sessionId: session.id },
      orderBy: { sequence: "asc" },
    }),
    db.chatMessage.findMany({
      where: { sessionId: session.id },
      orderBy: { createdAt: "asc" },
      take: 100,
    }),
  ]);

  const serialized = serializeSession(session, {
    likeCount: session._count.likes,
    viewerCount: eventBus.getViewerCount(session.id),
    liked,
  });

  return (
    <SessionViewer
      initialSession={serialized!}
      isOwner={isOwner}
      initialEvents={events.map((e) => ({
        id: e.id,
        sequence: e.sequence,
        type: e.type,
        content: e.content,
        metadata: e.metadata ? JSON.parse(e.metadata) : null,
        timestamp: e.timestamp.getTime(),
      }))}
      initialChat={chat.map((m) => ({
        id: m.id,
        username: m.username,
        content: m.content,
        timestamp: m.createdAt.getTime(),
        isCreator: m.userId === session.creatorId,
      }))}
    />
  );
}
