import SwiftUI

struct DashboardView: View {
    @State private var vm = DashboardViewModel()

    var body: some View {
        // Display a scrollable list of PortfolioCardViews for each portfolio in vm.portfolios.
        // A pending rebalance banner appears at the top when vm.pendingRebalances is non-empty;
        // tapping a banner presents RebalanceConfirmSheet modally with the selected event.
        EmptyView()
            .task { await vm.load() }
    }
}
