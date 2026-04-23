import SwiftUI

struct PortfolioDetailView: View {
    let portfolioId: Int
    @State private var vm: PortfolioDetailViewModel

    init(portfolioId: Int) {
        self.portfolioId = portfolioId
        _vm = State(wrappedValue: PortfolioDetailViewModel(portfolioId: portfolioId))
    }

    var body: some View {
        // Display the portfolio name, return metrics, and a holding breakdown list.
        // A Swift Charts donut chart visualizes the target allocation percentages.
        // A destructive "Leave Portfolio" button at the bottom calls vm.leave() after confirmation.
        EmptyView()
            .task { await vm.load() }
    }
}
