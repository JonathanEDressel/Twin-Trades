import SwiftUI

// MarketplaceStyle contains ViewModifier structs specific to the Marketplace screen.
// Joined-state badge and search bar container styling live here.
// No state, no navigation — purely visual.

struct MarketplaceJoinedBadge: ViewModifier {
    func body(content: Content) -> some View {
        // Show a small pill badge with DesignTokens.Colors.success background and white text.
        // Used to indicate portfolios the user has already joined.
        content
            .padding(.horizontal, DesignTokens.Spacing.sm)
            .padding(.vertical, DesignTokens.Spacing.xs)
            .background(DesignTokens.Colors.success)
            .foregroundStyle(.white)
            .clipShape(Capsule())
            .font(DesignTokens.Typography.caption)
    }
}

extension View {
    func marketplaceJoinedBadge() -> some View { modifier(MarketplaceJoinedBadge()) }
}
