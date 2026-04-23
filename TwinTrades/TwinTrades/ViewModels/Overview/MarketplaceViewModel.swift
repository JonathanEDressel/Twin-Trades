import Foundation
import Observation

@Observable
@MainActor
final class MarketplaceViewModel {
    enum State { case idle, loading, loaded, error(String) }

    private(set) var state: State = .idle
    private(set) var portfolios: [Portfolio] = []
    private(set) var joinedPortfolioIds: Set<Int> = []
    var searchText: String = ""

    // Fetch the marketplace portfolio list and the user's current memberships in parallel.
    // Determines which join buttons should be disabled (already a member).
    // Sets state to .loaded on success or .error with a message on failure.
    func loadMarketplace() async {
        state = .loading
        do {
            async let marketTask  = PortfolioService.shared.fetchMarketplace()
            async let myTask      = PortfolioService.shared.fetchMyPortfolios()
            portfolios            = try await marketTask
            joinedPortfolioIds    = Set((try await myTask).map(\.id))
            state = .loaded
        } catch {
            state = .error(error.localizedDescription)
        }
    }

    // Attempt to join the portfolio with the given ID; adds it to joinedPortfolioIds on success.
    // Throws if the user lacks an active subscription or is already a member.
    // Updates joinedPortfolioIds immediately (optimistic UI) and rolls back on error.
    func join(portfolioId: Int) async {
        joinedPortfolioIds.insert(portfolioId)   // optimistic
        do {
            try await PortfolioService.shared.joinPortfolio(portfolioId: portfolioId)
        } catch {
            joinedPortfolioIds.remove(portfolioId)
            state = .error(error.localizedDescription)
        }
    }

    var filteredPortfolios: [Portfolio] {
        guard !searchText.isBlank else { return portfolios }
        return portfolios.filter { $0.name.localizedCaseInsensitiveContains(searchText) }
    }

    func clearError() { if case .error = state { state = .idle } }
}
