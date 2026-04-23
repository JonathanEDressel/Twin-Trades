import Foundation
import Observation

@Observable
@MainActor
final class TradeHistoryViewModel {
    enum State { case idle, loading, loaded, error(String) }

    private(set) var state: State = .idle
    private(set) var trades: [Trade] = []
    private(set) var currentPage = 1
    private(set) var hasMore = true
    private let pageSize = 20

    // Load the first page of trade history from TradeService, replacing any existing results.
    // Resets pagination state (currentPage, hasMore) before fetching.
    // Called on initial view appearance and on pull-to-refresh.
    func loadTrades() async {
        state = .loading
        currentPage = 1
        do {
            let response = try await TradeService.shared.fetchTradeHistory(page: 1, pageSize: pageSize)
            trades = response.trades
            hasMore = trades.count < response.total
            state = .loaded
        } catch {
            state = .error(error.localizedDescription)
        }
    }

    // Append the next page of trades to the existing list (infinite scroll).
    // Guards against concurrent fetches and no-op when hasMore is false.
    // Increments currentPage on success and sets hasMore based on total vs loaded count.
    func loadMore() async {
        guard hasMore, case .loaded = state else { return }
        currentPage += 1
        do {
            let response = try await TradeService.shared.fetchTradeHistory(page: currentPage, pageSize: pageSize)
            trades.append(contentsOf: response.trades)
            hasMore = trades.count < response.total
        } catch {
            currentPage -= 1
            state = .error(error.localizedDescription)
        }
    }

    func clearError() { if case .error = state { state = .idle } }
}
