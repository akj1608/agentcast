#!/bin/bash
set -e
BASE="${AGENTSHOW_URL:-http://localhost:3000}"

echo "=== Agentshow integration test ==="

echo "1. Login..."
LOGIN=$(curl -sf -X POST "$BASE/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@agentcast.io","password":"demo1234"}')
TOKEN=$(echo "$LOGIN" | python3 -c "import sys,json; print(json.load(sys.stdin)['user']['apiToken'])")
echo "   OK"

echo "2. Create live session..."
SESSION=$(curl -sf -X POST "$BASE/api/sessions" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"title":"Integration Test","agent":"claude-code","tags":["test"]}')
SLUG=$(echo "$SESSION" | python3 -c "import sys,json; print(json.load(sys.stdin)['session']['slug'])")
STREAM=$(echo "$SESSION" | python3 -c "import sys,json; print(json.load(sys.stdin)['streamToken'])")
echo "   Session: $SLUG"

echo "3. Stream events..."
curl -sf -X POST "$BASE/api/sessions/$SLUG/events" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $STREAM" \
  -d '{"events":[{"type":"prompt","content":"Test prompt"},{"type":"file_write","content":"Updated main.ts","metadata":{"file":"src/main.ts","linesAdded":12}}]}' > /dev/null
echo "   OK"

echo "4. Verify events..."
COUNT=$(curl -sf "$BASE/api/sessions/$SLUG/events" | python3 -c "import sys,json; print(len(json.load(sys.stdin)['events']))")
if [ "$COUNT" -lt 3 ]; then
  echo "   FAIL: expected >= 3 events, got $COUNT"
  exit 1
fi
echo "   $COUNT events stored"

echo "5. Chat..."
curl -sf -X POST "$BASE/api/sessions/$SLUG/chat" \
  -H "Content-Type: application/json" \
  -d '{"content":"Hello from test","username":"tester"}' > /dev/null
echo "   OK"

echo "6. Talk-back..."
curl -sf -X POST "$BASE/api/sessions/$SLUG/talkback" \
  -H "Content-Type: application/json" \
  -d '{"content":"Please add tests","username":"viewer1"}' > /dev/null
echo "   OK"

echo "7. End session..."
curl -sf -X DELETE "$BASE/api/sessions/$SLUG" \
  -H "Authorization: Bearer $TOKEN" > /dev/null
echo "   OK"

echo ""
echo "All tests passed!"
echo "View replay: $BASE/session/$SLUG"
