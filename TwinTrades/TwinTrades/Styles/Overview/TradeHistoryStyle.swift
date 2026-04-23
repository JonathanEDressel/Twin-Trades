import SwiftUI

// TradeHistoryStyle contains ViewModifier structs for the trade history screen.
// Trade status badge styling (filled/pending/cancelled/failed) lives here.
// No state, no navigation — purely visual.

struct TradeStatusBadge: ViewModifier {
    let status: TradeStatus

    func body(content: Content) -> some View {
        // Color-code the status text badge using DesignTokens colors:
        // .filled → .success; .pending → .warning; .cancelled → .textMuted; .failed → .danger.
        content
            .padding(.horizontal, DesignTokens.Spacing.sm)
            .padding(.vertical, DesignTokens.Spacing.xs)
            .background(badgeColor.opacity(0.15))
            .foregroundStyle(badgeColor)
            .clipShape(Capsule())
            .font(DesignTokens.Typography.caption)
    }

    private var badgeColor: Color {
        switch status {
        case .filled:    return DesignTokens.Colors.success
        case .pending:   return DesignTokens.Colors.warning
        case .cancelled: return DesignTokens.Colors.textMuted
        case .failed:    return DesignTokens.Colors.danger
        }
    }
}

extension View {
    func tradeStatusBadge(_ status: TradeStatus) -> some View { modifier(TradeStatusBadge(status: status)) }
}
