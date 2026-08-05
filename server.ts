import { createServer } from "http";
import { parse } from "url";
import next from "next";
import { WebSocketServer, WebSocket } from "ws";
import { eventBus } from "./src/lib/event-bus";

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = parseInt(process.env.PORT || "3000", 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url!, true);
    handle(req, res, parsedUrl);
  });

  const wss = new WebSocketServer({ noServer: true });

  server.on("upgrade", (req, socket, head) => {
    const { pathname, query } = parse(req.url || "", true);

    if (pathname === "/ws") {
      const sessionId = query.sessionId as string;
      if (!sessionId) {
        socket.destroy();
        return;
      }

      wss.handleUpgrade(req, socket, head, (ws) => {
        eventBus.subscribe(ws, sessionId);

        ws.on("close", () => eventBus.unsubscribe(ws));
        ws.on("error", () => eventBus.unsubscribe(ws));

        ws.send(
          JSON.stringify({
            type: "connected",
            sessionId,
            viewerCount: eventBus.getViewerCount(sessionId),
          })
        );
      });
    } else {
      socket.destroy();
    }
  });

  setInterval(() => {
    eventBus.publish({ type: "heartbeat" });
  }, 30000);

  server.listen(port, "0.0.0.0", () => {
    console.log(`> AgentCast ready on http://0.0.0.0:${port}`);
  });
});
