import Foundation
import OSLog

private let logger = Logger(subsystem: "com.twintrades.app", category: "auth")

actor AuthService {
    static let shared = AuthService()
    private init() {}

    // Send login credentials to the API and persist the returned access and
    // refresh tokens to Keychain. Throws APIError if credentials are invalid
    // or the network request fails.
    func login(email: String, password: String) async throws -> AuthToken {
        let payload = LoginPayload(email: email, password: password)
        let tokens: AuthToken = try await APIClient.shared.request(.login(payload))
        try await KeychainService.shared.saveAccessToken(tokens.accessToken)
        try await KeychainService.shared.saveRefreshToken(tokens.refreshToken)
        logger.info("User logged in: \(email, privacy: .private)")
        return tokens
    }

    // Register a new account with the provided credentials and auto-login
    // by persisting the returned tokens to Keychain.
    // Returns the AuthToken so the caller can navigate to the main app.
    func register(email: String, username: String, password: String, displayName: String?) async throws -> AuthToken {
        let payload = RegisterPayload(email: email, username: username, password: password, displayName: displayName)
        let tokens: AuthToken = try await APIClient.shared.request(.register(payload))
        try await KeychainService.shared.saveAccessToken(tokens.accessToken)
        try await KeychainService.shared.saveRefreshToken(tokens.refreshToken)
        return tokens
    }

    // Exchange the stored refresh token for new access and refresh tokens.
    // Updates Keychain atomically — old tokens are replaced only on success.
    // Called automatically by APIClient on 401 responses.
    func refreshTokens() async throws {
        let refreshToken = try await KeychainService.shared.refreshToken()
        let payload = RefreshPayload(refreshToken: refreshToken)
        let tokens: AuthToken = try await APIClient.shared.request(.refresh(payload))
        try await KeychainService.shared.saveAccessToken(tokens.accessToken)
        try await KeychainService.shared.saveRefreshToken(tokens.refreshToken)
    }

    // Invalidate the session on the server and clear all tokens from Keychain.
    // After this completes the user must log in again.
    func logout() async {
        _ = try? await APIClient.shared.request(.logout) as EmptyResponse
        await KeychainService.shared.clear()
        logger.info("User logged out")
    }

    // Submit a password-change request using the scoped change_password_only token.
    // The caller must supply the current password for verification.
    // Throws if the current password is wrong or the new password fails validation.
    func changePassword(current: String, new: String) async throws {
        let payload = ChangePasswordPayload(currentPassword: current, newPassword: new)
        let _: EmptyResponse = try await APIClient.shared.request(.changePassword(payload))
    }

    // Send a password-reset email containing a one-time link to the given address.
    // Returns without error even when the email does not exist (anti-enumeration).
    func forgotPassword(email: String) async throws {
        let payload = ForgotPasswordPayload(email: email)
        let _: EmptyResponse = try await APIClient.shared.request(.forgotPassword(payload))
    }

    // Complete the password-reset flow using the token from the email link and the new password.
    // Throws if the token is expired, already used, or the new password fails server-side rules.
    func resetPassword(token: String, newPassword: String) async throws {
        let payload = ResetPasswordPayload(token: token, newPassword: newPassword)
        let _: EmptyResponse = try await APIClient.shared.request(.resetPassword(payload))
    }
}
