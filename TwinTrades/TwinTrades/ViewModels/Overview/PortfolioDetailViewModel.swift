import Foundation
import Observation

@Observable
@MainActor
final class PortfolioDetailViewModel {
    enum State { case idle, loading, loaded, error(String) }

    private(set) var state: State = .idle
    private(set) var portfolio: Portfolio?
    let portfolioId: Int

    init(portfolioId: Int) { self.portfolioId = portfolioId }

    // Fetch the full portfolio detail including holdings and return history for the given ID.
    // Sets state to .loaded on success and stores the result in the portfolio property.
    // Sets state to .error with a server message if the portfolio is not found or deactivated.
    func load() async {
        state = .loading
        do {
            portfolio = try await PortfolioService.shared.fetchDetail(portfolioId: portfolioId)
            state = .loaded
        } catch {
            state = .error(error.localizedDescription)
        }
    }

    // Initiate a leave-portfolio request and post a notification so the parent view can pop.
    // Brokerage positions are closed server-side; this may take a few seconds to reflect.
    // The caller should show a loading overlay during the async operation.
    func leave() async {
        do {
            try await PortfolioService.shared.leavePortfolio(portfolioId: portfolioId)
            NotificationCenter.default.post(name: .didLeavePortfolio, object: portfolioId)
        } catch {
            state = .error(error.localizedDescription)
        }
    }

    func clearError() { if case .error = state { state = .idle } }
}

extension Notification.Name {
    static let didLeavePortfolio = Notification.Name("com.twintrades.app.didLeavePortfolio")
}
