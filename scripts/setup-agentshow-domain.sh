#!/usr/bin/env bash
# Register agentshow.dev DNS and verify on Render.
set -euo pipefail

SERVICE_ID="srv-d9o85q0ae00c73audfug"
RENDER_HOST="agentcast-6mf3.onrender.com"
RENDER_IP="216.24.57.1"
DOMAIN="agentshow.dev"
RENDER_KEY=$(grep -A1 '^api:' "$HOME/.render/cli.yaml" | awk '/key:/ {print $2}')

echo "=== Agentshow domain setup ==="
echo ""
echo "1. Register ${DOMAIN} at your registrar (Cloudflare, Namecheap, Google, etc.)"
echo ""
echo "2. Add DNS records:"
echo "   Apex (@):  A     → ${RENDER_IP}"
echo "   www:       CNAME → ${RENDER_HOST}"
echo "   (Cloudflare: use CNAME @ → ${RENDER_HOST}, proxy OFF until SSL is issued)"
echo ""
echo "3. Remove any AAAA records."
echo ""

for name in "$DOMAIN" "www.$DOMAIN"; do
  curl -sf -X POST \
    -H "Authorization: Bearer $RENDER_KEY" \
    -H "Content-Type: application/json" \
    "https://api.render.com/v1/services/${SERVICE_ID}/custom-domains" \
    -d "{\"name\": \"$name\"}" >/dev/null 2>&1 || true
done

echo "4. Verifying DNS on Render..."
for name in "$DOMAIN" "www.$DOMAIN"; do
  code=$(curl -s -o /dev/null -w "%{http_code}" -X POST \
    -H "Authorization: Bearer $RENDER_KEY" \
    "https://api.render.com/v1/services/${SERVICE_ID}/custom-domains/${name}/verify")
  echo "   $name → HTTP $code"
done

curl -sf -X PUT \
  -H "Authorization: Bearer $RENDER_KEY" \
  -H "Content-Type: application/json" \
  "https://api.render.com/v1/services/${SERVICE_ID}/env-vars/NEXT_PUBLIC_APP_URL" \
  -d '{"value": "https://agentshow.dev"}' >/dev/null
echo ""
echo "5. Set NEXT_PUBLIC_APP_URL=https://agentshow.dev on Render ✓"
echo ""
echo "6. Google OAuth — add redirect URI:"
echo "   https://agentshow.dev/api/auth/google/callback"
echo "   https://console.cloud.google.com/apis/credentials/oauthclient/372272193853-se89tnjo7f6u8quhcjuf4omfrl2vh6se.apps.googleusercontent.com"
echo ""
echo "7. Check status:"
echo "   curl -s https://agentshow.dev/api/health"
echo "   curl -s https://agentshow.dev/api/auth/config"
