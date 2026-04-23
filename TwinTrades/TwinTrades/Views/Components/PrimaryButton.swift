import SwiftUI

struct PrimaryButton: View {
    let title: String
    var isLoading: Bool = false
    var isDestructive: Bool = false
    let action: () -> Void

    var body: some View {
        // Render a full-width rounded button using DesignTokens.Colors.accent (or .danger for destructive).
        // When isLoading is true, replace the title label with a ProgressView spinner.
        // Minimum touch target: 44 pt height (Apple HIG). Disabled while isLoading is true.
        EmptyView()
    }
}
