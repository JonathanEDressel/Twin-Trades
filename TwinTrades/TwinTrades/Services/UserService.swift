import Foundation

actor UserService {
    static let shared = UserService()
    private init() {}

    func fetchMe() async throws -> User {
        return try await APIClient.shared.request(.me)
    }

    func updateMe(_ payload: UserUpdatePayload) async throws -> User {
        return try await APIClient.shared.request(.updateMe(payload))
    }

        func deleteMe() async throws {
        let _: EmptyResponse = try await APIClient.shared.request(.deleteMe)
        await KeychainService.shared.clear()
    }
}
