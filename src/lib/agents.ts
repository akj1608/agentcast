export const AGENTS = [
  { id: "claude-code", label: "Claude Code", color: "#d97706", command: "claude" },
  { id: "composer", label: "Composer", color: "#6366f1", command: "composer" },
  { id: "grok", label: "Grok Build", color: "#1d9bf0", command: "grok" },
  { id: "codex", label: "Codex", color: "#10a37f", command: "codex" },
  { id: "gemini", label: "Gemini", color: "#4285f4", command: "gemini" },
  { id: "aider", label: "Aider", color: "#3b82f6", command: "aider" },
  { id: "copilot", label: "Copilot", color: "#238636", command: "copilot" },
  { id: "windsurf", label: "Windsurf", color: "#06b6d4", command: "windsurf" },
  { id: "opencode", label: "OpenCode", color: "#a855f7", command: "opencode" },
] as const;

export type AgentId = (typeof AGENTS)[number]["id"];

export const AGENT_INSTALL_HINTS: Record<string, string> = {
  claude: "npm install -g @anthropic-ai/claude-code",
  composer: "Install shell command from your IDE (Cmd+Shift+P)",
  grok: "curl -fsSL https://x.ai/cli/install.sh | bash",
  codex: "npm install -g @openai/codex",
  gemini: "npm install -g @google/gemini-cli",
  aider: "pip install aider-chat",
  copilot: "gh extension install github/gh-copilot",
  windsurf: "Windsurf → install shell command",
  opencode: "npm install -g opencode-ai",
};

export function getAgentLabel(id: string) {
  return AGENTS.find((a) => a.id === id)?.label ?? id;
}

export function getAgentColor(id: string) {
  return AGENTS.find((a) => a.id === id)?.color ?? "#6366f1";
}

export function getAgentByCommand(command: string) {
  return AGENTS.find((a) => a.command === command);
}

export function serializeEventForClient(event: {
  id: string;
  sessionId?: string;
  sequence: number;
  type: string;
  content: string;
  metadata: string | null;
  timestamp: Date;
}) {
  return {
    id: event.id,
    sequence: event.sequence,
    type: event.type,
    content: event.content,
    metadata: event.metadata ? JSON.parse(event.metadata) : null,
    timestamp: event.timestamp.getTime(),
  };
}
