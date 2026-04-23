import Foundation
import Observation

@Observable
@MainActor
final class RegisterViewModel {
    enum State { case idle, loading, error(String) }

    private(set) var state: State = .idle
    var email: String = ""
    var username: String = ""
    var displayName: String = ""
    var password: String = ""
    var confirmPassword: String = ""

    // Validate all registration fields and return the first error encountered.
    // Checks email format, username format (alphanumeric 3-30), password strength, and confirmation match.
    // The password strength rules are defined in Validators.password(_:).
    var validationError: String? {
        if email.isBlank || !email.isValidEmail { return "Enter a valid email address." }
        if !username.isValidUsername { return "Username must be 3-30 alphanumeric characters." }
        if displayName.isBlank { return "Display name is required." }
        let pwv = Validators.password(password)
        if !pwv.isValid { return pwv.errors.first }
        if password != confirmPassword { return "Passwords do not match." }
        return nil
    }

    // Submit registration payload to AuthService and navigate to main flow on success.
    // On a 409 conflict (duplicate email/username) the server error message is surfaced directly.
    // Sets state to .loading during the async request and .error on any failure.
    func register() async {
        guard validationError == nil else { state = .error(validationError!); return }
        state = .loading
        do {
            _ = try await AuthService.shared.register(
                email: email, username: username,
                password: password, displayName: displayName
            )
            NotificationCenter.default.post(name: .didAuthenticate, object: nil)
        } catch {
            state = .error(error.localizedDescription)
        }
    }

    func clearError() { if case .error = state { state = .idle } }
}
