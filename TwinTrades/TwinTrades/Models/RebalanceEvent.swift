import Foundation

struct RebalanceHoldingSnapshot: Codable {
    let ticker: String
    let targetPct: Decimal

    enum CodingKeys: String, CodingKey {
        case ticker
        case targetPct = "target_pct"
    }
}

struct PendingRebalance: Codable, Identifiable {
    let id: Int
    let portfolioId: Int
    let deepLink: String?
    let expiresAt: Date
    let holdings: [RebalanceHoldingSnapshot]
    let createdAt: Date

    enum CodingKeys: String, CodingKey {
        case id, holdings
        case portfolioId = "portfolio_id"
        case deepLink = "deep_link"
        case expiresAt = "expires_at"
        case createdAt = "created_at"
    }
}

struct ConfirmRebalanceResponse: Codable {
    let eventId: Int
    let status: String
    let message: String

    enum CodingKeys: String, CodingKey {
        case status, message
        case eventId = "event_id"
    }
}
