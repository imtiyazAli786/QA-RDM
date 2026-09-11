#!/bin/bash
set -e

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$DIR"

APP_NAME="CalendarWidget"
BUNDLE_DIR="$APP_NAME.app"
MACOS_DIR="$BUNDLE_DIR/Contents/MacOS"
RESOURCES_DIR="$BUNDLE_DIR/Contents/Resources"

echo "🔨 Building $APP_NAME for macOS..."

# 1. Clean previous build
rm -rf "$BUNDLE_DIR" "$APP_NAME"

# 2. Create App Bundle directories
mkdir -p "$MACOS_DIR"
mkdir -p "$RESOURCES_DIR/web"

# 3. Generate macOS AppIcon.icns if needed
echo "🎨 Generating custom macOS AppIcon..."
mkdir -p build_cache
swiftc -O -module-cache-path build_cache -framework Cocoa generate_icon.swift -o generate_icon
./generate_icon
rm -f generate_icon
iconutil -c icns AppIcon.iconset -o "$RESOURCES_DIR/AppIcon.icns"
rm -rf AppIcon.iconset

# 4. Copy web assets to App Bundle Resources
cp web/index.html "$RESOURCES_DIR/web/"
cp web/styles.css "$RESOURCES_DIR/web/"
cp web/widget.js "$RESOURCES_DIR/web/"

# 5. Generate Info.plist
cat << 'EOF' > "$BUNDLE_DIR/Contents/Info.plist"
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleExecutable</key>
    <string>CalendarWidget</string>
    <key>CFBundleIdentifier</key>
    <string>com.imtiyaz.calendarwidget</string>
    <key>CFBundleName</key>
    <string>CalendarWidget</string>
    <key>CFBundleDisplayName</key>
    <string>Calendar Widget</string>
    <key>CFBundleIconFile</key>
    <string>AppIcon</string>
    <key>CFBundlePackageType</key>
    <string>APPL</string>
    <key>CFBundleShortVersionString</key>
    <string>1.0.0</string>
    <key>CFBundleVersion</key>
    <string>1</string>
    <key>LSMinimumSystemVersion</key>
    <string>12.0</string>
    <key>LSUIElement</key>
    <true/>
    <key>NSHighResolutionCapable</key>
    <true/>
    <key>NSRequiresAquaSystemAppearance</key>
    <false/>
</dict>
</plist>
EOF

# 6. Compile Swift binary directly into App Bundle
echo "⚡ Compiling Swift executable..."
mkdir -p build_cache
swiftc -O -module-cache-path build_cache -framework Cocoa -framework WebKit -framework ServiceManagement main.swift -o "$MACOS_DIR/$APP_NAME"

# 7. Ad-hoc codesign to satisfy macOS gatekeeper locally
codesign -s - --force "$BUNDLE_DIR" 2>/dev/null || true

# 8. Install into /Applications/ or ~/Applications/ so it shows in Launchpad & Spotlight
echo "📦 Installing into Applications..."
pkill -f "CalendarWidget" 2>/dev/null || true

TARGET_DIR="/Applications"
if [ ! -w "/Applications" ]; then
    TARGET_DIR="$HOME/Applications"
    mkdir -p "$TARGET_DIR"
fi

rm -rf "$TARGET_DIR/$BUNDLE_DIR"
cp -R "$BUNDLE_DIR" "$TARGET_DIR/"

echo "✅ Build complete and installed to $TARGET_DIR/$BUNDLE_DIR"
echo "🚀 To run the app, run: ./run.sh or launch from Applications / Spotlight"
