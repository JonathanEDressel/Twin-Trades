import Foundation
import Observation

@Observable
@MainActor
final class ChangePasswordViewModel {
    enum State { case idle, loading, success, error(String) }

    private(set) var state: State = .idle
    var currentPassword: String = ""
    var newPassword: String = ""
    var confirmPassword: String = ""

    // Validate the new password strength and confirmation match before submission.
    // The current password is not validated locally — the server is the authority.
    // Returns the first validation error as a user-facing string, or nil if valid.
    var validationError: String? {
        if currentPassword.isBlank { return "Current password is required." }
        let pwv = Validators.password(newPassword)
        if !pwv.isValid { return pwv.errors.first }
        if newPassword != confirmPassword { return "New passwords do not match." }
        return nil
    }

    // Submit the password change to AuthService, using the scoped change_password_only token.
    // On success, transitions to .success so the View can navigate away or show a toast.
    // On failure (e.g. wrong current password), surfaces the server error message.
    func changePassword() async {
        guard validationError == nil else { state = .error(validationError!); return }
        state = .loading
        do {
            try await AuthService.shared.changePassword(current: currentPassword, new: newPassword)
            state = .success
        } catch {
            state = .error(error.localizedDescription)
        }
    }

    func clearError() { if case .error = state { state = .idle } }
}
