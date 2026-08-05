#!/usr/bin/env node
/**
 * AgentCast CLI — install once, sign in via browser, stream sessions.
 *   curl -fsSL https://agentcast-6mf3.onrender.com/install.sh | bash
 *   agentcast claude
 */

import { createInterface } from "readline";
import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { homedir, platform } from "os";
import { join } from "path";
import { spawn } from "child_process";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

const CONFIG_DIR = join(homedir(), ".agentcast");
const CONFIG_FILE = join(CONFIG_DIR, "config.json");
const BASE_URL = process.env.AGENTCAST_URL || "https://agentcast-6mf3.onrender.com";

const AGENT_ALIASES = {
  claude: "claude-code",
  "claude-code": "claude-code",
  cursor: "composer",
  composer: "composer",
  grok: "grok",
  codex: "codex",
  gemini: "gemini",
  aider: "aider",
  copilot: "copilot",
  windsurf: "windsurf",
  opencode: "opencode",
};

/** @type {Record<string, { agent: string, label: string, bin: string, binFlag: string, install: string, start: string, end: string, aliases?: string[], args?: (flags: Record<string, string>) => string[] }>} */
const AGENT_PROFILES = {
  claude: {
    agent: "claude-code",
    label: "Claude Code",
    bin: "claude",
    binFlag: "claude",
    install: "npm install -g @anthropic-ai/claude-code",
    start: "Claude Code session started",
    end: "Claude Code session ended",
    args: (flags) => (flags._ ? flags._.split(" ").filter(Boolean) : []),
  },
  cursor: {
    agent: "composer",
    label: "Cursor",
    bin: "cursor",
    binFlag: "cursor",
    install: "Cursor → Cmd+Shift+P → Install shell command",
    start: "Cursor session started",
    end: "Cursor session ended",
    aliases: ["composer"],
    args: () => [process.cwd()],
  },
  grok: {
    agent: "grok",
    label: "Grok Build",
    bin: "grok",
    binFlag: "grok",
    install: "curl -fsSL https://x.ai/cli/install.sh | bash",
    start: "Grok session started",
    end: "Grok session ended",
    args: (flags) => (flags._ ? flags._.split(" ").filter(Boolean) : []),
  },
  codex: {
    agent: "codex",
    label: "Codex",
    bin: "codex",
    binFlag: "codex",
    install: "npm install -g @openai/codex",
    start: "Codex session started",
    end: "Codex session ended",
    args: (flags) => (flags._ ? flags._.split(" ").filter(Boolean) : []),
  },
  gemini: {
    agent: "gemini",
    label: "Gemini",
    bin: "gemini",
    binFlag: "gemini",
    install: "npm install -g @google/gemini-cli",
    start: "Gemini session started",
    end: "Gemini session ended",
    args: (flags) => (flags._ ? flags._.split(" ").filter(Boolean) : []),
  },
  aider: {
    agent: "aider",
    label: "Aider",
    bin: "aider",
    binFlag: "aider",
    install: "pip install aider-chat",
    start: "Aider session started",
    end: "Aider session ended",
    args: (flags) => (flags._ ? flags._.split(" ").filter(Boolean) : []),
  },
  copilot: {
    agent: "copilot",
    label: "Copilot",
    bin: "copilot",
    binFlag: "copilot",
    install: "npm install -g @github/copilot  (or: gh extension install github/gh-copilot)",
    start: "Copilot session started",
    end: "Copilot session ended",
    args: (flags) => (flags._ ? flags._.split(" ").filter(Boolean) : []),
  },
  windsurf: {
    agent: "windsurf",
    label: "Windsurf",
    bin: "windsurf",
    binFlag: "windsurf",
    install: "Windsurf → install shell command",
    start: "Windsurf session started",
    end: "Windsurf session ended",
    args: () => [process.cwd()],
  },
  opencode: {
    agent: "opencode",
    label: "OpenCode",
    bin: "opencode",
    binFlag: "opencode",
    install: "npm install -g opencode-ai",
    start: "OpenCode session started",
    end: "OpenCode session ended",
    args: (flags) => (flags._ ? flags._.split(" ").filter(Boolean) : []),
  },
};

function resolveProfile(cmd) {
  const key = (cmd || "").toLowerCase();
  if (AGENT_PROFILES[key]) return { name: key, ...AGENT_PROFILES[key] };
  for (const [name, profile] of Object.entries(AGENT_PROFILES)) {
    if (profile.aliases?.includes(key)) return { name, ...profile };
  }
  return null;
}

function loadConfig() {
  try {
    return JSON.parse(readFileSync(CONFIG_FILE, "utf-8"));
  } catch {
    return {};
  }
}

function saveConfig(patch) {
  mkdirSync(CONFIG_DIR, { recursive: true });
  writeFileSync(CONFIG_FILE, JSON.stringify({ ...loadConfig(), ...patch }, null, 2));
}

function normalizeAgent(agent) {
  const key = (agent || "claude-code").toLowerCase();
  return AGENT_ALIASES[key] || key;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function openBrowser(url) {
  const cmd =
    platform() === "darwin"
      ? `open "${url}"`
      : platform() === "win32"
        ? `start "" "${url}"`
        : `xdg-open "${url}"`;
  try {
    await execAsync(cmd);
  } catch {
    // Browser open is best-effort
  }
}

function getTokenOrNull() {
  const config = loadConfig();
  if (config.apiToken) return config.apiToken;
  if (process.env.AGENTCAST_TOKEN) return process.env.AGENTCAST_TOKEN;
  return null;
}

function getToken() {
  const token = getTokenOrNull();
  if (!token) {
    console.error(`Not signed in. Run: agentcast login`);
    process.exit(1);
  }
  return token;
}

function authHelp() {
  const config = loadConfig();
  const envOverride =
    process.env.AGENTCAST_TOKEN && config.apiToken && process.env.AGENTCAST_TOKEN !== config.apiToken;
  console.error(`
Unauthorized — session expired or token invalid.

Run: agentcast login
${envOverride ? "\nStale AGENTCAST_TOKEN in your shell may be overriding ~/.agentcast/config.json.\nRun: unset AGENTCAST_TOKEN\n" : ""}
Server:  ${BASE_URL}
${config.serverUrl && config.serverUrl !== BASE_URL ? `Saved:   ${config.serverUrl} (set AGENTCAST_URL to match)\n` : ""}Config:  ${CONFIG_FILE}
`);
}

async function api(method, endpoint, body, token, { exitOn401 = true } = {}) {
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
    if (res.status === 401) {
      if (exitOn401) {
        authHelp();
        process.exit(1);
      }
      throw new Error("Unauthorized");
    }
    throw new Error(data.error || `HTTP ${res.status}`);
  }
  return data;
}

async function verifyToken(token) {
  try {
    await api("GET", "/api/auth/verify", undefined, token, { exitOn401: false });
    return true;
  } catch {
    return false;
  }
}

async function loginBrowser() {
  const res = await fetch(`${BASE_URL}/api/auth/device`, { method: "POST" });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);

  const { userCode, deviceSecret, verifyUrl, expiresIn } = data;

  console.log("");
  console.log("  Sign in to AgentCast in your browser.");
  console.log(`  Code: ${userCode}`);
  console.log("");
  console.log(`  ${verifyUrl}`);
  console.log("");

  await openBrowser(verifyUrl);

  const deadline = Date.now() + expiresIn * 1000;
  while (Date.now() < deadline) {
    await sleep(2000);
    const pollRes = await fetch(
      `${BASE_URL}/api/auth/device/poll?secret=${encodeURIComponent(deviceSecret)}`
    );
    const poll = await pollRes.json().catch(() => ({}));

    if (poll.status === "approved") {
      saveConfig({
        apiToken: poll.apiToken,
        email: poll.user.email,
        serverUrl: BASE_URL,
      });
      if (!(await verifyToken(poll.apiToken))) {
        throw new Error("Login succeeded but token verification failed. Try again.");
      }
      console.log(`Signed in as ${poll.user.displayName}`);
      console.log(`Server: ${BASE_URL}`);
      return;
    }
    if (poll.status === "expired" || poll.status === "invalid") {
      throw new Error("Login expired. Run agentcast login again.");
    }
    process.stdout.write(".");
  }

  throw new Error("Login timed out. Run agentcast login again.");
}

async function ensureLoggedIn() {
  const token = getTokenOrNull();
  if (token && (await verifyToken(token))) return;
  await loginBrowser();
}

async function saveToken(token, email) {
  const data = await api("GET", "/api/auth/verify", undefined, token);
  saveConfig({
    apiToken: token,
    email: email || data.user.email,
    serverUrl: BASE_URL,
  });
  console.log(`Logged in as ${data.user.displayName} (@${data.user.username})`);
  console.log(`Server:  ${BASE_URL}`);
}

async function login(email, password, tokenFlag) {
  if (tokenFlag) {
    await saveToken(tokenFlag);
    return;
  }
  if (email && password) {
    const data = await api("POST", "/api/auth/login", { email, password });
    saveConfig({
      apiToken: data.user.apiToken,
      email: data.user.email,
      serverUrl: BASE_URL,
    });
    console.log(`Logged in as ${data.user.displayName}`);
    console.log(`Server:  ${BASE_URL}`);
    return;
  }
  await loginBrowser();
}

async function whoami() {
  const token = getToken();
  const data = await api("GET", "/api/auth/verify", undefined, token);
  console.log(`Logged in as ${data.user.displayName} (@${data.user.username})`);
  console.log(`Email:   ${data.user.email}`);
  console.log(`Server:  ${BASE_URL}`);
  if (data.server) console.log(`App URL: ${data.server}`);
}

async function createSession(title, agent, extra = {}) {
  const token = getToken();
  return api(
    "POST",
    "/api/sessions",
    {
      title,
      agent: normalizeAgent(agent),
      model: extra.model,
      tags: extra.tags ? extra.tags.split(",") : [],
    },
    token
  );
}

async function stream(args) {
  await ensureLoggedIn();
  const token = getToken();
  const config = loadConfig();
  if (config.serverUrl && config.serverUrl !== BASE_URL) {
    console.warn(`Warning: logged in to ${config.serverUrl} but using ${BASE_URL}`);
    console.warn(`Set: export AGENTCAST_URL=${config.serverUrl}\n`);
  }

  const title = args.title || `CLI Session ${new Date().toLocaleString()}`;
  const agent = normalizeAgent(args.agent);

  const { session, streamToken } = await createSession(title, agent, args);
  saveConfig({ activeSlug: session.slug, streamToken });

  console.log(`Session: ${session.slug}`);
  console.log(`Watch:   ${BASE_URL}/session/${session.slug}`);
  console.log(`\nType events as TYPE|content or plain text for prompts.`);
  console.log(`Examples:`);
  console.log(`  file_write|Updated auth.ts`);
  console.log(`  thinking|Analyzing the codebase...`);
  console.log(`  agent_reply|Done! I've refactored the auth module.`);
  console.log(`Type 'quit' to end.\n`);

  const slug = session.slug;
  const authToken = streamToken || token;

  const rl = createInterface({ input: process.stdin, output: process.stdout });

  const sendEvent = async (type, content, metadata) => {
    await api(
      "POST",
      `/api/sessions/${slug}/events`,
      { events: [{ type, content, metadata }] },
      authToken
    );
    console.log(`  -> [${type}] ${content.slice(0, 80)}`);
  };

  rl.on("line", (line) => {
    const trimmed = line.trim();
    if (!trimmed) return;
    void (async () => {
      try {
        if (trimmed === "quit" || trimmed === "exit") {
          await api("DELETE", `/api/sessions/${slug}`, undefined, token);
          console.log("Session ended.");
          rl.close();
          process.exit(0);
        }
        const pipeIdx = trimmed.indexOf("|");
        if (pipeIdx > 0) {
          await sendEvent(trimmed.slice(0, pipeIdx).trim(), trimmed.slice(pipeIdx + 1).trim());
        } else {
          await sendEvent("prompt", trimmed);
        }
      } catch (err) {
        console.error(`  Error: ${err.message}`);
      }
    })();
  });
}

async function runLiveSession({ title, agent, startMessage, endMessage, spawnSpec }) {
  await ensureLoggedIn();
  const token = getToken();

  const { session, streamToken } = await createSession(title, agent);
  const slug = session.slug;
  const authToken = streamToken || token;

  saveConfig({ activeSlug: slug, streamToken });

  const watchUrl = `${BASE_URL}/session/${slug}`;
  console.log("");
  console.log(`  Live:  ${watchUrl}`);
  console.log("");

  await openBrowser(watchUrl);

  await api(
    "POST",
    `/api/sessions/${slug}/events`,
    {
      events: [
        {
          type: "system",
          content: startMessage,
          metadata: { cwd: process.cwd() },
        },
      ],
    },
    authToken
  );

  let ending = false;
  const endSession = async () => {
    if (ending) return;
    ending = true;
    try {
      await api(
        "POST",
        `/api/sessions/${slug}/events`,
        { events: [{ type: "system", content: endMessage }] },
        authToken
      );
      await api("DELETE", `/api/sessions/${slug}`, undefined, token);
    } catch {
      // Best effort cleanup
    }
  };

  const onSignal = async () => {
    await endSession();
    process.exit(0);
  };

  process.once("SIGINT", onSignal);
  process.once("SIGTERM", onSignal);

  if (spawnSpec) {
    const { bin, args, label, notFoundHint } = spawnSpec;
    console.log(`Starting ${label || bin}…\n`);

    const child = spawn(bin, args, {
      stdio: "inherit",
      shell: platform() === "win32",
      cwd: process.cwd(),
    });

    child.on("error", async (err) => {
      console.error(`Failed to start ${bin}: ${err.message}`);
      console.error(notFoundHint);
      await endSession();
      process.exit(1);
    });

    child.on("exit", async (code) => {
      await endSession();
      process.exit(code ?? 0);
    });
    return;
  }

  console.log("Session is live. Press Ctrl+C to end.\n");
  await new Promise(() => {});
}

async function runAgent(cmdName, flags) {
  const profile = resolveProfile(cmdName);
  if (!profile) {
    console.error(`Unknown agent: ${cmdName}`);
    process.exit(1);
  }

  const bin = flags[profile.binFlag] || profile.bin;
  const args = profile.args(flags);

  await runLiveSession({
    title: flags.title || `${profile.label} session ${new Date().toLocaleString()}`,
    agent: profile.agent,
    startMessage: profile.start,
    endMessage: profile.end,
    spawnSpec: {
      bin,
      args,
      label: profile.label,
      notFoundHint: `Install ${profile.label}: ${profile.install}\nOr: agentcast ${profile.name} --${profile.binFlag} /path/to/binary`,
    },
  });
}

function listAgents() {
  console.log("\nSupported agents:\n");
  for (const [name, profile] of Object.entries(AGENT_PROFILES)) {
    console.log(`  agentcast ${name.padEnd(10)}  ${profile.label}`);
    console.log(`    install: ${profile.install}`);
    if (profile.aliases?.length) {
      console.log(`    aliases: ${profile.aliases.join(", ")}`);
    }
    console.log("");
  }
  console.log("Generic: agentcast stream --agent <name> --title \"My build\"\n");
}

async function send(args) {
  const token = getToken();
  const slug = args.slug || loadConfig().activeSlug;
  if (!slug) {
    console.error("--slug required");
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
          metadata: args.file ? { file: args.file } : undefined,
        },
      ],
    },
    streamToken || token
  );
  console.log(`Event sent to ${slug}`);
}

function parseArgs(argv) {
  const command = argv[0];
  const positional = [];
  const flags = {};
  for (let i = 1; i < argv.length; i++) {
    if (argv[i].startsWith("--")) {
      const key = argv[i].slice(2);
      flags[key] = argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[++i] : "true";
    } else {
      positional.push(argv[i]);
    }
  }
  if (positional.length > 0) {
    flags._ = positional.join(" ");
  }
  return { command, positional, flags };
}

const { command, positional, flags } = parseArgs(process.argv.slice(2));
const profile = resolveProfile(command);

switch (command) {
  case "login":
    await login(positional[0], positional[1], flags.token);
    break;
  case "whoami":
    await whoami();
    break;
  case "agents":
    listAgents();
    break;
  case "stream":
    await stream(flags);
    break;
  case "send":
    await send(flags);
    break;
  default:
    if (profile) {
      await runAgent(command, flags);
      break;
    }
    console.log(`
AgentCast CLI  (${BASE_URL})

Install (signs you in via browser):
  curl -fsSL ${BASE_URL}/install.sh | bash

Run a session:
  agentcast claude
  agentcast cursor
  agentcast grok
  agentcast codex
  agentcast gemini
  agentcast aider
  agentcast copilot
  agentcast windsurf
  agentcast opencode

  agentcast agents          # list all agents + install hints

Auth:
  agentcast login           # opens browser — no token needed
  agentcast whoami

Env: AGENTCAST_URL, AGENTCAST_TOKEN
`);
}
