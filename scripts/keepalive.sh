#!/usr/bin/env bash
# Ping the app so Render free tier stays warm. Run via cron locally:
#   */14 * * * * /path/to/agentcast/scripts/keepalive.sh
URL="${AGENTCAST_URL:-https://www.agentcast.com}/api/health"
curl -fsS -o /dev/null "$URL" && echo "$(date -Iseconds) ok" || echo "$(date -Iseconds) failed"
