import Foundation

// PortfolioController constructs URLRequests for all /portfolios endpoints and delegates
// to APIClient. PortfolioService is the intended caller; ViewModels must not use this directly.
// Rebalance confirmation/rejection endpoints live here alongside marketplace and member endpoints.
struct PortfolioController {

    // Fetch portfolios the current user is a member of.
    func fetchMyPortfolios() async throws -> [Portfolio] {
        return try await APIClient.shared.request(.myPortfolios)
    }

    // Fetch all marketplace-listed portfolios visible to subscribing users.
    func fetchMarketplace() async throws -> [Portfolio] {
        return try await APIClient.shared.request(.marketplace)
    }

    // Fetch full detail for a single portfolio including holdings and performance history.
    func fetchDetail(id: Int) async throws -> Portfolio {
        return try await APIClient.shared.request(.portfolioDetail(id: id))
    }

    // POST to join a portfolio; server validates subscription and existing membership.
    func join(portfolioId: Int) async throws {
        let payload = JoinPortfolioPayload(portfolioId: portfolioId)
        let _: EmptyResponse = try await APIClient.shared.request(.joinPortfolio(payload: payload))
    }

    // DELETE membership from a portfolio; server closes synced brokerage positions.
    func leave(portfolioId: Int) async throws {
        let _: EmptyResponse = try await APIClient.shared.request(.leavePortfolio(portfolioId: portfolioId))
    }

    // Fetch pending rebalance events awaiting user confirmation.
    func fetchPendingRebalances() async throws -> [PendingRebalance] {
        return try await APIClient.shared.request(.pendingRebalances)
    }

    // Confirm a rebalance event, triggering trade execution for the current user.
    func confirmRebalance(eventId: Int) async throws -> ConfirmRebalanceResponse {
        return try await APIClient.shared.request(.confirmRebalance(eventId: eventId))
    }

    // Reject a rebalance event, skipping trade execution for the current user only.
    func rejectRebalance(eventId: Int) async throws {
        let _: EmptyResponse = try await APIClient.shared.request(.rejectRebalance(eventId: eventId))
    }
}
