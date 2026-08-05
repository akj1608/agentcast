#!/usr/bin/env bash
# Print Google OAuth redirect URIs to add for Agentshow.
set -euo pipefail

CLIENT_ID="372272193853-se89tnjo7f6u8quhcjuf4omfrl2vh6se.apps.googleusercontent.com"
CONSOLE_URL="https://console.cloud.google.com/apis/credentials/oauthclient/${CLIENT_ID}?project=372272193853"

echo "Add these Authorized redirect URIs in Google Cloud Console:"
echo ""
echo "  https://agentshow.is-a.dev/api/auth/google/callback"
echo "  https://agentcast-6mf3.onrender.com/api/auth/google/callback"
echo ""
echo "Open: ${CONSOLE_URL}"
echo ""
echo "Under Authorized JavaScript origins, also add:"
echo "  https://agentshow.is-a.dev"
echo "  https://agentcast-6mf3.onrender.com"
