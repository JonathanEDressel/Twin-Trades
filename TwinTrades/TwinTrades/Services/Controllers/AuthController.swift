import Foundation

// AuthController builds the URLRequest objects for auth endpoints and delegates
// execution to APIClient. It is the single entry point for raw auth networking,
// keeping AuthService free from URLRequest construction concerns.
struct AuthController {

    // Build and fire a login request, returning the decoded AuthToken on success.
    // Validates that email and password are non-empty before constructing the request.
    // Throws APIError if credentials are invalid or the network layer fails.
    func login(email: String, password: String) async throws -> AuthToken {
        let payload = LoginPayload(email: email, password: password)
        return try await APIClient.shared.request(.login(payload))
    }

    // Build and fire a registration request, returning the decoded AuthToken on success.
    // Server enforces uniqueness on email and username; throws .server(409) on conflict.
    // The caller should handle 422 (validation) and 409 (conflict) error cases in the UI.
    func register(email: String, username: String, password: String, displayName: String?) async throws -> AuthToken {
        let payload = RegisterPayload(email: email, username: username, password: password, displayName: displayName)
        return try await APIClient.shared.request(.register(payload))
    }

    // Build and fire a refresh token request, returning a new AuthToken pair.
    // Used by APIClient internally on 401 responses; should not be called by ViewModels directly.
    // Throws if the refresh token is expired, revoked, or absent from Keychain.
    func refresh(token: String) async throws -> AuthToken {
        let payload = RefreshPayload(refreshToken: token)
        return try await APIClient.shared.request(.refresh(payload))
    }
}
