# 🗓️ Mac Calendar & Clock Floating Desktop Widget

A native, ultra-lightweight, floating macOS desktop widget that stays visible everywhere on your Mac — over browser tabs, full-screen applications, code editors, and across all virtual desktops (Spaces).

---

## ✨ Features

- **Always-on-Top Floating Panel**: Stays on screen above Chrome, Safari, VS Code, Slack, and full-screen windows.
- **Cross-Spaces Support (`.canJoinAllSpaces`)**: Remains seamlessly visible when switching virtual desktop spaces or using full-screen apps.
- **Hero Date Focus**: Color-corrected visual hierarchy where the current **date** is the vibrant, bold focal point, with subtle day and month context.
- **Live Analog Clock**: Real-time ticking hour, minute, and second hands.
- **Full Interactive Calendar Popover**: Click the date badge to expand the full monthly calendar with month navigation and "Jump to Today".
- **Draggable with Memory**: Drag the clock face anywhere on your screen. The widget remembers your preferred screen coordinates across restarts.
- **macOS Menu Bar Companion (🗓️)**:
  - 👁️ **Toggle Widget** (`⌥ + C`)
  - 🔒 **Lock / Unlock Position**
  - 📍 **Reset Position to Top-Right**
  - 🎨 **Appearance**: System / Dark Theme / Light Theme
  - 🚀 **Launch at Login**: Automatic 1-click startup toggle
  - ⏏️ **Quit Calendar Widget**
- **Zero Overhead**: Built directly with native macOS Swift + Cocoa + WebKit. Consumes ~15MB RAM and 0% CPU when idle.

---

## 🚀 Quick Start

### 1. Build and Run
From the `calendar-widget-mac` folder, run:
```bash
chmod +x build.sh run.sh
./run.sh
```

### 2. Move to Applications (Optional)
To make it permanently accessible in Launchpad and Spotlight:
```bash
cp -r CalendarWidget.app /Applications/
```

### 3. Launch at Login (Automatic Start on Mac Startup)
You can enable automatic startup in two easy ways:
- **Option A (Instant)**: Click the **🗓️** icon in the macOS top Menu Bar → Click **"Launch at Login"** (a checkmark appears).
- **Option B (macOS System Settings)**: Open **System Settings** → **General** → **Login Items** → Click **+** under "Open at Login" and choose `/Applications/CalendarWidget.app`.

---

## ⌨️ Shortcuts & Controls

| Action | Shortcut / Control |
| :--- | :--- |
| **Toggle Show / Hide** | `⌥ + C` (Option + C) or Menu Bar 🗓️ icon |
| **Toggle Calendar Popover** | Click the Date badge |
| **Move Widget** | Drag the Clock face anywhere |
| **Lock Position** | Menu Bar 🗓️ → Lock Position |
| **Reset to Screen Corner** | Menu Bar 🗓️ → Reset Position to Top-Right |
| **Launch at Login** | Menu Bar 🗓️ → Launch at Login |
| **Quit App** | Menu Bar 🗓️ → Quit Calendar Widget |

---

## 📁 Project Structure

```text
calendar-widget-mac/
├── main.swift             # Native macOS Swift window & menu bar engine
├── build.sh               # 1-click build script producing CalendarWidget.app
├── run.sh                 # 1-click launch script
├── web/
│   ├── index.html         # HTML markup for clock SVG and calendar popover
│   ├── styles.css         # Refined CSS styles with date focal hierarchy
│   └── widget.js          # Ticking engine, calendar renderer & drag handlers
├── package.json           # Optional Electron configuration
├── electron-main.js       # Optional Electron entry point
└── README.md              # Documentation
```
