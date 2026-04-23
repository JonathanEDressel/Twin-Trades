import Foundation

struct PortfolioHolding: Codable, Identifiable {
    let id: Int
    let ticker: String
    let targetPct: Decimal

    enum CodingKeys: String, CodingKey {
        case id, ticker
        case targetPct = "target_pct"
    }
}

struct Portfolio: Codable, Identifiable, Hashable {
    let id: Int
    let name: String
    let description: String?
    let isActive: Bool
    let totalReturnPct: Decimal?
    let holdings: [PortfolioHolding]
    let createdAt: Date

    enum CodingKeys: String, CodingKey {
        case id, name, description, holdings
        case isActive = "is_active"
        case totalReturnPct = "total_return_pct"
        case createdAt = "created_at"
    }

    static func == (lhs: Portfolio, rhs: Portfolio) -> Bool { lhs.id == rhs.id }
    func hash(into hasher: inout Hasher) { hasher.combine(id) }
}

struct CreatePortfolioPayload: Encodable {
    let name: String
    let description: String?
}

struct UpdateHoldingsPayload: Encodable {
    let holdings: [[String: String]]   // [{"ticker": "AAPL", "target_pct": "45.00"}]
}

struct JoinPortfolioPayload: Encodable {
    let portfolioId: Int

    enum CodingKeys: String, CodingKey {
        case portfolioId = "portfolio_id"
    }
}
