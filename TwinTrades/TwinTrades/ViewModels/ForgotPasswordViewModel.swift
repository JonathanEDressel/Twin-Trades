import Foundation
import Observation

@Observable
@MainActor
final class ForgotPasswordViewModel {
    enum State { case idle, loading, sent, error(String) }

    private(set) var state: State = .idle
    var email: String = ""

    // Validate that the email field is non-empty and properly formatted.
    // Returns a user-facing error string if invalid, nil if ready for submission.
    var validationError: String? {
        if email.isBlank || !email.isValidEmail { return "Enter a valid email address." }
        return nil
    }

    // Send a password-reset email via AuthService.forgotPassword(email:).
    // Transitions to .sent on any outcome — success or non-existent account — to prevent
    // email enumeration (the server always returns 200 regardless of account existence).
    func submit() async {
        guard validationError == nil else { state = .error(validationError!); return }
        state = .loading
        do {
            try await AuthService.shared.forgotPassword(email: email)
            state = .sent
        } catch {
            state = .error(error.localizedDescription)
        }
    }

    func clearError() { if case .error = state { state = .idle } }
}
