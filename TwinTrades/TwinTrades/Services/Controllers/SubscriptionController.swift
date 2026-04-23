import Foundation

// SubscriptionController constructs URLRequests for /subscriptions endpoints.
// SubscriptionService is the intended caller; handles StoreKit verification bridge.
struct SubscriptionController {

    // GET /subscriptions/status — current user's subscription state.
    func fetchStatus() async throws -> Subscription? {
        return try? await APIClient.shared.request(.subscriptionStatus)
    }

    // POST /subscriptions/verify/apple — validate a StoreKit 2 transaction with the backend.
    func verifyApple(transactionId: String, productId: String) async throws -> Subscription {
        let payload = VerifyApplePayload(transactionId: transactionId, productId: productId)
        return try await APIClient.shared.request(.verifyApple(payload))
    }
}
