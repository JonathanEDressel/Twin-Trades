import Foundation

struct BrokerageConnection: Codable, Identifiable {
    let id: Int
    let brokerageSlug: String
    let accountId: String?
    let isActive: Bool
    let tokenExpiresAt: Date?
    let createdAt: Date

    enum CodingKeys: String, CodingKey {
        case id
        case brokerageSlug = "brokerage_slug"
        case accountId = "account_id"
        case isActive = "is_active"
        case tokenExpiresAt = "token_expires_at"
        case createdAt = "created_at"
    }
}

struct OAuthInitiateResponse: Codable {
    let authURL: String
    let state: String

    enum CodingKeys: String, CodingKey {
        case authURL = "auth_url"
        case state
    }
}

struct OAuthCallbackPayload: Encodable {
    let code: String
    let state: String
    let brokerageSlug: String

    enum CodingKeys: String, CodingKey {
        case code, state
        case brokerageSlug = "brokerage_slug"
    }
}
