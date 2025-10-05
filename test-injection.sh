#!/bin/bash

# Test script for server text injection
# Usage: ./test-injection.sh <session_id> <text>

SESSION_ID="$1"
TEXT="$2"

if [ -z "$SESSION_ID" ] || [ -z "$TEXT" ]; then
    echo "Usage: $0 <session_id> <text>"
    echo "Example: $0 abc123xyz 'Hello from the server!'"
    exit 1
fi

echo "Injecting text into session: $SESSION_ID"
echo "Text: $TEXT"
echo ""

curl -X POST http://localhost:3000/inject-text \
  -H "Content-Type: application/json" \
  -d "{
    \"sessionId\": \"$SESSION_ID\",
    \"text\": \"$TEXT\",
    \"type\": \"system\"
  }" \
  -w "\n"

echo ""
echo "Injection complete!"