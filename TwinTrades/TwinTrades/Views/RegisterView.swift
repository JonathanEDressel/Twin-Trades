import SwiftUI

struct RegisterView: View {
    @State private var vm = RegisterViewModel()

    var body: some View {
        // Render a scrollable form with fields for email, username, displayName, password, and confirmPassword.
        // Inline validation errors appear beneath each field using validationError from the ViewModel.
        // Submit button calls vm.register(); on .error shows an alert; on success AppCoordinator routes to the main tab bar.
        EmptyView()
    }
}
