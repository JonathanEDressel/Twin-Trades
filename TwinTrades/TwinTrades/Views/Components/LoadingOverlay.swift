import SwiftUI

struct LoadingOverlay: View {
    var message: String = "Loading…"

    var body: some View {
        // Cover the parent view with a semi-transparent black background and a centered VStack
        // containing a ProgressView spinner and the message label in DesignTokens.Typography.caption.
        // Applied via .overlay(isLoading ? LoadingOverlay() : nil) in parent views.
        EmptyView()
    }
}
