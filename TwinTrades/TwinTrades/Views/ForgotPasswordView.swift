import SwiftUI

struct ForgotPasswordView: View {
    @State private var vm = ForgotPasswordViewModel()

    var body: some View {
        // Show a single email TextField with a PrimaryButton that calls vm.submit().
        // When state transitions to .sent, replace the form with a confirmation message telling
        // the user to check their inbox — do not indicate whether the email exists (anti-enumeration).
        EmptyView()
    }
}
