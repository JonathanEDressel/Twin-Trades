import SwiftUI

struct AdminPortfoliosView: View {
    @State private var vm = AdminPortfoliosViewModel()

    var body: some View {
        // Show all portfolios (active and inactive) in a list with active/inactive badges.
        // Each row has a context menu: Edit Holdings, Toggle Active, Delete (destructive).
        // A "+" toolbar button presents a sheet to create a new portfolio via vm.createPortfolio.
        EmptyView()
            .task { await vm.load() }
    }
}
