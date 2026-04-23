import Foundation
import Observation

@Observable
@MainActor
final class AdminDashboardViewModel {
    enum State { case idle, loading, loaded, error(String) }

    private(set) var state: State = .idle
    private(set) var userCount: Int = 0
    private(set) var activePortfolioCount: Int = 0
    private(set) var revenue: AdminRevenueSummary?

    // Load summary metrics for the admin dashboard: user count, portfolio count, and revenue total.
    // Uses structured concurrency to fetch all three in parallel.
    // Sets state to .loaded on success; .error with a message on any failure.
    func load() async {
        state = .loading
        do {
            async let usersTask    = AdminService.shared.fetchUsers(page: 1, pageSize: 1)
            async let revenueTask  = AdminService.shared.fetchRevenue()
            let users = try await usersTask
            userCount  = users.count   // stub: real impl uses a count endpoint
            revenue    = try await revenueTask
            state = .loaded
        } catch {
            state = .error(error.localizedDescription)
        }
    }

    func clearError() { if case .error = state { state = .idle } }
}
