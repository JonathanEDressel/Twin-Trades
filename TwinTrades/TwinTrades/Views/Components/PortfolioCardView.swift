import SwiftUI

struct PortfolioCardView: View {
    let portfolio: Portfolio
    var onTap: (() -> Void)? = nil

    var body: some View {
        // Display portfolio name, total return badge (colored green/red via DesignTokens.Colors.success/danger),
        // and the number of holdings as a secondary label.
        // The entire card is tappable; it calls onTap() for navigation — no navigation logic inside the component.
        EmptyView()
    }
}
