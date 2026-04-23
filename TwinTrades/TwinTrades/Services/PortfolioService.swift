import Foundation

actor PortfolioService {
    static let shared = PortfolioService()
    private init() {}

    // Fetch all portfolios the current user has joined, including holdings and return metrics.
    // Results are sorted by join date descending.
    // Throws APIError if the user has no active subscription that permits portfolio access.
    func fetchMyPortfolios() async throws -> [Portfolio] {
        return try await APIClient.shared.request(.myPortfolios)
    }

    // Fetch all publicly listed portfolios available on the marketplace.
    // Includes performance stats but excludes the exact holding weights for non-members.
    // Paginated; currently returns all results in a single request.
    func fetchMarketplace() async throws -> [Portfolio] {
        return try await APIClient.shared.request(.marketplace)
    }

    // Fetch full detail for a single portfolio by ID, including current holdings
    // and historical performance data for chart rendering.
    // Throws .notFound if the portfolio does not exist or has been deactivated.
    func fetchDetail(portfolioId: Int) async throws -> Portfolio {
        return try await APIClient.shared.request(.portfolioDetail(id: portfolioId))
    }

    // Join the specified portfolio; creates a user_portfolios row with is_syncing=true.
    // Requires an active subscription. Throws .forbidden if the user is already a member.
    // Throws .conflict if the portfolio is at capacity or inactive.
    func joinPortfolio(portfolioId: Int) async throws {
        let payload = JoinPortfolioPayload(portfolioId: portfolioId)
        let _: EmptyResponse = try await APIClient.shared.request(.joinPortfolio(payload: payload))
    }

    // Remove the current user from the specified portfolio and close their synced positions.
    // Sets is_syncing=false on the user_portfolios row.
    // The brokerage adapter executes market-sell orders for all held positions.
    func leavePortfolio(portfolioId: Int) async throws {
        let _: EmptyResponse = try await APIClient.shared.request(.leavePortfolio(portfolioId: portfolioId))
    }

    // Return all pending rebalance events for portfolios the current user has joined.
    // Events include the holding snapshot and the deep-link URL for push notification routing.
    // Events that have expired are excluded; the server handles expiry automatically.
    func fetchPendingRebalances() async throws -> [PendingRebalance] {
        return try await APIClient.shared.request(.pendingRebalances)
    }

    // Confirm a rebalance event by ID; triggers trade execution on the backend.
    // Only valid for users whose rebalance_confirmation is .push; auto-users never see this.
    // Throws .gone if the event has expired before confirmation.
    func confirmRebalance(eventId: Int) async throws -> ConfirmRebalanceResponse {
        return try await APIClient.shared.request(.confirmRebalance(eventId: eventId))
    }

    // Reject a pending rebalance event, cancelling the associated trades for this user.
    // The rebalance proceeds for other users who confirm; rejection only skips the caller.
    // Sets the user-specific pending row to status=rejected.
    func rejectRebalance(eventId: Int) async throws {
        let _: EmptyResponse = try await APIClient.shared.request(.rejectRebalance(eventId: eventId))
    }
}
