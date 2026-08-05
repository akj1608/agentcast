#!/usr/bin/env bash
# Configure Google OAuth env vars on Render for AgentCast
set -euo pipefail

SERVICE_ID="srv-d9o85q0ae00c73audfug"
RENDER_KEY=$(grep '^    key:' "$HOME/.render/cli.yaml" | awk '{print $2}')
APP_URL="https://www.agentcast.com"

if [ -z "${GOOGLE_CLIENT_ID:-}" ] || [ -z "${GOOGLE_CLIENT_SECRET:-}" ]; then
  echo "Usage: GOOGLE_CLIENT_ID=... GOOGLE_CLIENT_SECRET=... bash scripts/setup-google-oauth.sh"
  exit 1
fi

set_env() {
  local key="$1"
  local value="$2"
  curl -sf -X PUT \
    -H "Authorization: Bearer $RENDER_KEY" \
    -H "Content-Type: application/json" \
    -H "Accept: application/json" \
    "https://api.render.com/v1/services/${SERVICE_ID}/env-vars/${key}" \
    -d "{\"value\": $(python3 -c "import json,sys; print(json.dumps(sys.argv[1]))" "$value")}" \
    > /dev/null
  echo "Set $key"
}

set_env "GOOGLE_CLIENT_ID" "$GOOGLE_CLIENT_ID"
set_env "GOOGLE_CLIENT_SECRET" "$GOOGLE_CLIENT_SECRET"
set_env "NEXT_PUBLIC_APP_URL" "$APP_URL"

echo ""
echo "Triggering redeploy..."
render deploys create "$SERVICE_ID" --confirm

echo ""
echo "Done! Verify at: ${APP_URL}/api/auth/config"
echo "Should return: {\"googleEnabled\":true,...}"
