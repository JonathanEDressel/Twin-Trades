import SwiftUI

extension View {
    /// Apply standard 44×44 pt minimum touch target (Apple HIG).
    func minTouchTarget() -> some View {
        frame(minWidth: 44, minHeight: 44)
    }

    /// Hide the view without removing it from the layout (preserves space).
    func hidden(_ shouldHide: Bool) -> some View {
        opacity(shouldHide ? 0 : 1)
    }

    /// Apply card styling using DesignTokens.
    func styledCard() -> some View {
        cardStyle()
    }
}
