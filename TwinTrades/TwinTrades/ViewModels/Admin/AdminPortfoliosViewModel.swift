import Foundation
import Observation

@Observable
@MainActor
final class AdminPortfoliosViewModel {
    enum State { case idle, loading, loaded, error(String) }

    private(set) var state: State = .idle
    private(set) var portfolios: [Portfolio] = []

    // Fetch all portfolios from the admin endpoint (includes inactive ones).
    // Replaces the portfolios array on each call; no local caching.
    // Sets state to .loaded on success or .error on failure.
    func load() async {
        state = .loading
        do {
            portfolios = try await PortfolioService.shared.fetchMarketplace()
            state = .loaded
        } catch {
            state = .error(error.localizedDescription)
        }
    }

    // Toggle the is_active flag for a portfolio, reflecting the change locally on success.
    // The server returns the updated Portfolio; replace the matching element in the array.
    // Logs and surfaces an error if the toggle request fails.
    func toggleActive(portfolioId: Int) async {
        do {
            let updated = try await AdminService.shared.togglePortfolioActive(id: portfolioId)
            if let idx = portfolios.firstIndex(where: { $0.id == portfolioId }) {
                portfolios[idx] = updated
            }
        } catch {
            state = .error(error.localizedDescription)
        }
    }

    // Delete a portfolio by ID; removes the matching element from the local array on success.
    // The server closes all member positions before completing the deletion.
    // This action is irreversible; the View must show a destructive confirmation dialog first.
    func deletePortfolio(id: Int) async {
        do {
            try await AdminService.shared.deletePortfolio(id: id)
            portfolios.removeAll { $0.id == id }
        } catch {
            state = .error(error.localizedDescription)
        }
    }

    // Create a new portfolio with the given name and optional description.
    // Appends the returned Portfolio to the local list on success for immediate display.
    // The new portfolio starts inactive; toggle it after adding holdings.
    func createPortfolio(name: String, description: String?) async {
        do {
            let payload = CreatePortfolioPayload(name: name, description: description)
            let created = try await AdminService.shared.createPortfolio(payload)
            portfolios.append(created)
        } catch {
            state = .error(error.localizedDescription)
        }
    }

    func clearError() { if case .error = state { state = .idle } }
}
