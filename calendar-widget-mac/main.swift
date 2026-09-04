import Cocoa
import WebKit

class FloatingPanel: NSPanel {
    override var canBecomeKey: Bool {
        return false
    }
    override var canBecomeMain: Bool {
        return false
    }
}

class AppDelegate: NSObject, NSApplicationDelegate, WKScriptMessageHandler, WKNavigationDelegate {
    var panel: FloatingPanel!
    var webView: WKWebView!
    var statusItem: NSStatusItem!
    var isLocked: Bool = false
    var currentTheme: String = "auto"
    var isExpanded: Bool = false

    let compactW: CGFloat = 130
    let compactH: CGFloat = 150
    let expandedW: CGFloat = 220
    let expandedH: CGFloat = 415

    func applicationDidFinishLaunching(_ notification: Notification) {
        NSApp.setActivationPolicy(.accessory) // Runs as a background accessory widget with menu bar item

        setupFloatingPanel()
        setupStatusItem()
        setupGlobalShortcut()
    }

    func setupFloatingPanel() {
        let width: CGFloat = compactW
        let height: CGFloat = compactH

        // Calculate initial top-right position on primary screen
        let screenFrame = NSScreen.main?.visibleFrame ?? NSRect(x: 0, y: 0, width: 1440, height: 900)
        let defaultX = screenFrame.maxX - width - 24
        let defaultY = screenFrame.maxY - height - 16

        let savedX = UserDefaults.standard.object(forKey: "widget_x") as? CGFloat ?? defaultX
        let savedY = UserDefaults.standard.object(forKey: "widget_y") as? CGFloat ?? defaultY

        // Ensure position stays within visible bounds
        let initialX = max(screenFrame.minX, min(savedX, screenFrame.maxX - width))
        let initialY = max(screenFrame.minY, min(savedY, screenFrame.maxY - height))

        let contentRect = NSRect(x: initialX, y: initialY, width: width, height: height)

        panel = FloatingPanel(
            contentRect: contentRect,
            styleMask: [.borderless, .nonactivatingPanel, .utilityWindow],
            backing: .buffered,
            defer: false
        )

        // Always on top, across all spaces and over fullscreen windows
        panel.level = .floating
        panel.collectionBehavior = [.canJoinAllSpaces, .fullScreenAuxiliary, .stationary, .ignoresCycle]
        panel.isOpaque = false
        panel.backgroundColor = .clear
        panel.hasShadow = false
        panel.isMovableByWindowBackground = false
        panel.hidesOnDeactivate = false

        // Configure WKWebView with transparency and message handlers
        let config = WKWebViewConfiguration()
        let userContent = WKUserContentController()
        userContent.add(self, name: "dragStart")
        userContent.add(self, name: "dragMove")
        userContent.add(self, name: "dragEnd")
        userContent.add(self, name: "popoverState")
        config.userContentController = userContent

        webView = WKWebView(frame: NSRect(x: 0, y: 0, width: width, height: height), configuration: config)
        webView.navigationDelegate = self
        webView.setValue(false, forKey: "drawsBackground")
        webView.underPageBackgroundColor = .clear
        webView.autoresizingMask = [.width, .height]

        panel.contentView = webView

        loadWebContent()
        panel.orderFrontRegardless()
    }

    func loadWebContent() {
        // Look in App Bundle Resources first
        if let resourceURL = Bundle.main.url(forResource: "index", withExtension: "html", subdirectory: "web") {
            let webDir = resourceURL.deletingLastPathComponent()
            webView.loadFileURL(resourceURL, allowingReadAccessTo: webDir)
            return
        }

        // Fallback to relative directory for development
        let devPath = URL(fileURLWithPath: FileManager.default.currentDirectoryPath).appendingPathComponent("web/index.html")
        if FileManager.default.fileExists(atPath: devPath.path) {
            let webDir = devPath.deletingLastPathComponent()
            webView.loadFileURL(devPath, allowingReadAccessTo: webDir)
            return
        }

        print("Error: Could not locate web/index.html")
    }

    func setupStatusItem() {
        statusItem = NSStatusBar.system.statusItem(withLength: NSStatusItem.variableLength)
        if let button = statusItem.button {
            if let img = NSImage(systemSymbolName: "calendar", accessibilityDescription: "Calendar Widget") {
                img.isTemplate = true
                button.image = img
            } else {
                button.title = "🗓️"
            }
            button.toolTip = "Calendar & Clock Widget (Click for options)"
        }

        let menu = NSMenu()

        let toggleItem = NSMenuItem(title: "Toggle Widget", action: #selector(toggleVisibility), keyEquivalent: "c")
        toggleItem.keyEquivalentModifierMask = [.option]
        menu.addItem(toggleItem)

        let lockItem = NSMenuItem(title: "Lock Position", action: #selector(toggleLock), keyEquivalent: "l")
        menu.addItem(lockItem)

        let resetItem = NSMenuItem(title: "Reset Position to Top-Right", action: #selector(resetPosition), keyEquivalent: "r")
        menu.addItem(resetItem)

        menu.addItem(NSMenuItem.separator())

        // Modes Submenu
        let modeMenu = NSMenu()
        modeMenu.addItem(NSMenuItem(title: "🕒 Clock & Calendar", action: #selector(switchModeClock), keyEquivalent: "1"))
        modeMenu.addItem(NSMenuItem(title: "🍅 Pomodoro Focus Timer", action: #selector(switchModePomo), keyEquivalent: "2"))
        modeMenu.addItem(NSMenuItem(title: "⏱️ Stopwatch", action: #selector(switchModeSw), keyEquivalent: "3"))
        modeMenu.addItem(NSMenuItem.separator())
        modeMenu.addItem(NSMenuItem(title: "⚡ Start 25m Focus Session", action: #selector(quickStartPomodoro), keyEquivalent: "p"))

        let modeItem = NSMenuItem(title: "Mode", action: nil, keyEquivalent: "")
        modeItem.submenu = modeMenu
        menu.addItem(modeItem)

        // Hourly Chime Menu Item
        let chimeItem = NSMenuItem(title: "🔔 Hourly Chime", action: #selector(toggleHourlyChimeAction), keyEquivalent: "h")
        chimeItem.state = .on
        menu.addItem(chimeItem)

        menu.addItem(NSMenuItem.separator())

        // Appearance Theme Submenu
        let themeMenu = NSMenu()
        let autoTheme = NSMenuItem(title: "Auto (System)", action: #selector(setThemeAuto), keyEquivalent: "")
        autoTheme.state = .on
        let lightTheme = NSMenuItem(title: "Light Theme", action: #selector(setThemeLight), keyEquivalent: "")
        let darkTheme = NSMenuItem(title: "Dark Theme", action: #selector(setThemeDark), keyEquivalent: "")
        themeMenu.addItem(autoTheme)
        themeMenu.addItem(lightTheme)
        themeMenu.addItem(darkTheme)

        let themeItem = NSMenuItem(title: "Appearance", action: nil, keyEquivalent: "")
        themeItem.submenu = themeMenu
        menu.addItem(themeItem)

        menu.addItem(NSMenuItem.separator())

        menu.addItem(NSMenuItem(title: "Quit Calendar Widget", action: #selector(quitApp), keyEquivalent: "q"))

        statusItem.menu = menu
    }

    func setupGlobalShortcut() {
        // Listen for Option+C locally
        NSEvent.addLocalMonitorForEvents(matching: .keyDown) { [weak self] event in
            if event.modifierFlags.contains(.option) && event.charactersIgnoringModifiers?.lowercased() == "c" {
                self?.toggleVisibility()
                return nil
            }
            return event
        }
    }

    // ---- ACTIONS ----
    @objc func switchModeClock() {
        webView.evaluateJavaScript("window.setAppMode('clock');", completionHandler: nil)
        if !panel.isVisible { panel.orderFrontRegardless() }
    }

    @objc func switchModePomo() {
        webView.evaluateJavaScript("window.setAppMode('pomodoro');", completionHandler: nil)
        if !panel.isVisible { panel.orderFrontRegardless() }
    }

    @objc func switchModeSw() {
        webView.evaluateJavaScript("window.setAppMode('stopwatch');", completionHandler: nil)
        if !panel.isVisible { panel.orderFrontRegardless() }
    }

    @objc func quickStartPomodoro() {
        webView.evaluateJavaScript("window.startPomodoro(25);", completionHandler: nil)
        if !panel.isVisible { panel.orderFrontRegardless() }
    }

    @objc func toggleHourlyChimeAction(_ sender: NSMenuItem) {
        sender.state = sender.state == .on ? .off : .on
        webView.evaluateJavaScript("window.toggleHourlyChime();", completionHandler: nil)
    }
    @objc func toggleVisibility() {
        if panel.isVisible {
            panel.orderOut(nil)
        } else {
            panel.orderFrontRegardless()
        }
    }

    @objc func toggleLock(_ sender: NSMenuItem) {
        isLocked.toggle()
        sender.state = isLocked ? .on : .off
    }

    @objc func resetPosition() {
        guard let screen = NSScreen.main else { return }
        let currentW = panel.frame.width
        let currentH = panel.frame.height
        let targetX = screen.visibleFrame.maxX - currentW - 24
        let targetY = screen.visibleFrame.maxY - currentH - 16

        panel.setFrameOrigin(NSPoint(x: targetX, y: targetY))
        savePosition()
    }

    func setPopoverExpanded(_ expanded: Bool) {
        if isExpanded == expanded { return }
        isExpanded = expanded

        let currentFrame = panel.frame
        let currentTop = currentFrame.origin.y + currentFrame.size.height
        let currentCenterX = currentFrame.origin.x + (currentFrame.size.width / 2.0)

        let newW: CGFloat = expanded ? expandedW : compactW
        let newH: CGFloat = expanded ? expandedH : compactH

        let newX = currentCenterX - (newW / 2.0)
        let newY = currentTop - newH

        let newFrame = NSRect(x: newX, y: newY, width: newW, height: newH)
        panel.setFrame(newFrame, display: true, animate: false)
    }

    @objc func setThemeAuto(_ sender: NSMenuItem) {
        setTheme("auto", menuItem: sender)
    }

    @objc func setThemeLight(_ sender: NSMenuItem) {
        setTheme("light", menuItem: sender)
    }

    @objc func setThemeDark(_ sender: NSMenuItem) {
        setTheme("dark", menuItem: sender)
    }

    func setTheme(_ theme: String, menuItem: NSMenuItem) {
        currentTheme = theme
        webView.evaluateJavaScript("window.setTheme('\(theme)');", completionHandler: nil)
        if let parentMenu = menuItem.menu {
            for item in parentMenu.items {
                item.state = (item == menuItem) ? .on : .off
            }
        }
    }

    @objc func quitApp() {
        NSApp.terminate(nil)
    }

    func savePosition() {
        UserDefaults.standard.set(panel.frame.origin.x, forKey: "widget_x")
        UserDefaults.standard.set(panel.frame.origin.y, forKey: "widget_y")
    }

    // ---- JS MESSAGE HANDLER ----
    func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
        if isLocked && message.name.starts(with: "drag") { return }

        switch message.name {
        case "dragMove":
            if let body = message.body as? [String: Any],
               let dx = body["dx"] as? Double,
               let dy = body["dy"] as? Double {
                var origin = panel.frame.origin
                origin.x += CGFloat(dx)
                origin.y -= CGFloat(dy) // macOS Y coordinate is flipped from WebKit screenY
                panel.setFrameOrigin(origin)
            }
        case "dragEnd":
            savePosition()
        case "popoverState":
            if let body = message.body as? [String: Any],
               let isOpen = body["open"] as? Bool {
                DispatchQueue.main.async { [weak self] in
                    self?.setPopoverExpanded(isOpen)
                }
            }
        default:
            break
        }
    }
}

// ---- MAIN ----
// Ensure single running instance
let currentPID = ProcessInfo.processInfo.processIdentifier
let runningApps = NSRunningApplication.runningApplications(withBundleIdentifier: "com.imtiyaz.calendarwidget")
for a in runningApps where a.processIdentifier != currentPID {
    a.terminate()
}

let app = NSApplication.shared
let delegate = AppDelegate()
app.delegate = delegate
app.run()
