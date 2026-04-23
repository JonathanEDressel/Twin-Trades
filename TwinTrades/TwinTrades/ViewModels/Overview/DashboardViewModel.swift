import Foundation
import Observation

@Observable
@MainActor
final class DashboardViewModel {
    enum State { case idle, loading, loaded, error(String) }

    private(set) var state: State = .idle
    private(set) var portfolios: [Portfolio] = []
    private(set) var pendingRebalances: [PendingRebalance] = []
    private(set) var user: User?

    // Load the current user profile, joined portfolios, and pending rebalances in parallel.
    // Uses structured concurrency (async let) to fire all three requests simultaneously.
    // Sets state to .loaded on success or .error with a message on any failure.
    func load() async {
        state = .loading
        do {
            async let userTask        = UserService.shared.fetchMe()
            async let portfoliosTask  = PortfolioService.shared.fetchMyPortfolios()
            async let rebalancesTask  = PortfolioService.shared.fetchPendingRebalances()
            user              = try await userTask
            portfolios        = try await portfoliosTask
            pendingRebalances = try await rebalancesTask
            state = .loaded
        } catch {
            state = .error(error.localizedDescription)
        }
    }

    // Confirm a pending rebalance event by ID, triggering trade execution on the backend.
    // Removes the confirmed event from pendingRebalances on success to update the UI immediately.
    // Shows an inline error if the event is expired or the brokerage connection is inactive.
    func confirmRebalance(eventId: Int) async {
        do {
            _ = try await PortfolioService.shared.confirmRebalance(eventId: eventId)
            pendingRebalances.removeAll { $0.id == eventId }
        } catch {
            state = .error(error.localizedDescription)
        }
    }

    // Reject a pending rebalance event, skipping trade execution for the current user.
    // Removes the rejected event from the local pendingRebalances list immediately.
    // Other portfolio members are unaffected by this rejection.
    func rejectRebalance(eventId: Int) async {
        do {
            try await PortfolioService.shared.rejectRebalance(eventId: eventId)
            pendingRebalances.removeAll { $0.id == eventId }
        } catch {
            state = .error(error.localizedDescription)
        }
    }

    func clearError() { if case .error = state { state = .idle } }
}
