import SwiftUI

struct MarketplaceView: View {
    @State private var vm = MarketplaceViewModel()

    var body: some View {
        // Show a searchable list of PortfolioCardViews for vm.filteredPortfolios.
        // Each card includes a join button; joined portfolios show a checkmark badge.
        // vm.join(portfolioId:) is called inline; errors surface via a ToastView at the bottom of the screen.
        EmptyView()
            .task { await vm.loadMarketplace() }
    }
}
