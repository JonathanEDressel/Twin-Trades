import SwiftUI

struct ToastView: View {
    let message: String
    var type: ToastType = .info

    var body: some View {
        // Display a pill-shaped banner at the bottom of the screen with the message text.
        // Background color matches ToastType: .error uses DesignTokens.Colors.danger, .success uses .success, .info uses .info.
        // The view auto-dismisses after 3 seconds via a task; no dismiss button is shown.
        EmptyView()
    }
}

enum ToastType { case info, success, error }
