#!/bin/bash
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$DIR"

TARGET_APP="/Applications/CalendarWidget.app"
if [ ! -d "$TARGET_APP" ] || [ -d "$HOME/Applications/CalendarWidget.app" ]; then
    if [ -d "$HOME/Applications/CalendarWidget.app" ]; then
        TARGET_APP="$HOME/Applications/CalendarWidget.app"
    elif [ -d "$DIR/CalendarWidget.app" ]; then
        TARGET_APP="$DIR/CalendarWidget.app"
    fi
fi

if [ ! -d "$TARGET_APP" ]; then
    ./build.sh
    if [ -d "$HOME/Applications/CalendarWidget.app" ]; then
        TARGET_APP="$HOME/Applications/CalendarWidget.app"
    elif [ -d "$DIR/CalendarWidget.app" ]; then
        TARGET_APP="$DIR/CalendarWidget.app"
    fi
fi

echo "🚀 Launching CalendarWidget from $TARGET_APP..."
pkill -9 -f "CalendarWidget" 2>/dev/null || true
sleep 0.3

open "$TARGET_APP" 2>/dev/null || ("$TARGET_APP/Contents/MacOS/CalendarWidget" &)
echo "✨ Calendar Widget is now floating on your screen with 1 single Menu Bar icon!"
