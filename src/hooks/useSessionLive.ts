"use client";

import { useEffect, useRef, useState } from "react";

export interface SessionEvent {
  id: string;
  sequence: number;
  type: string;
  content: string;
  metadata: Record<string, unknown> | null;
  timestamp: number;
}

export interface ChatMessage {
  id: string;
  username: string;
  content: string;
  timestamp: number;
  isCreator?: boolean;
}

function normalizeEvent(data: Record<string, unknown>): SessionEvent {
  const ts = data.timestamp;
  return {
    id: String(data.id),
    sequence: Number(data.sequence),
    type: String(data.type),
    content: String(data.content),
    metadata: (data.metadata as Record<string, unknown>) ?? null,
    timestamp:
      typeof ts === "number"
        ? ts
        : ts instanceof Date
          ? ts.getTime()
          : new Date(String(ts)).getTime(),
  };
}

export function useSessionLive(sessionId: string | null, sessionSlug: string, enabled: boolean) {
  const [events, setEvents] = useState<SessionEvent[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [viewerCount, setViewerCount] = useState(0);
  const [connected, setConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const enabledRef = useRef(enabled);
  const reconnectRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSeqRef = useRef(-1);

  useEffect(() => {
    enabledRef.current = enabled;
  }, [enabled]);

  const addEvent = (event: SessionEvent) => {
    setEvents((prev) => {
      if (prev.some((e) => e.id === event.id || e.sequence === event.sequence)) return prev;
      const next = [...prev, event].sort((a, b) => a.sequence - b.sequence);
      lastSeqRef.current = Math.max(lastSeqRef.current, event.sequence);
      return next;
    });
  };

  // WebSocket connection
  useEffect(() => {
    if (!sessionId || !enabled) {
      wsRef.current?.close();
      setConnected(false);
      return;
    }

    const connect = () => {
      if (!enabledRef.current) return;

      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const ws = new WebSocket(
        `${protocol}//${window.location.host}/ws?sessionId=${encodeURIComponent(sessionId)}`
      );
      wsRef.current = ws;

      ws.onopen = () => setConnected(true);
      ws.onclose = () => {
        setConnected(false);
        if (enabledRef.current) {
          reconnectRef.current = setTimeout(connect, 2000);
        }
      };
      ws.onerror = () => ws.close();
      ws.onmessage = (msg) => {
        try {
          const data = JSON.parse(msg.data);
          switch (data.type) {
            case "event":
              addEvent(normalizeEvent(data.data));
              break;
            case "chat":
              setChatMessages((prev) => {
                if (prev.some((m) => m.id === data.data.id)) return prev;
                return [...prev, data.data];
              });
              addEvent({
                id: `chat-${data.data.id}`,
                sequence: Date.now(),
                type: "viewer_message",
                content: data.data.content,
                metadata: { username: data.data.username },
                timestamp: data.data.timestamp,
              });
              break;
            case "talkback":
              addEvent({
                id: `talkback-${data.data.id}`,
                sequence: Date.now(),
                type: "viewer_message",
                content: data.data.content,
                metadata: { username: data.data.username, source: "talkback" },
                timestamp: data.data.timestamp,
              });
              break;
            case "viewer_count":
              setViewerCount(data.count);
              break;
            case "connected":
              setViewerCount(data.viewerCount ?? 0);
              break;
            case "session_ended":
              enabledRef.current = false;
              ws.close();
              break;
          }
        } catch {
          // ignore
        }
      };
    };

    connect();
    return () => {
      enabledRef.current = false;
      if (reconnectRef.current) clearTimeout(reconnectRef.current);
      wsRef.current?.close();
    };
  }, [sessionId, enabled]);

  // Polling fallback — ensures feed updates even if WebSocket fails (e.g. Render cold start)
  useEffect(() => {
    if (!sessionSlug || !enabled) return;

    const poll = async () => {
      try {
        const from = Math.max(0, lastSeqRef.current);
        const res = await fetch(`/api/sessions/${sessionSlug}/events?from=${from}&limit=50`);
        if (!res.ok) return;
        const { events: fetched } = await res.json();
        for (const e of fetched) {
          addEvent(normalizeEvent(e));
        }
      } catch {
        // ignore
      }
    };

    poll();
    const interval = setInterval(poll, 2500);
    return () => clearInterval(interval);
  }, [sessionSlug, enabled]);

  return {
    events,
    chatMessages,
    viewerCount,
    connected,
    addEvent,
    setEvents,
    setChatMessages,
  };
}
