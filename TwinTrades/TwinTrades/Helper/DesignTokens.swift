import SwiftUI

enum DesignTokens {

    enum Colors {
        static let primary      = Color("Primary")
        static let accent       = Color("Accent")
        static let accentHover  = Color("AccentHover")
        static let surface      = Color("Surface")
        static let card         = Color("Card")
        static let border       = Color("Border")
        static let textPrimary  = Color("TextPrimary")
        static let textMuted    = Color("TextMuted")
        static let success      = Color.green
        static let danger       = Color.red
        static let warning      = Color.yellow
        static let info         = Color.cyan
    }

    enum Spacing {
        static let xs: CGFloat = 4
        static let sm: CGFloat = 8
        static let md: CGFloat = 16
        static let lg: CGFloat = 24
        static let xl: CGFloat = 40
    }

    enum Radius {
        static let sm: CGFloat = 6
        static let md: CGFloat = 12
        static let lg: CGFloat = 20
    }

    enum Typography {
        static let title    = Font.system(.title,    design: .default, weight: .bold)
        static let headline = Font.system(.headline, design: .default, weight: .semibold)
        static let body     = Font.system(.body)
        static let caption  = Font.system(.caption)
        static let mono     = Font.system(.body,     design: .monospaced)
    }

    enum Shadow {
        static let card = SwiftUI.Shadow(color: .black.opacity(0.08), radius: 8, x: 0, y: 2)
    }
}

// Convenience: apply standard card styling in one modifier
struct CardModifier: ViewModifier {
    func body(content: Content) -> some View {
        content
            .background(DesignTokens.Colors.card)
            .clipShape(RoundedRectangle(cornerRadius: DesignTokens.Radius.md))
            .overlay(
                RoundedRectangle(cornerRadius: DesignTokens.Radius.md)
                    .stroke(DesignTokens.Colors.border, lineWidth: 1)
            )
            .shadow(color: .black.opacity(0.08), radius: 8, x: 0, y: 2)
    }
}

extension View {
    func cardStyle() -> some View {
        modifier(CardModifier())
    }
}
