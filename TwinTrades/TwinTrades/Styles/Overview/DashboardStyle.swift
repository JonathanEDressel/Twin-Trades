import SwiftUI

// DashboardStyle contains ViewModifier structs specific to the Dashboard screen.
// Portfolio card row styling and pending rebalance banner styling live here.
// No state, no navigation — purely visual.

struct RebalanceBannerStyle: ViewModifier {
    func body(content: Content) -> some View {
        // Apply a DesignTokens.Colors.warning tinted background with md corner radius.
        // Include sm inner padding and a 1 pt warning-colored border stroke.
        content
            .padding(DesignTokens.Spacing.sm)
            .background(DesignTokens.Colors.warning.opacity(0.15))
            .clipShape(RoundedRectangle(cornerRadius: DesignTokens.Radius.md))
            .overlay(
                RoundedRectangle(cornerRadius: DesignTokens.Radius.md)
                    .stroke(DesignTokens.Colors.warning, lineWidth: 1)
            )
    }
}

extension View {
    func rebalanceBanner() -> some View { modifier(RebalanceBannerStyle()) }
}
