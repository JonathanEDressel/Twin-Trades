import SwiftUI

// PortfolioDetailStyle contains ViewModifier structs for the portfolio detail screen.
// Holding row styling and allocation percentage badge styling live here.
// No state, no navigation — purely visual.

struct HoldingRowStyle: ViewModifier {
    func body(content: Content) -> some View {
        // Apply standard list row padding with a bottom divider using DesignTokens.Colors.border.
        // Ticker is displayed in DesignTokens.Typography.mono; allocation in .body.
        content
            .padding(.vertical, DesignTokens.Spacing.sm)
    }
}

extension View {
    func holdingRow() -> some View { modifier(HoldingRowStyle()) }
}
