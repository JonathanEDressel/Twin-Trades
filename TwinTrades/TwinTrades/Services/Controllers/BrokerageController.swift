import Foundation

// BrokerageController constructs URLRequests for /brokerages endpoints.
// BrokerageService is the intended caller; OAuth callback URL parsing happens here.
struct BrokerageController {

    // GET /brokerages — list all brokerage connections for the current user.
    func fetchConnections() async throws -> [BrokerageConnection] {
        return try await APIClient.shared.request(.brokerageConnections)
    }

    // GET /brokerages/{slug}/oauth/initiate — begin the OAuth authorization flow.
    func initiateOAuth(slug: String) async throws -> OAuthInitiateResponse {
        return try await APIClient.shared.request(.initiateOAuth(slug: slug))
    }

    // POST /brokerages/oauth/callback — exchange code+state for brokerage tokens.
    func handleCallback(code: String, state: String, slug: String) async throws -> BrokerageConnection {
        let payload = OAuthCallbackPayload(code: code, state: state, brokerageSlug: slug)
        return try await APIClient.shared.request(.handleOAuthCallback(payload))
    }

    // DELETE /brokerages/{id} — disconnect and revoke a brokerage connection.
    func disconnect(id: Int) async throws {
        let _: EmptyResponse = try await APIClient.shared.request(.disconnectBrokerage(id: id))
    }
}
