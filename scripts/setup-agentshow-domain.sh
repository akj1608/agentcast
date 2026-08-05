#!/usr/bin/env bash
# Verify agentshow.is-a.dev on Render (free is-a.dev subdomain).
set -euo pipefail

SERVICE_ID="srv-d9o85q0ae00c73audfug"
DOMAIN="agentshow.is-a.dev"
RENDER_KEY=$(grep -A1 '^api:' "$HOME/.render/cli.yaml" | awk '/key:/ {print $2}')

echo "=== Agentshow domain (${DOMAIN}) ==="
echo ""
echo "Free domain via is-a.dev — PR: https://github.com/is-a-dev/register/pull/46281"
echo "DNS: A record → 216.24.57.1 (configured in that PR)"
echo ""

curl -sf -X POST \
  -H "Authorization: Bearer $RENDER_KEY" \
  -H "Content-Type: application/json" \
  "https://api.render.com/v1/services/${SERVICE_ID}/custom-domains" \
  -d "{\"name\": \"$DOMAIN\"}" >/dev/null 2>&1 || true

code=$(curl -s -o /dev/null -w "%{http_code}" -X POST \
  -H "Authorization: Bearer $RENDER_KEY" \
  "https://api.render.com/v1/services/${SERVICE_ID}/custom-domains/${DOMAIN}/verify")
echo "Render verify ${DOMAIN} → HTTP $code"

curl -sf -X PUT \
  -H "Authorization: Bearer $RENDER_KEY" \
  -H "Content-Type: application/json" \
  "https://api.render.com/v1/services/${SERVICE_ID}/env-vars/NEXT_PUBLIC_APP_URL" \
  -d '{"value": "https://agentshow.is-a.dev"}' >/dev/null
echo "NEXT_PUBLIC_APP_URL=https://agentshow.is-a.dev ✓"
echo ""
echo "Google OAuth redirect:"
echo "  https://agentshow.is-a.dev/api/auth/google/callback"
echo ""
echo "Check: curl -s https://agentshow.is-a.dev/api/health"
