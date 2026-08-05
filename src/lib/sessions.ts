import { customAlphabet } from "nanoid";
import { db } from "./db";
import { eventBus } from "./event-bus";
import { serializeEventForClient } from "./agents";
import { normalizeAvatarUrl, avatarInitials } from "./avatar";

const slugify = customAlphabet("abcdefghijklmnopqrstuvwxyz", 8);

const ADJECTIVES = [
  "swift", "bright", "cosmic", "quantum", "neon", "azure", "crimson",
  "golden", "silver", "crystal", "phoenix", "shadow", "turbo", "hyper",
];
const NOUNS = [
  "forge", "pulse", "stream", "spark", "wave", "node", "core", "beam",
  "flux", "orbit", "prism", "vault", "nexus", "pixel", "vector",
];

export function generateSlug() {
  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
  return `${adj}-${noun}-${slugify()}`;
}

export function parseTags(tags: string | string[]): string {
  if (Array.isArray(tags)) return tags.join(",");
  return tags;
}

export function formatTags(tags: string): string[] {
  return tags ? tags.split(",").filter(Boolean) : [];
}

export async function getNextSequence(sessionId: string) {
  const last = await db.sessionEvent.findFirst({
    where: { sessionId },
    orderBy: { sequence: "desc" },
    select: { sequence: true },
  });
  return (last?.sequence ?? -1) + 1;
}


export async function ingestEvents(
  sessionId: string,
  events: Array<{
    type: string;
    content: string;
    metadata?: Record<string, unknown>;
  }>
) {
  const session = await db.session.findUnique({ where: { id: sessionId } });
  if (!session || session.status !== "live") {
    throw new Error("Session not found or not live");
  }

  let sequence = await getNextSequence(sessionId);
  const created = [];

  for (const event of events) {
    const record = await db.sessionEvent.create({
      data: {
        sessionId,
        sequence,
        type: event.type,
        content: event.content,
        metadata: event.metadata ? JSON.stringify(event.metadata) : null,
      },
    });
    created.push(record);
    eventBus.publish({
      type: "event",
      sessionId,
      data: serializeEventForClient(record),
    });
    sequence++;
  }

  return created;
}

export async function endSession(sessionId: string) {
  await db.session.update({
    where: { id: sessionId },
    data: { status: "ended", endedAt: new Date() },
  });
  eventBus.publish({ type: "session_ended", sessionId });
}

interface SessionWithCreator {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  status: string;
  agent: string;
  model: string | null;
  tags: string;
  viewCount: number;
  projectPath: string | null;
  machineName: string | null;
  isPublic: boolean;
  allowTalkback: boolean;
  startedAt: Date;
  endedAt: Date | null;
  creator?: {
    id: string;
    username: string;
    displayName: string;
    avatar: string | null;
  } | null;
}

export function serializeSession(
  session: SessionWithCreator | null,
  extras?: { likeCount?: number; viewerCount?: number; liked?: boolean }
) {
  if (!session) return null;
  const creator = session.creator;
  return {
    id: session.id,
    slug: session.slug,
    title: session.title,
    description: session.description,
    status: session.status,
    agent: session.agent,
    model: session.model,
    tags: formatTags(session.tags),
    viewCount: session.viewCount,
    projectPath: session.projectPath,
    machineName: session.machineName,
    isPublic: session.isPublic,
    allowTalkback: session.allowTalkback,
    startedAt: session.startedAt.toISOString(),
    endedAt: session.endedAt?.toISOString() ?? null,
    creator: creator
      ? {
          id: creator.id,
          username: creator.username,
          displayName: creator.displayName,
          avatar:
            normalizeAvatarUrl(creator.avatar) ??
            avatarInitials(creator.avatar, creator.displayName),
        }
      : null,
    likeCount: extras?.likeCount ?? 0,
    viewerCount: extras?.viewerCount ?? 0,
    liked: extras?.liked ?? false,
  };
}
