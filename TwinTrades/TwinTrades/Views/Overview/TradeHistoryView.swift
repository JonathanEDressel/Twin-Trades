import SwiftUI

struct TradeHistoryView: View {
    @State private var vm = TradeHistoryViewModel()

    var body: some View {
        // Show a paginated List of trade rows, each displaying ticker, action, quantity, price, and status badge.
        // When the user scrolls to the last item, call vm.loadMore() to append the next page.
        // Pull-to-refresh gesture calls vm.loadTrades() to reset to the first page.
        EmptyView()
            .task { await vm.loadTrades() }
    }
}
