import SwiftUI

// AdminStyle encapsulates ViewModifier structs shared across all Admin screens.
// Provides consistent list row styling, section header treatment, and badge colors.
// No state or navigation logic — purely visual styling.

struct AdminRowStyle: ViewModifier {
    func body(content: Content) -> some View {
        // Apply DesignTokens.Colors.card background with md corner radius and sm padding.
        // Include a 1 pt DesignTokens.Colors.border stroke.
        // Minimum 44 pt touch target height (Apple HIG).
        content
            .padding(DesignTokens.Spacing.sm)
            .frame(minHeight: 44)
            .background(DesignTokens.Colors.card)
            .clipShape(RoundedRectangle(cornerRadius: DesignTokens.Radius.md))
            .overlay(
                RoundedRectangle(cornerRadius: DesignTokens.Radius.md)
                    .stroke(DesignTokens.Colors.border, lineWidth: 1)
            )
    }
}

struct AdminSectionHeader: ViewModifier {
    func body(content: Content) -> some View {
        // Display the section label in DesignTokens.Typography.caption, all-caps, with textMuted color.
        // Add top padding to separate sections visually.
        content
            .font(DesignTokens.Typography.caption)
            .textCase(.uppercase)
            .foregroundStyle(DesignTokens.Colors.textMuted)
            .padding(.top, DesignTokens.Spacing.md)
    }
}

extension View {
    func adminRow() -> some View { modifier(AdminRowStyle()) }
    func adminSectionHeader() -> some View { modifier(AdminSectionHeader()) }
}
