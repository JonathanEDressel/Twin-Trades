import Foundation

// UserController builds URLRequest objects for the /users endpoints and delegates
// execution to APIClient. It insulates UserService from endpoint construction details.
// All methods assume the caller has already verified the user is authenticated.
struct UserController {

    // Build and fire a GET /users/me request, returning the decoded User on success.
    // Called by UserService.fetchMe(); not intended for direct ViewModel use.
    func fetchMe() async throws -> User {
        return try await APIClient.shared.request(.me)
    }

    // Build and fire a PUT /users/me request with the given payload, returning the updated User.
    // Only fields present in the payload are changed; unset optional fields leave server values intact.
    func updateMe(_ payload: UserUpdatePayload) async throws -> User {
        return try await APIClient.shared.request(.updateMe(payload))
    }

    // Build and fire a DELETE /users/me request to soft-delete the authenticated account.
    // Returns EmptyResponse on success; the caller must clear Keychain and navigate to login.
    func deleteMe() async throws {
        let _: EmptyResponse = try await APIClient.shared.request(.deleteMe)
    }
}
