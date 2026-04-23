import SwiftUI

// AuthStyle encapsulates ViewModifier structs for authentication screens (Login, Register, ForgotPassword).
// All auth views share a consistent surface background, centered card layout, and text field styling.
// No state or navigation logic lives here — Styles are purely visual.

struct AuthContainerStyle: ViewModifier {
    func body(content: Content) -> some View {
        // Apply DesignTokens.Colors.surface background across the full screen.
        // Center content vertically with DesignTokens.Spacing.lg padding on all sides.
        // Use safe area insets to avoid overlap with home indicator.
        content
            .padding(DesignTokens.Spacing.lg)
            .background(DesignTokens.Colors.surface.ignoresSafeArea())
    }
}

struct AuthTextFieldStyle: ViewModifier {
    func body(content: Content) -> some View {
        // Wrap the TextField in a rounded rectangle border using DesignTokens.Colors.border.
        // Apply DesignTokens.Spacing.sm vertical and DesignTokens.Spacing.md horizontal padding.
        // Use DesignTokens.Radius.md corner radius to match card styling.
        content
            .padding(.vertical, DesignTokens.Spacing.sm)
            .padding(.horizontal, DesignTokens.Spacing.md)
            .background(DesignTokens.Colors.card)
            .clipShape(RoundedRectangle(cornerRadius: DesignTokens.Radius.md))
            .overlay(
                RoundedRectangle(cornerRadius: DesignTokens.Radius.md)
                    .stroke(DesignTokens.Colors.border, lineWidth: 1)
            )
    }
}

extension View {
    func authContainer() -> some View { modifier(AuthContainerStyle()) }
    func authTextField() -> some View { modifier(AuthTextFieldStyle()) }
}
