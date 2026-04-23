import Foundation

actor SubscriptionService {
    static let shared = SubscriptionService()
    private init() {}

    // Fetch the current user's subscription status including plan type, renewal date,
    // and whether the account has been marked subscription_exempt by an admin.
    // Returns the most recent active subscription or nil if no subscription exists.
    func fetchStatus() async throws -> Subscription? {
        return try? await APIClient.shared.request(.subscriptionStatus)
    }

    // Send a completed StoreKit 2 transaction ID and product ID to the backend for validation.
    // The backend verifies with the App Store Server API and creates/updates the subscription row.
    // Throws if the transaction is fraudulent, already used, or the product ID is unrecognized.
    func verifyApple(transactionId: String, productId: String) async throws -> Subscription {
        let payload = VerifyApplePayload(transactionId: transactionId, productId: productId)
        return try await APIClient.shared.request(.verifyApple(payload))
    }
}
