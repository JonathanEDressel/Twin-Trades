import Foundation

actor BrokerageService {
    static let shared = BrokerageService()
    private init() {}

    func fetchConnections() async throws -> [BrokerageConnection] {
        return try await APIClient.shared.request(.brokerageConnections)
    }

    func initiateOAuth(slug: String) async throws -> OAuthInitiateResponse {
        return try await APIClient.shared.request(.initiateOAuth(slug: slug))
    }

    func handleCallback(code: String, state: String, slug: String) async throws -> BrokerageConnection {
        let payload = OAuthCallbackPayload(code: code, state: state, brokerageSlug: slug)
        return try await APIClient.shared.request(.handleOAuthCallback(payload))
    }

    func disconnect(connectionId: Int) async throws {
        let _: EmptyResponse = try await APIClient.shared.request(.disconnectBrokerage(id: connectionId))
    }
}
