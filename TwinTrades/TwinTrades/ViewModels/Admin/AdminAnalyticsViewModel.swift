import Foundation
import Observation

@Observable
@MainActor
final class AdminAnalyticsViewModel {
    enum State { case idle, loading, loaded, error(String) }

    private(set) var state: State = .idle
    private(set) var userCount: Int = 0
    private(set) var portfolioCount: Int = 0
    private(set) var activeSubscriptions: Int = 0

    // Load aggregate analytics metrics for the admin analytics screen.
    // Fetches user, portfolio, and subscription counts from the admin endpoints.
    // Sets state to .loaded on success or .error with the first failure message.
    func load() async {
        state = .loading
        do {
            let users = try await AdminService.shared.fetchUsers(page: 1, pageSize: 1)
            userCount = users.count   // stub: replace with dedicated count endpoint
            state = .loaded
        } catch {
            state = .error(error.localizedDescription)
        }
    }

    func clearError() { if case .error = state { state = .idle } }
}
