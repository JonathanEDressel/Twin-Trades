import Foundation

enum TradeAction: String, Codable {
    case buy
    case sell
}

enum TradeStatus: String, Codable {
    case pending
    case filled
    case cancelled
    case failed
}

struct Trade: Codable, Identifiable {
    let id: Int
    let ticker: String
    let action: TradeAction
    let quantity: Decimal
    let price: Decimal?
    let status: TradeStatus
    let brokerOrderId: String?
    let executedAt: Date?
    let createdAt: Date

    enum CodingKeys: String, CodingKey {
        case id, ticker, action, quantity, price, status
        case brokerOrderId = "broker_order_id"
        case executedAt = "executed_at"
        case createdAt = "created_at"
    }
}

struct TradeHistoryResponse: Codable {
    let trades: [Trade]
    let total: Int
    let page: Int
    let pageSize: Int

    enum CodingKeys: String, CodingKey {
        case trades, total, page
        case pageSize = "page_size"
    }
}
