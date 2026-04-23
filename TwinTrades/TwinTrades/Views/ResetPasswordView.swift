import SwiftUI

struct ResetPasswordView: View {
    let resetToken: String
    @State private var newPassword: String = ""
    @State private var confirmPassword: String = ""
    @State private var isLoading = false
    @State private var errorMessage: String?
    @State private var didSucceed = false

    var body: some View {
        // Render two SecureFields for newPassword and confirmPassword with a PrimaryButton.
        // Validate locally (Validators.password + match check) then call AuthService.resetPassword(token:newPassword:).
        // On success show a "Password reset — please log in" confirmation and navigate to LoginView.
        EmptyView()
    }
}
