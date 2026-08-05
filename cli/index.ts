#!/usr/bin/env tsx
/**
 * Agentshow CLI — stream AI agent events to the platform
 */

import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import * as readline from "readline";

const CONFIG_DIR = path.join(os.homedir(), ".agentshow");
const CONFIG_FILE = path.join(CONFIG_DIR, "config.json");
const BASE_URL = process.env.AGENTSHOW_URL || "http://localhost:3000";

interface Config {
  apiToken?: string;
  email?: string;
  activeSlug?: string;
  streamToken?: string;
}

function loadConfig(): Config {
  try {
    return JSON.parse(fs.readFileSync(CONFIG_FILE, "utf-8"));
  } catch {
    return {};
  }
}

function saveConfig(config: Config) {
  fs.mkdirSync(CONFIG_DIR, { recursive: true });
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
}

function getToken(): string {
  const envToken = process.env.AGENTSHOW_TOKEN;
  if (envToken) return envToken;
  const config = loadConfig();
  if (config.apiToken) return config.apiToken;
  console.error("Not authenticated. Run: npm run cli -- login <email> <password>");
  process.exit(1);
}

async function api(
  method: string,
  endpoint: string,
  body?: unknown,
  token?: string
) {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `API error ${res.status}`);
  }
  return data;
}

async function login(email: string, password: string) {
  if (!email || !password) {
    console.error("Usage: npm run cli -- login <email> <password>");
    process.exit(1);
  }
  const data = await api("POST", "/api/auth/login", { email, password });
  saveConfig({ apiToken: data.user.apiToken, email });
  console.log(`✓ Logged in as ${data.user.displayName}`);
  console.log(`  API token saved to ${CONFIG_FILE}`);
}

async function stream(args: Record<string, string>) {
  const token = getToken();
  const title = args.title || `CLI Session ${new Date().toLocaleString()}`;
  const agent = args.agent || "claude-code";

  const { session, streamToken } = await api(
    "POST",
    "/api/sessions",
    {
      title,
      agent,
      model: args.model,
      tags: args.tags ? args.tags.split(",").map((t) => t.trim()) : [],
      description: args.description,
    },
    token
  );

  saveConfig({ ...loadConfig(), activeSlug: session.slug, streamToken });

  console.log(`✓ Session created: ${session.slug}`);
  console.log(`  Watch at: ${BASE_URL}/session/${session.slug}`);
  console.log(`\nType events (format: TYPE|content) or plain text for prompts.`);
  console.log(`Commands: quit — end session\n`);

  const authToken = streamToken;
  const slug = session.slug;

  // Poll talk-back in background
  const pollInterval = setInterval(async () => {
    try {
      const data = await api("GET", `/api/sessions/${slug}/talkback`, undefined, token);
      for (const msg of data.messages || []) {
        console.log(`\n💬 Talk-back [${msg.username}]: ${msg.content}`);
      }
    } catch {
      // ignore when not owner polling
    }
  }, 4000);

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

  const sendEvent = async (type: string, content: string, metadata?: Record<string, unknown>) => {
    await api(
      "POST",
      `/api/sessions/${slug}/events`,
      { events: [{ type, content, metadata }] },
      authToken
    );
    console.log(`  → [${type}] ${content.slice(0, 80)}`);
  };

  rl.on("line", (line) => {
    const trimmed = line.trim();
    if (!trimmed) return;

    void (async () => {
      try {
        if (trimmed === "quit" || trimmed === "exit") {
          clearInterval(pollInterval);
          await api("DELETE", `/api/sessions/${slug}`, undefined, token);
          saveConfig({ ...loadConfig(), activeSlug: undefined, streamToken: undefined });
          console.log("\n✓ Session ended");
          rl.close();
          process.exit(0);
        }

        const pipeIdx = trimmed.indexOf("|");
        if (pipeIdx > 0) {
          const type = trimmed.slice(0, pipeIdx).trim();
          const content = trimmed.slice(pipeIdx + 1).trim();
          await sendEvent(type, content);
        } else {
          await sendEvent("prompt", trimmed);
        }
      } catch (err) {
        console.error(`  ✗ ${err instanceof Error ? err.message : "Error"}`);
      }
    })();
  });
}

async function send(args: Record<string, string>) {
  const token = getToken();
  const slug = args.slug || loadConfig().activeSlug;
  if (!slug) {
    console.error("--slug required (or run stream first)");
    process.exit(1);
  }

  const streamToken = loadConfig().streamToken;

  await api(
    "POST",
    `/api/sessions/${slug}/events`,
    {
      events: [
        {
          type: args.type || "prompt",
          content: args.content || "CLI event",
          metadata: args.file
            ? { file: args.file, linesAdded: parseInt(args.added || "0", 10) }
            : undefined,
        },
      ],
    },
    streamToken || token
  );

  console.log(`✓ Event sent to ${slug}`);
}

function parseArgs(argv: string[]) {
  const command = argv[0];
  const positional: string[] = [];
  const flags: Record<string, string> = {};

  for (let i = 1; i < argv.length; i++) {
    if (argv[i].startsWith("--")) {
      const key = argv[i].slice(2);
      flags[key] = argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[++i] : "true";
    } else {
      positional.push(argv[i]);
    }
  }

  return { command, positional, flags };
}

async function main() {
  const { command, positional, flags } = parseArgs(process.argv.slice(2));

  switch (command) {
    case "login":
      await login(positional[0], positional[1]);
      break;
    case "stream":
      await stream(flags);
      break;
    case "send":
      await send(flags);
      break;
    case "help":
    default:
      console.log(`
Agentshow CLI

Commands:
  login <email> <password>              Authenticate and save API token
  stream --title <t> --agent <a>        Start interactive streaming session
  send --slug <s> --type <t> --content  Send single event

Environment:
  AGENTSHOW_TOKEN    API token (overrides saved config)
  AGENTSHOW_URL      Server URL (default: http://localhost:3000)
`);
  }
}

main().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});
