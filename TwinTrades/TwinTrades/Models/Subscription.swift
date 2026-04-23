import Foundation

enum SubscriptionPlan: String, Codable {
    case monthly
    case annual
    case lifetime
}

enum SubscriptionStatus: String, Codable {
    case active
    case expired
    case cancelled
    case grace_period
}

struct Subscription: Codable, Identifiable {
    let id: Int
    let plan: SubscriptionPlan
    let status: SubscriptionStatus
    let appleTransactionId: String
    let amountPaid: Decimal
    let currency: String
    let expiresAt: Date?
    let createdAt: Date

    enum CodingKeys: String, CodingKey {
        case id, plan, status, currency
        case appleTransactionId = "apple_transaction_id"
        case amountPaid = "amount_paid"
        case expiresAt = "expires_at"
        case createdAt = "created_at"
    }
}

struct VerifyApplePayload: Encodable {
    let transactionId: String
    let productId: String

    enum CodingKeys: String, CodingKey {
        case transactionId = "transaction_id"
        case productId = "product_id"
    }
}
