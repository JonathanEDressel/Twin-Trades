import Foundation
import Observation

@Observable
@MainActor
final class AdminRevenueViewModel {
    enum State { case idle, loading, loaded, error(String) }

    private(set) var state: State = .idle
    private(set) var revenue: AdminRevenueSummary?

    // Fetch the revenue summary from the local subscriptions table via AdminService.
    // No live App Store API calls are made; data reflects processed Apple Server Notifications.
    // Sets state to .loaded on success or .error with the server message on failure.
    func load() async {
        state = .loading
        do {
            revenue = try await AdminService.shared.fetchRevenue()
            state = .loaded
        } catch {
            state = .error(error.localizedDescription)
        }
    }

    func clearError() { if case .error = state { state = .idle } }
}
