#!/usr/bin/env bash
# Wire Render Postgres to the agentshow web service
set -euo pipefail

SERVICE_ID="srv-d9o85q0ae00c73audfug"
POSTGRES_ID="dpg-d9o94lj7uimc738rjb90-a"
RENDER_KEY=$(grep '^    key:' "$HOME/.render/cli.yaml" | awk '{print $2}')

DB_URL=$(render postgres get "$POSTGRES_ID" --include-sensitive-connection-info --output json \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['connectionInfo']['internalConnectionString'])")

# Prisma needs sslmode for Render Postgres
if [[ "$DB_URL" != *"sslmode="* ]]; then
  if [[ "$DB_URL" == *"?"* ]]; then
    DB_URL="${DB_URL}&sslmode=require"
  else
    DB_URL="${DB_URL}?sslmode=require"
  fi
fi

echo "Setting DATABASE_URL on agentshow web service..."
curl -sf -X PUT \
  -H "Authorization: Bearer $RENDER_KEY" \
  -H "Content-Type: application/json" \
  "https://api.render.com/v1/services/${SERVICE_ID}/env-vars/DATABASE_URL" \
  -d "$(python3 -c "import json,sys; print(json.dumps({'value': sys.argv[1]}))" "$DB_URL")" \
  > /dev/null

echo "DATABASE_URL updated. Triggering redeploy..."
render deploys create "$SERVICE_ID" --confirm

echo "Done."
