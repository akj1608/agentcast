import { db } from "@/lib/db";
import { Hero } from "@/components/home/Hero";
import { StatsBar } from "@/components/home/StatsBar";
import { HowItWorks } from "@/components/home/HowItWorks";
import { AgentCommands } from "@/components/home/AgentCommands";
import { SessionFeed } from "@/components/sessions/SessionFeed";
import { serializeSession } from "@/lib/sessions";
import { eventBus } from "@/lib/event-bus";

export const dynamic = "force-dynamic";

async function getHomeData() {
  const [liveSessions, recentSessions, stats] = await Promise.all([
    db.session.findMany({
      where: { status: "live", isPublic: true },
      include: {
        creator: { select: { id: true, username: true, displayName: true, avatar: true } },
        _count: { select: { likes: true } },
      },
      orderBy: { startedAt: "desc" },
      take: 4,
    }),
    db.session.findMany({
      where: { isPublic: true },
      include: {
        creator: { select: { id: true, username: true, displayName: true, avatar: true } },
        _count: { select: { likes: true } },
      },
      orderBy: { startedAt: "desc" },
      take: 8,
    }),
    Promise.all([
      db.session.count(),
      db.session.count({ where: { status: "live" } }),
      db.user.count(),
      db.session.aggregate({ _sum: { viewCount: true } }),
    ]),
  ]);

  return {
    live: liveSessions.map((s) =>
      serializeSession(s, {
        likeCount: s._count.likes,
        viewerCount: eventBus.getViewerCount(s.id),
      })
    ),
    recent: recentSessions.map((s) =>
      serializeSession(s, {
        likeCount: s._count.likes,
        viewerCount: eventBus.getViewerCount(s.id),
      })
    ),
    stats: {
      totalSessions: stats[0],
      liveNow: stats[1],
      totalCreators: stats[2],
      totalViews: stats[3]._sum.viewCount || 0,
    },
  };
}

export default async function HomePage() {
  const { live, recent, stats } = await getHomeData();

  return (
    <>
      <Hero />
      <StatsBar stats={stats} />
      <HowItWorks />
      <AgentCommands />
      <SessionFeed
        title="Live now"
        sessions={live.filter(Boolean) as NonNullable<typeof live[0]>[]}
        showLive
        viewAllHref="/explore?status=live"
        emptyMessage="No live sessions right now. Run agentcast claude or agentcast grok to start!"
      />
      <SessionFeed
        title="Recent sessions"
        sessions={recent.filter(Boolean) as NonNullable<typeof recent[0]>[]}
        viewAllHref="/explore"
      />
    </>
  );
}
