import type { WebSocket } from "ws";

export type BusMessage =
  | { type: "event"; sessionId: string; data: unknown }
  | { type: "chat"; sessionId: string; data: unknown }
  | { type: "talkback"; sessionId: string; data: unknown }
  | { type: "viewer_count"; sessionId: string; count: number }
  | { type: "session_ended"; sessionId: string }
  | { type: "heartbeat" };

type Subscriber = {
  ws: WebSocket;
  sessionId: string;
};

class EventBus {
  private subscribers = new Map<WebSocket, Subscriber>();
  private viewerCounts = new Map<string, number>();

  subscribe(ws: WebSocket, sessionId: string) {
    this.subscribers.set(ws, { ws, sessionId });
    const count = (this.viewerCounts.get(sessionId) || 0) + 1;
    this.viewerCounts.set(sessionId, count);
    this.broadcastToSession(sessionId, {
      type: "viewer_count",
      sessionId,
      count,
    });
  }

  unsubscribe(ws: WebSocket) {
    const sub = this.subscribers.get(ws);
    if (sub) {
      const count = Math.max(0, (this.viewerCounts.get(sub.sessionId) || 1) - 1);
      this.viewerCounts.set(sub.sessionId, count);
      this.broadcastToSession(sub.sessionId, {
        type: "viewer_count",
        sessionId: sub.sessionId,
        count,
      });
    }
    this.subscribers.delete(ws);
  }

  publish(message: BusMessage) {
    if (message.type === "heartbeat") {
      this.subscribers.forEach(({ ws }) => {
        if (ws.readyState === ws.OPEN) {
          ws.send(JSON.stringify(message));
        }
      });
      return;
    }

    const sessionId = message.sessionId;
    this.broadcastToSession(sessionId, message);
  }

  private broadcastToSession(sessionId: string, message: BusMessage) {
    const payload = JSON.stringify(message);
    this.subscribers.forEach(({ ws, sessionId: sid }) => {
      if (sid === sessionId && ws.readyState === ws.OPEN) {
        ws.send(payload);
      }
    });
  }

  getViewerCount(sessionId: string) {
    return this.viewerCounts.get(sessionId) || 0;
  }
}

const globalForBus = globalThis as unknown as { eventBus?: EventBus };

export const eventBus = globalForBus.eventBus ?? new EventBus();
if (process.env.NODE_ENV !== "production") globalForBus.eventBus = eventBus;
