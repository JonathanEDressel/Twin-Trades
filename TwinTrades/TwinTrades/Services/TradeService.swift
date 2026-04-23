import Foundation

actor TradeService {
    static let shared = TradeService()
    private init() {}

    // Fetch the authenticated user's trade history with server-side pagination.
    // Page is 1-indexed; pageSize controls the number of records per page.
    // Results are sorted by created_at descending (most recent first).
    func fetchTradeHistory(page: Int = 1, pageSize: Int = 20) async throws -> TradeHistoryResponse {
        return try await APIClient.shared.request(.tradeHistory(page: page, pageSize: pageSize))
    }
}
