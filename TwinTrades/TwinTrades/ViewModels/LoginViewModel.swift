import Foundation
import Observation

@Observable
@MainActor
final class LoginViewModel {
    enum State { case idle, loading, error(String) }

    private(set) var state: State = .idle
    var email: String = ""
    var password: String = ""

    // Validate email and password fields before submission.
    // Returns a user-facing error string if either field is empty or the email is malformed.
    // Called on form submit to provide inline validation feedback.
    var validationError: String? {
        if email.isBlank { return "Email is required." }
        if !email.isValidEmail { return "Enter a valid email address." }
        if password.isBlank { return "Password is required." }
        return nil
    }

    // Submit login credentials to AuthService and store tokens on success.
    // Sets state to .loading during the request and .error on failure.
    // On success, posts a notification so AppCoordinator can navigate to the main flow.
    func login() async {
        guard validationError == nil else { state = .error(validationError!); return }
        state = .loading
        do {
            _ = try await AuthService.shared.login(email: email, password: password)
            NotificationCenter.default.post(name: .didAuthenticate, object: nil)
        } catch {
            state = .error(error.localizedDescription)
        }
    }

    func clearError() { if case .error = state { state = .idle } }
}

extension Notification.Name {
    static let didAuthenticate = Notification.Name("com.twintrades.app.didAuthenticate")
    static let didLogout       = Notification.Name("com.twintrades.app.didLogout")
}
