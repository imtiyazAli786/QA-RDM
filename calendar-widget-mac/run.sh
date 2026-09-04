#!/bin/bash
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$DIR"

if [ ! -d "/Applications/CalendarWidget.app" ]; then
    ./build.sh
fi

echo "🚀 Launching CalendarWidget from /Applications..."
# Kill any existing instances to ensure only 1 instance runs
pkill -9 -f "CalendarWidget" 2>/dev/null || true
sleep 0.3

open /Applications/CalendarWidget.app 2>/dev/null || ("/Applications/CalendarWidget.app/Contents/MacOS/CalendarWidget" &)
echo "✨ Calendar Widget is now floating on your screen with 1 single Menu Bar icon!"
