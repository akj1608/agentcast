#!/usr/bin/env bash
set -e

INSTALL_DIR="${AGENTCAST_INSTALL_DIR:-$HOME/.local/bin}"
CLI_DIR="$HOME/.agentcast"
BASE_URL="${AGENTCAST_URL:-https://agentcast-6mf3.onrender.com}"

mkdir -p "$INSTALL_DIR" "$CLI_DIR"

echo "Installing AgentCast CLI..."
curl -fsSL "$BASE_URL/agentcast-cli.mjs" -o "$CLI_DIR/agentcast.mjs"

cat > "$INSTALL_DIR/agentcast" << 'WRAPPER'
#!/usr/bin/env bash
exec node "$HOME/.agentcast/agentcast.mjs" "$@"
WRAPPER

chmod +x "$INSTALL_DIR/agentcast"
chmod +x "$CLI_DIR/agentcast.mjs"

export PATH="$INSTALL_DIR:$PATH"
export AGENTCAST_URL="$BASE_URL"

echo ""
echo "✓ Installed to $INSTALL_DIR/agentcast"
echo ""

if ! command -v node >/dev/null 2>&1; then
  echo "Node.js is required. Install from https://nodejs.org then rerun this script."
  exit 1
fi

if ! agentcast whoami >/dev/null 2>&1; then
  echo "Signing in via browser (one time)..."
  echo ""
  agentcast login
  echo ""
fi

echo "Ready! Pick an agent:"
echo "  agentcast claude | composer | grok | codex | gemini | aider"
echo "  agentcast agents   # full list"
echo ""
