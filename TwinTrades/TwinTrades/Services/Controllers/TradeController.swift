import Foundation

// TradeController constructs URLRequests for /trades endpoints.
// TradeService is the intended caller; not for direct ViewModel use.
struct TradeController {

    // GET /trades with pagination parameters — returns paginated trade history.
    func fetchTradeHistory(page: Int, pageSize: Int) async throws -> TradeHistoryResponse {
        return try await APIClient.shared.request(.tradeHistory(page: page, pageSize: pageSize))
    }
}
