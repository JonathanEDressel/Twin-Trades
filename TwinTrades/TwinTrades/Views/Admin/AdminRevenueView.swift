import SwiftUI

struct AdminRevenueView: View {
    @State private var vm = AdminRevenueViewModel()

    var body: some View {
        // Render a revenue summary with total revenue, counts per plan, and estimated MRR.
        // All figures come from vm.revenue (AdminRevenueSummary) sourced from the subscriptions table.
        // Values are formatted with Formatters.currency(_:) — never Double.
        EmptyView()
            .task { await vm.load() }
    }
}
