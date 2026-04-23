import SwiftUI

struct AdminAnalyticsView: View {
    @State private var vm = AdminAnalyticsViewModel()

    var body: some View {
        // Display aggregate analytics: total user count, subscriptions by plan type, and portfolio member counts.
        // Uses Swift Charts bar charts to visualize subscription distribution across monthly/annual/lifetime.
        // Data is sourced from the local database via the admin endpoints — no live App Store calls.
        EmptyView()
            .task { await vm.load() }
    }
}
