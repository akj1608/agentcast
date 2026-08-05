#!/usr/bin/env bash
set -e

INSTALL_DIR="${AGENTSHOW_INSTALL_DIR:-$HOME/.local/bin}"
CLI_DIR="$HOME/.agentshow"
BASE_URL="${AGENTSHOW_URL:-https://agentcast-6mf3.onrender.com}"

mkdir -p "$INSTALL_DIR" "$CLI_DIR"

echo "Installing Agentshow CLI..."
curl -fsSL "$BASE_URL/agentshow-cli.mjs" -o "$CLI_DIR/agentshow.mjs"

cat > "$INSTALL_DIR/agentshow" << 'WRAPPER'
#!/usr/bin/env bash
exec node "$HOME/.agentshow/agentshow.mjs" "$@"
WRAPPER

chmod +x "$INSTALL_DIR/agentshow"
chmod +x "$CLI_DIR/agentshow.mjs"

export PATH="$INSTALL_DIR:$PATH"
export AGENTSHOW_URL="$BASE_URL"

echo ""
echo "✓ Installed to $INSTALL_DIR/agentshow"
echo ""

if ! command -v node >/dev/null 2>&1; then
  echo "Node.js is required. Install from https://nodejs.org then rerun this script."
  exit 1
fi

if ! agentshow whoami >/dev/null 2>&1; then
  echo "Signing in via browser (one time)..."
  echo ""
  agentshow login
  echo ""
fi

echo "Ready! Pick an agent:"
echo "  agentshow claude | cursor | grok | codex | gemini | aider"
echo "  agentshow agents   # full list"
echo ""
