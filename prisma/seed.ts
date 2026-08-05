import bcrypt from "bcryptjs";
import { db } from "../src/lib/db";

async function main() {
  const passwordHash = await bcrypt.hash("demo1234", 12);

  const users = await Promise.all([
    db.user.upsert({
      where: { email: "sarah@agentcast.io" },
      update: {},
      create: {
        email: "sarah@agentcast.io",
        username: "sarahchen",
        displayName: "Sarah Chen",
        passwordHash,
        bio: "Full-stack engineer streaming AI-assisted builds daily",
        avatar: "SC",
      },
    }),
    db.user.upsert({
      where: { email: "alex@agentcast.io" },
      update: {},
      create: {
        email: "alex@agentcast.io",
        username: "alexrivera",
        displayName: "Alex Rivera",
        passwordHash,
        bio: "Building developer tools with AI agents",
        avatar: "AR",
      },
    }),
    db.user.upsert({
      where: { email: "demo@agentcast.io" },
      update: {},
      create: {
        email: "demo@agentcast.io",
        username: "demo",
        displayName: "Demo User",
        passwordHash,
        bio: "Try Agentshow with this demo account",
        avatar: "DU",
      },
    }),
  ]);

  const sarah = users[0];
  const alex = users[1];

  const sessions = [
    {
      slug: "swift-forge-a7k2m",
      title: "JWT Auth Refactor",
      description: "Migrating session auth to JWT with refresh tokens and rate limiting",
      status: "ended",
      agent: "claude-code",
      model: "claude-sonnet-4",
      tags: "go,auth,backend",
      viewCount: 342,
      creatorId: sarah.id,
      startedAt: new Date(Date.now() - 86400000 * 2),
      endedAt: new Date(Date.now() - 86400000 * 2 + 2700000),
      events: [
        { type: "prompt", content: "Refactor the auth module to use JWT with refresh tokens" },
        { type: "thinking", content: "Analyzing current auth structure in api/authn.go" },
        { type: "file_read", content: "Reading api/authn.go", metadata: { file: "api/authn.go", language: "go" } },
        { type: "file_write", content: "Updated api/authn.go", metadata: { file: "api/authn.go", language: "go", linesAdded: 87, linesRemoved: 34 } },
        { type: "tool_call", content: "Running: go test ./api/...", metadata: { tool: "bash" } },
        { type: "tool_result", content: "PASS — all tests passed in 0.34s", metadata: { tool: "bash", duration: 340 } },
        { type: "file_write", content: "Created middleware/jwt.go", metadata: { file: "middleware/jwt.go", language: "go", linesAdded: 45, linesRemoved: 0 } },
        { type: "viewer_message", content: "Can you add CORS headers too?" },
        { type: "prompt", content: "Add CORS middleware for all API routes" },
        { type: "file_write", content: "Created middleware/cors.go", metadata: { file: "middleware/cors.go", language: "go", linesAdded: 28, linesRemoved: 0 } },
      ],
    },
    {
      slug: "cosmic-pulse-x9f3n",
      title: "SaaS Dashboard MVP",
      description: "Building a complete SaaS dashboard with Stripe billing",
      status: "ended",
      agent: "composer",
      model: "composer-1.5",
      tags: "nextjs,saas,typescript",
      viewCount: 567,
      creatorId: sarah.id,
      startedAt: new Date(Date.now() - 86400000),
      endedAt: new Date(Date.now() - 86400000 + 5400000),
      events: [
        { type: "prompt", content: "Create a SaaS dashboard with pricing tiers and Stripe scaffold" },
        { type: "file_write", content: "Created src/app/page.tsx", metadata: { file: "src/app/page.tsx", language: "tsx", linesAdded: 156, linesRemoved: 0 } },
        { type: "file_write", content: "Created components/PricingCard.tsx", metadata: { file: "src/components/PricingCard.tsx", language: "tsx", linesAdded: 89, linesRemoved: 0 } },
      ],
    },
    {
      slug: "neon-stream-b4p8q",
      title: "Docker CI Pipeline",
      description: "Setting up multi-stage Docker builds with GitHub Actions",
      status: "ended",
      agent: "claude-code",
      model: "claude-opus-4",
      tags: "docker,devops,ci-cd",
      viewCount: 198,
      creatorId: alex.id,
      startedAt: new Date(Date.now() - 86400000 * 3),
      endedAt: new Date(Date.now() - 86400000 * 3 + 6300000),
      events: [
        { type: "prompt", content: "Create a multi-stage Dockerfile with GitHub Actions CI" },
        { type: "file_write", content: "Created Dockerfile", metadata: { file: "Dockerfile", linesAdded: 42, linesRemoved: 0 } },
        { type: "file_write", content: "Created .github/workflows/ci.yml", metadata: { file: ".github/workflows/ci.yml", linesAdded: 67, linesRemoved: 0 } },
      ],
    },
    {
      slug: "quantum-nexus-live",
      title: "Live: API Rate Limiter",
      description: "Building a distributed rate limiter with Redis",
      status: "live",
      agent: "aider",
      model: "gpt-4o",
      tags: "python,redis,backend",
      viewCount: 45,
      creatorId: alex.id,
      projectPath: "~/projects/rate-limiter",
      machineName: "dev-machine-01",
      events: [
        { type: "prompt", content: "Implement a sliding window rate limiter using Redis" },
        { type: "file_write", content: "Created limiter.py", metadata: { file: "limiter.py", language: "python", linesAdded: 78, linesRemoved: 0 } },
        { type: "tool_call", content: "Running: python -m pytest", metadata: { tool: "bash" } },
        { type: "tool_result", content: "3 passed in 0.12s", metadata: { tool: "bash", duration: 120 } },
      ],
    },
  ];

  for (const s of sessions) {
    const { events, ...sessionData } = s;
    const session = await db.session.upsert({
      where: { slug: s.slug },
      update: {},
      create: sessionData,
    });

    const existingEvents = await db.sessionEvent.count({
      where: { sessionId: session.id },
    });

    if (existingEvents === 0) {
      for (let i = 0; i < events.length; i++) {
        await db.sessionEvent.create({
          data: {
            sessionId: session.id,
            sequence: i,
            type: events[i].type,
            content: events[i].content,
            metadata: events[i].metadata
              ? JSON.stringify(events[i].metadata)
              : null,
          },
        });
      }
    }

    const likeCount = await db.like.count({ where: { sessionId: session.id } });
    if (likeCount === 0 && s.status === "ended") {
      await db.like.create({
        data: { sessionId: session.id, userId: sarah.id },
      });
    }
  }

  console.log("Seed complete!");
  console.log("Demo login: demo@agentcast.io / demo1234");
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect());
