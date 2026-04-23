import StoreKit
import OSLog

private let logger = Logger(subsystem: "com.twintrades.app", category: "storekit")

// StoreKit product identifiers matching App Store Connect configuration.
enum StoreKitProductID: String, CaseIterable {
    case monthly  = "com.twintrades.app.monthly"
    case annual   = "com.twintrades.app.annual"
    case lifetime = "com.twintrades.app.lifetime"
}

@MainActor
final class StoreKitService: ObservableObject {
    static let shared = StoreKitService()
    private init() {}

    @Published private(set) var products: [Product] = []
    @Published private(set) var purchasedTransactionIds: Set<UInt64> = []

    // Fetch all StoreKit 2 products from the App Store using the defined product IDs.
    // Populates the products array for display in the subscription UI.
    // Logs and swallows StoreKit errors so the UI degrades gracefully.
    func fetchProducts() async {
        do {
            let ids = StoreKitProductID.allCases.map(\.rawValue)
            products = try await Product.products(for: ids)
            logger.info("Fetched \(self.products.count) StoreKit products")
        } catch {
            logger.error("StoreKit fetchProducts failed: \(error.localizedDescription, privacy: .public)")
        }
    }

    // Initiate a purchase for the given Product using StoreKit 2 and verify the transaction.
    // On success, sends the transaction ID to the backend for server-side receipt validation.
    // Throws if the user cancels, the purchase fails, or backend verification rejects it.
    func purchase(_ product: Product) async throws {
        let result = try await product.purchase()
        switch result {
        case .success(let verification):
            let transaction = try checkVerified(verification)
            try await SubscriptionService.shared.verifyApple(
                transactionId: String(transaction.id),
                productId: transaction.productID
            )
            await transaction.finish()
            logger.info("Purchase completed: \(transaction.productID, privacy: .public)")
        case .userCancelled:
            logger.info("Purchase cancelled by user")
        case .pending:
            logger.info("Purchase pending external approval")
        @unknown default:
            break
        }
    }

    // Restore previous purchases by syncing all verified transactions from the App Store.
    // For each unfinished transaction, sends the transaction ID to the backend for validation.
    // Throws AppStore.sync() errors; the caller surfaces them in the UI.
    func restorePurchases() async throws {
        try await AppStore.sync()
        for await result in Transaction.currentEntitlements {
            if case .verified(let transaction) = result {
                _ = try? await SubscriptionService.shared.verifyApple(
                    transactionId: String(transaction.id),
                    productId: transaction.productID
                )
            }
        }
    }

    // Verify that a StoreKit VerificationResult is cryptographically valid.
    // Throws StoreKitError.failedVerification for unverified transactions.
    // This is the required check before fulfilling any in-app purchase.
    private func checkVerified<T>(_ result: VerificationResult<T>) throws -> T {
        switch result {
        case .unverified: throw StoreKitServiceError.failedVerification
        case .verified(let value): return value
        }
    }
}

enum StoreKitServiceError: LocalizedError {
    case failedVerification
    var errorDescription: String? { "Transaction could not be verified." }
}
