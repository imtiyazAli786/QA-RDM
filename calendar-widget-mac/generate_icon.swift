import Cocoa

func renderLightIcon(size: CGFloat) -> NSImage {
    let image = NSImage(size: NSSize(width: size, height: size))
    image.lockFocus()
    guard let ctx = NSGraphicsContext.current?.cgContext else {
        image.unlockFocus()
        return image
    }

    let rect = CGRect(x: 0, y: 0, width: size, height: size)
    let margin = size * 0.08
    let iconRect = rect.insetBy(dx: margin, dy: margin)
    let cornerRadius = size * 0.22

    // 1. Background Rounded Squircle with Subtle Drop Shadow
    let bgPath = CGPath(roundedRect: iconRect, cornerWidth: cornerRadius, cornerHeight: cornerRadius, transform: nil)
    
    ctx.saveGState()
    ctx.setShadow(offset: CGSize(width: 0, height: -size * 0.03), blur: size * 0.05, color: NSColor.black.withAlphaComponent(0.12).cgColor)
    
    // Light Premium Gradient (Pure Crisp White to Soft Pearl/Silver)
    let colors = [
        NSColor(calibratedWhite: 1.0, alpha: 1.0).cgColor,
        NSColor(calibratedRed: 0.93, green: 0.95, blue: 0.97, alpha: 1.0).cgColor
    ] as CFArray
    if let gradient = CGGradient(colorsSpace: CGColorSpaceCreateDeviceRGB(), colors: colors, locations: [0.0, 1.0]) {
        ctx.addPath(bgPath)
        ctx.clip()
        ctx.drawLinearGradient(gradient, start: CGPoint(x: iconRect.midX, y: iconRect.maxY), end: CGPoint(x: iconRect.midX, y: iconRect.minY), options: [])
    }
    ctx.restoreGState()

    // 2. Crisp Border Outline
    ctx.saveGState()
    ctx.addPath(bgPath)
    ctx.setStrokeColor(NSColor(calibratedRed: 0.82, green: 0.85, blue: 0.89, alpha: 0.9).cgColor)
    ctx.setLineWidth(size * 0.015)
    ctx.strokePath()
    ctx.restoreGState()

    // 3. Analog Clock Face Dial (Clean Frosted Glass / Soft Subtle Circle)
    let clockCenter = CGPoint(x: iconRect.midX, y: iconRect.midY + size * 0.045)
    let clockRadius = size * 0.285

    ctx.saveGState()
    // Dial background
    ctx.addArc(center: clockCenter, radius: clockRadius, startAngle: 0, endAngle: .pi * 2, clockwise: true)
    ctx.setFillColor(NSColor(calibratedRed: 0.97, green: 0.98, blue: 0.99, alpha: 1.0).cgColor)
    ctx.fillPath()

    // Dial border
    ctx.addArc(center: clockCenter, radius: clockRadius, startAngle: 0, endAngle: .pi * 2, clockwise: true)
    ctx.setStrokeColor(NSColor(calibratedRed: 0.84, green: 0.88, blue: 0.92, alpha: 1.0).cgColor)
    ctx.setLineWidth(size * 0.012)
    ctx.strokePath()

    // Hour ticks (12, 1, 2, ..., 11)
    for i in 0..<12 {
        let angle = CGFloat(i) * (.pi / 6)
        let isMajor = (i % 3 == 0)
        let tickInner = clockRadius - (isMajor ? size * 0.048 : size * 0.026)
        let p1 = CGPoint(x: clockCenter.x + tickInner * sin(angle), y: clockCenter.y + tickInner * cos(angle))
        let p2 = CGPoint(x: clockCenter.x + (clockRadius - size * 0.014) * sin(angle), y: clockCenter.y + (clockRadius - size * 0.014) * cos(angle))
        
        ctx.move(to: p1)
        ctx.addLine(to: p2)
        ctx.setStrokeColor(isMajor ? NSColor(calibratedRed: 0.15, green: 0.20, blue: 0.28, alpha: 0.85).cgColor : NSColor(calibratedRed: 0.55, green: 0.60, blue: 0.68, alpha: 0.65).cgColor)
        ctx.setLineWidth(isMajor ? size * 0.014 : size * 0.008)
        ctx.strokePath()
    }

    // Hour Hand (Pointing at 10:10)
    let hourAngle = CGFloat(10.15 / 12.0) * .pi * 2
    let hourLen = clockRadius * 0.52
    ctx.move(to: clockCenter)
    ctx.addLine(to: CGPoint(x: clockCenter.x + hourLen * sin(hourAngle), y: clockCenter.y + hourLen * cos(hourAngle)))
    ctx.setStrokeColor(NSColor(calibratedRed: 0.12, green: 0.16, blue: 0.22, alpha: 1.0).cgColor)
    ctx.setLineWidth(size * 0.022)
    ctx.setLineCap(.round)
    ctx.strokePath()

    // Minute Hand (Pointing at 2:10)
    let minAngle = CGFloat(1.85 / 12.0) * .pi * 2
    let minLen = clockRadius * 0.74
    ctx.move(to: clockCenter)
    ctx.addLine(to: CGPoint(x: clockCenter.x + minLen * sin(minAngle), y: clockCenter.y + minLen * cos(minAngle)))
    ctx.setStrokeColor(NSColor(calibratedRed: 0.18, green: 0.24, blue: 0.32, alpha: 1.0).cgColor)
    ctx.setLineWidth(size * 0.016)
    ctx.setLineCap(.round)
    ctx.strokePath()

    // Second Hand (Vibrant Amber / Honey)
    let secAngle = CGFloat(6.0 / 12.0) * .pi * 2
    let secLen = clockRadius * 0.82
    ctx.move(to: clockCenter)
    ctx.addLine(to: CGPoint(x: clockCenter.x + secLen * sin(secAngle), y: clockCenter.y + secLen * cos(secAngle)))
    ctx.setStrokeColor(NSColor(calibratedRed: 0.88, green: 0.52, blue: 0.16, alpha: 1.0).cgColor)
    ctx.setLineWidth(size * 0.009)
    ctx.strokePath()

    // Center Dot Pin
    ctx.addArc(center: clockCenter, radius: size * 0.016, startAngle: 0, endAngle: .pi * 2, clockwise: true)
    ctx.setFillColor(NSColor(calibratedRed: 0.12, green: 0.16, blue: 0.22, alpha: 1.0).cgColor)
    ctx.fillPath()
    ctx.restoreGState()

    // 4. Hero Date Badge Pill at Bottom (Teal Accent)
    let badgeW = size * 0.60
    let badgeH = size * 0.165
    let badgeRect = CGRect(x: iconRect.midX - badgeW / 2, y: iconRect.minY + size * 0.055, width: badgeW, height: badgeH)
    let badgeRadius = badgeH * 0.44
    let badgePath = CGPath(roundedRect: badgeRect, cornerWidth: badgeRadius, cornerHeight: badgeRadius, transform: nil)

    ctx.saveGState()
    // Soft shadow under badge
    ctx.setShadow(offset: CGSize(width: 0, height: -size * 0.012), blur: size * 0.025, color: NSColor(calibratedRed: 0.10, green: 0.45, blue: 0.35, alpha: 0.25).cgColor)
    
    // Teal Gradient Fill
    let badgeColors = [
        NSColor(calibratedRed: 0.20, green: 0.62, blue: 0.48, alpha: 1.0).cgColor,
        NSColor(calibratedRed: 0.14, green: 0.48, blue: 0.37, alpha: 1.0).cgColor
    ] as CFArray
    if let badgeGrad = CGGradient(colorsSpace: CGColorSpaceCreateDeviceRGB(), colors: badgeColors, locations: [0.0, 1.0]) {
        ctx.addPath(badgePath)
        ctx.clip()
        ctx.drawLinearGradient(badgeGrad, start: CGPoint(x: badgeRect.midX, y: badgeRect.maxY), end: CGPoint(x: badgeRect.midX, y: badgeRect.minY), options: [])
    }
    ctx.restoreGState()

    // Badge border
    ctx.saveGState()
    ctx.addPath(badgePath)
    ctx.setStrokeColor(NSColor(calibratedRed: 0.35, green: 0.78, blue: 0.62, alpha: 0.8).cgColor)
    ctx.setLineWidth(size * 0.009)
    ctx.strokePath()
    ctx.restoreGState()

    // Draw Date Text: "31 AUG" with Crisp White Typography
    let fontName = "HelveticaNeue-Bold"
    let fontSize = size * 0.084
    let font = NSFont(name: fontName, size: fontSize) ?? NSFont.boldSystemFont(ofSize: fontSize)
    let attrs: [NSAttributedString.Key: Any] = [
        .font: font,
        .foregroundColor: NSColor.white
    ]
    let str = NSAttributedString(string: "31 AUG", attributes: attrs)
    let strSize = str.size()
    let strPt = CGPoint(x: badgeRect.midX - strSize.width / 2, y: badgeRect.midY - strSize.height / 2 + size * 0.004)
    str.draw(at: strPt)

    image.unlockFocus()
    return image
}

func savePNG(image: NSImage, path: String) {
    guard let tiff = image.tiffRepresentation,
          let rep = NSBitmapImageRep(data: tiff),
          let png = rep.representation(using: .png, properties: [:]) else { return }
    try? png.write(to: URL(fileURLWithPath: path))
}

let iconsetDir = "AppIcon.iconset"
try? FileManager.default.createDirectory(atPath: iconsetDir, withIntermediateDirectories: true, attributes: nil)

let sizes: [(String, CGFloat)] = [
    ("icon_16x16.png", 16),
    ("icon_16x16@2x.png", 32),
    ("icon_32x32.png", 32),
    ("icon_32x32@2x.png", 64),
    ("icon_128x128.png", 128),
    ("icon_128x128@2x.png", 256),
    ("icon_256x256.png", 256),
    ("icon_256x256@2x.png", 512),
    ("icon_512x512.png", 512),
    ("icon_512x512@2x.png", 1024)
]

for (name, s) in sizes {
    let img = renderLightIcon(size: s)
    savePNG(image: img, path: "\(iconsetDir)/\(name)")
}

print("Light AppIcon generated successfully!")
