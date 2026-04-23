import SwiftUI

struct AdminDashboardView: View {
    @State private var vm = AdminDashboardViewModel()

    var body: some View {
        // Display a grid of metric cards: total users, active portfolios, and total revenue.
        // Each card links to the corresponding admin detail screen (Users, Portfolios, Revenue).
        // Role guard: this view must only be reachable when user.role == .admin or .ultimate_admin.
        EmptyView()
            .task { await vm.load() }
    }
}
