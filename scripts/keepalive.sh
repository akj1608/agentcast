#!/usr/bin/env bash
# Ping the app so Render free tier stays warm. Run via cron locally:
#   */14 * * * * /path/to/agentshow/scripts/keepalive.sh
URL="${AGENTSHOW_URL:-https://agentcast-6mf3.onrender.com}/api/health"
curl -fsS -o /dev/null "$URL" && echo "$(date -Iseconds) ok" || echo "$(date -Iseconds) failed"
