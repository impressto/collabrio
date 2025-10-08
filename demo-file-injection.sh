#!/bin/bash

# File-based message injection demo
# Usage: ./demo-file-injection.sh

echo "🎬 File-based Message Injection Demo"
echo "===================================="
echo ""

# Get current active sessions
echo "📡 Checking active sessions..."
ACTIVE_SESSIONS=$(curl -s http://localhost:4244/status | grep -o '"activeSessions":\[[^]]*\]' | grep -o '"[^"]*"' | tr -d '"' | grep -v activeSessions)

if [ -z "$ACTIVE_SESSIONS" ]; then
    echo "❌ No active sessions found. Please:"
    echo "   1. Open http://localhost:5174"
    echo "   2. Create a new session"
    echo "   3. Run this demo again"
    exit 1
fi

echo "✅ Found active sessions:"
for session in $ACTIVE_SESSIONS; do
    echo "   - $session"
done

# Use the first active session for demo
DEMO_SESSION=$(echo $ACTIVE_SESSIONS | head -n1)
echo ""
echo "🎯 Using session: $DEMO_SESSION"
echo ""

# Create message directory if it doesn't exist
mkdir -p socket-server/messages

echo "📝 Creating demonstration message files..."
echo ""

# Test 1: Bot message
echo "🤖 Hello! I'm a bot message injected from a file. The current time is $(date)" > "socket-server/messages/${DEMO_SESSION}_bot.txt"
echo "✅ Created bot message file"
sleep 2

# Test 2: System alert
echo "⚠️  SYSTEM: This is an automated system alert. File-based injection is working!" > "socket-server/messages/${DEMO_SESSION}_system.txt"
echo "✅ Created system message file"
sleep 2

# Test 3: Admin announcement  
echo "👨‍💻 ADMIN: File-based messaging system is now active. Drop .txt files in the messages folder!" > "socket-server/messages/${DEMO_SESSION}_admin.txt"
echo "✅ Created admin message file"
sleep 2

# Test 4: Default message (no type specified)
echo "📢 This is a general announcement with no specific type (defaults to 'system')" > "socket-server/messages/${DEMO_SESSION}.txt"
echo "✅ Created default message file"

echo ""
echo "🎉 Demo complete! Check your collaborative session to see the injected messages."
echo ""
echo "📁 File naming patterns:"
echo "   - ${DEMO_SESSION}.txt (default: system type)"
echo "   - ${DEMO_SESSION}_bot.txt (bot message)"
echo "   - ${DEMO_SESSION}_admin.txt (admin message)"
echo "   - ${DEMO_SESSION}_system.txt (system message)"
echo ""
echo "🔄 Files are automatically processed and moved to socket-server/messages/processed/"