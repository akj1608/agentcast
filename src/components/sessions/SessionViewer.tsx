"use client";

import { useState, useEffect, useMemo, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useSessionLive } from "@/hooks/useSessionLive";
import { EventTimeline, type TimelineItem } from "./EventTimeline";
import { SessionChat } from "./SessionChat";
import { StreamPanel } from "./StreamPanel";
import { ShareButton } from "./ShareButton";
import { HighlightsPanel } from "./HighlightsPanel";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { getAgentLabel } from "@/lib/agents";
import {
  ArrowLeft,
  Radio,
  Eye,
  Heart,
  Clock,
  Folder,
  Monitor,
  Send,
  Wifi,
  WifiOff,
  Scissors,
  X,
} from "lucide-react";

interface SessionData {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  status: string;
  agent: string;
  model: string | null;
  tags: string[];
  viewCount: number;
  viewerCount: number;
  likeCount: number;
  liked: boolean;
  allowTalkback: boolean;
  projectPath: string | null;
  machineName: string | null;
  startedAt: string;
  endedAt: string | null;
  creator: {
    username: string;
    displayName: string;
    avatar: string;
  } | null;
}

interface SessionViewerProps {
  initialSession: SessionData;
  isOwner: boolean;
  initialEvents: Array<{
    id: string;
    sequence: number;
    type: string;
    content: string;
    metadata: Record<string, unknown> | null;
    timestamp: number;
  }>;
  initialChat: Array<{
    id: string;
    username: string;
    content: string;
    timestamp: number;
    isCreator?: boolean;
  }>;
}


export function SessionViewer(props: SessionViewerProps) {
  return (
    <Suspense fallback={<div className="p-10 text-center text-[var(--color-text-muted)]">Loading session…</div>}>
      <SessionViewerInner {...props} />
    </Suspense>
  );
}

function SessionViewerInner({
  initialSession,
  isOwner,
  initialEvents,
  initialChat,
}: SessionViewerProps) {
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const isLive = initialSession.status === "live";
  const [session, setSession] = useState(initialSession);
  const [activeTab, setActiveTab] = useState<"feed" | "chat" | "files">("feed");
  const [talkback, setTalkback] = useState("");
  const [sendingTalkback, setSendingTalkback] = useState(false);
  const [activeHighlightId, setActiveHighlightId] = useState<string | null>(
    searchParams.get("highlight")
  );
  const [highlightRange, setHighlightRange] = useState<{
    startSeq: number;
    endSeq: number;
    title: string;
  } | null>(null);

  const { events: liveEvents, chatMessages: liveChat, viewerCount, connected, addEvent } =
    useSessionLive(session.id, session.slug, isLive);

  const allEvents = [
    ...initialEvents,
    ...liveEvents.filter(
      (le) => !initialEvents.some((ie) => ie.id === le.id || ie.sequence === le.sequence)
    ),
  ].sort((a, b) => a.sequence - b.sequence);

  const allChat = [
    ...initialChat,
    ...liveChat.filter((lc) => !initialChat.some((ic) => ic.id === lc.id)),
  ];

  const timelineItems = useMemo((): TimelineItem[] => {
    const agentTypes = new Set([
      "tool_call", "tool_result", "file_write", "file_read",
      "thinking", "agent_reply", "terminal", "error",
    ]);

    const fromEvents: TimelineItem[] = allEvents.map((e) => ({
      id: e.id,
      type: e.type,
      content: e.content,
      timestamp: e.timestamp,
      sequence: e.sequence,
      metadata: e.metadata,
      username: e.metadata?.username as string | undefined,
      isAgent: agentTypes.has(e.type),
    }));

    const fromChat: TimelineItem[] = allChat
      .filter(
        (c) =>
          !fromEvents.some(
            (e) =>
              e.type === "viewer_message" &&
              e.content === c.content &&
              Math.abs(e.timestamp - c.timestamp) < 3000
          )
      )
      .map((c) => ({
        id: `chat-${c.id}`,
        type: "viewer_message",
        content: c.content,
        timestamp: c.timestamp,
        username: c.username,
      }));

    return [...fromEvents, ...fromChat].sort((a, b) => a.timestamp - b.timestamp);
  }, [allEvents, allChat]);

  const seqBounds = useMemo(() => {
    const seqs = allEvents.map((e) => e.sequence);
    if (seqs.length === 0) return { min: 0, max: 0 };
    return { min: Math.min(...seqs), max: Math.max(...seqs) };
  }, [allEvents]);

  useEffect(() => {
    const id = searchParams.get("highlight");
    setActiveHighlightId(id);
  }, [searchParams]);

  useEffect(() => {
    if (!activeHighlightId) {
      setHighlightRange(null);
      return;
    }
    fetch(`/api/sessions/${session.slug}/highlights`)
      .then((r) => r.json())
      .then((d) => {
        const h = (d.highlights || []).find(
          (x: { id: string }) => x.id === activeHighlightId
        );
        if (h) {
          setHighlightRange({
            startSeq: h.startSeq,
            endSeq: h.endSeq,
            title: h.title,
          });
        }
      });
  }, [activeHighlightId, session.slug]);

  const displayedTimeline = useMemo(() => {
    if (!highlightRange) return timelineItems;
    return timelineItems.filter((item) => {
      if (item.sequence === undefined) return true;
      return (
        item.sequence >= highlightRange.startSeq &&
        item.sequence <= highlightRange.endSeq
      );
    });
  }, [timelineItems, highlightRange]);

  const clearHighlight = () => {
    setActiveHighlightId(null);
    setHighlightRange(null);
    const url = new URL(window.location.href);
    url.searchParams.delete("highlight");
    window.history.replaceState({}, "", url.pathname);
  };

  const selectHighlight = (id: string | null) => {
    setActiveHighlightId(id);
    const url = new URL(window.location.href);
    if (id) url.searchParams.set("highlight", id);
    else url.searchParams.delete("highlight");
    window.history.replaceState({}, "", url.pathname + url.search);
  };

  useEffect(() => {
    if (viewerCount >= 0) {
      setSession((s) => ({ ...s, viewerCount }));
    }
  }, [viewerCount]);

  const toggleLike = async () => {
    if (!user) {
      window.location.href = "/login";
      return;
    }
    const res = await fetch(`/api/sessions/${session.slug}/like`, { method: "POST" });
    const data = await res.json();
    if (res.ok) {
      setSession((s) => ({ ...s, liked: data.liked, likeCount: data.likeCount }));
    }
  };

  const sendTalkback = async () => {
    if (!talkback.trim() || sendingTalkback) return;
    setSendingTalkback(true);
    try {
      await fetch(`/api/sessions/${session.slug}/talkback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: talkback }),
      });
      setTalkback("");
    } finally {
      setSendingTalkback(false);
    }
  };

  const [shareUrl, setShareUrl] = useState("");

  useEffect(() => {
    setShareUrl(window.location.href);
  }, []);

  const fileEvents = allEvents.filter((e) => e.metadata?.file);

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[var(--color-bg)]">
      <div className="border-b border-[var(--color-border)] bg-[var(--color-surface)]">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-5">
          <Link
            href="/explore"
            className="inline-flex items-center gap-1.5 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)] mb-4"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </Link>

          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                {isLive ? (
                  <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-50 dark:bg-red-950 text-[var(--color-live)] text-xs font-semibold border border-red-200 dark:border-red-900">
                    <Radio className="h-3 w-3 live-dot" />
                    LIVE · {session.viewerCount} watching
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 text-xs text-[var(--color-text-muted)]">
                    <Eye className="h-3 w-3" /> {session.viewCount} views
                  </span>
                )}
                <span className="text-xs px-2 py-0.5 rounded-md bg-[var(--color-primary-light)] text-[var(--color-primary)] font-medium">
                  {getAgentLabel(session.agent)}
                  {session.model && ` · ${session.model}`}
                </span>
                {isLive && (
                  <span className="flex items-center gap-1 text-xs text-[var(--color-text-muted)]">
                    {connected ? (
                      <><Wifi className="h-3 w-3 text-[var(--color-success)]" /> Connected</>
                    ) : (
                      <><WifiOff className="h-3 w-3" /> Reconnecting…</>
                    )}
                  </span>
                )}
              </div>

              <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-outfit)" }}>
                {session.title}
              </h1>
              {session.description && (
                <p className="text-sm text-[var(--color-text-secondary)] mt-1">{session.description}</p>
              )}

              <div className="flex items-center gap-3 mt-3">
                <UserAvatar
                  name={session.creator?.displayName || "?"}
                  avatar={session.creator?.avatar}
                  size="md"
                />
                <div>
                  <Link href={`/u/${session.creator?.username}`} className="text-sm font-medium hover:text-[var(--color-primary)]">
                    {session.creator?.displayName}
                  </Link>
                  <p className="text-xs text-[var(--color-text-muted)]">@{session.creator?.username}</p>
                </div>
              </div>

              {(session.projectPath || session.machineName) && (
                <div className="flex gap-4 mt-2 text-xs text-[var(--color-text-muted)]">
                  {session.projectPath && (
                    <span className="flex items-center gap-1"><Folder className="h-3 w-3" />{session.projectPath}</span>
                  )}
                  {session.machineName && (
                    <span className="flex items-center gap-1"><Monitor className="h-3 w-3" />{session.machineName}</span>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={toggleLike}
                className={`btn-secondary text-sm flex items-center gap-1.5 !py-2 ${session.liked ? "text-[var(--color-danger)] border-red-200" : ""}`}
              >
                <Heart className={`h-4 w-4 ${session.liked ? "fill-current" : ""}`} />
                {session.likeCount}
              </button>
              <ShareButton url={shareUrl} title={session.title} />
            </div>
          </div>

          {session.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-4">
              {session.tags.map((tag) => (
                <Link
                  key={tag}
                  href={`/explore?q=${tag}`}
                  className="text-xs px-2.5 py-1 rounded-full bg-[var(--color-bg-subtle)] text-[var(--color-text-muted)] hover:text-[var(--color-primary)]"
                >
                  {tag}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-6">
        <div className="flex gap-1 mb-4 border-b border-[var(--color-border)]">
          {(["feed", "chat", "files"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2.5 text-sm font-medium capitalize border-b-2 -mb-px transition-colors ${
                activeTab === tab
                  ? "border-[var(--color-primary)] text-[var(--color-primary)]"
                  : "border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
              }`}
            >
              {tab === "feed" ? `Event feed (${displayedTimeline.length})` : tab}
            </button>
          ))}
        </div>

        {highlightRange && (
          <div className="mb-4 flex items-center justify-between gap-3 rounded-xl border border-[var(--color-primary)]/30 bg-[var(--color-primary-light)] px-4 py-3">
            <div className="flex items-center gap-2 min-w-0">
              <Scissors className="h-4 w-4 text-[var(--color-primary)] shrink-0" />
              <span className="text-sm font-medium truncate">
                Watching highlight: {highlightRange.title}
              </span>
            </div>
            <button
              onClick={clearHighlight}
              className="text-xs text-[var(--color-primary)] flex items-center gap-1 shrink-0 hover:underline"
            >
              <X className="h-3 w-3" /> Full session
            </button>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2">
            {activeTab === "feed" && (
              <div className="card min-h-[500px] overflow-hidden">
                <EventTimeline
                  items={displayedTimeline}
                  agent={session.agent}
                  model={session.model}
                />
              </div>
            )}
            {activeTab === "chat" && (
              <SessionChat
                sessionSlug={session.slug}
                isLive={isLive}
                initialMessages={initialChat}
                liveMessages={liveChat}
              />
            )}
            {activeTab === "files" && (
              <div className="card p-5">
                <h3 className="font-semibold mb-4">Files changed</h3>
                {fileEvents.length === 0 ? (
                  <p className="text-sm text-[var(--color-text-muted)]">No file changes recorded</p>
                ) : (
                  <div className="space-y-1">
                    {fileEvents.map((e) => (
                      <div key={e.id} className="flex justify-between py-2 px-3 rounded-lg hover:bg-[var(--color-surface-hover)] text-sm font-mono" style={{ fontFamily: "var(--font-ibm-plex-mono)" }}>
                        <span>{String(e.metadata?.file)}</span>
                        <span className="text-xs">
                          {e.metadata?.linesAdded !== undefined && (
                            <span className="text-[var(--color-success)]">+{String(e.metadata.linesAdded)}</span>
                          )}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="space-y-4">
            {isLive && isOwner && (
              <StreamPanel sessionSlug={session.slug} onEventSent={addEvent} />
            )}
            {isLive && session.allowTalkback && !isOwner && (
              <div className="card p-4">
                <h3 className="font-semibold text-sm mb-1">Talk back to agent</h3>
                <p className="text-xs text-[var(--color-text-muted)] mb-3">
                  Your message will be delivered to the running AI session.
                </p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={talkback}
                    onChange={(e) => setTalkback(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && sendTalkback()}
                    placeholder="Ask the agent to do something…"
                    className="input flex-1 !py-2 text-sm"
                  />
                  <button
                    onClick={sendTalkback}
                    disabled={sendingTalkback}
                    className="btn-primary !p-2.5"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}

            <HighlightsPanel
              sessionSlug={session.slug}
              isOwner={isOwner}
              minSeq={seqBounds.min}
              maxSeq={seqBounds.max}
              activeHighlightId={activeHighlightId}
              onSelectHighlight={selectHighlight}
            />

            <div className="card p-4">
              <h3 className="font-semibold text-sm mb-3">Session stats</h3>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-[var(--color-text-muted)]">Events</dt>
                  <dd className="font-medium">{timelineItems.length}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-[var(--color-text-muted)]">Files changed</dt>
                  <dd className="font-medium">{fileEvents.length}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-[var(--color-text-muted)]">Likes</dt>
                  <dd className="font-medium">{session.likeCount}</dd>
                </div>
                {session.endedAt && (
                  <div className="flex justify-between">
                    <dt className="text-[var(--color-text-muted)]">Duration</dt>
                    <dd className="font-medium flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatDuration(session.startedAt, session.endedAt)}
                    </dd>
                  </div>
                )}
              </dl>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function formatDuration(start: string, end: string) {
  const ms = new Date(end).getTime() - new Date(start).getTime();
  const m = Math.floor(ms / 60000);
  const h = Math.floor(m / 60);
  if (h > 0) return `${h}h ${m % 60}m`;
  return `${m}m`;
}
