import SwiftUI

struct LoginView: View {
    @State private var vm = LoginViewModel()

    var body: some View {
        // Display a centered form with email and password SecureField inputs styled via AuthStyle.
        // The primary CTA calls vm.login() and shows a loading overlay while state == .loading.
        // An .error(String) state surfaces an inline alert banner; a "Forgot Password?" link navigates to ForgotPasswordView.
        EmptyView()
    }
}
