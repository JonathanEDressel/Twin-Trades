import SwiftUI

struct SettingsView: View {
    @State private var vm = SettingsViewModel()

    var body: some View {
        // Render grouped form sections: Profile (display name, avatar), Notifications (rebalance preference),
        // Subscription (plan badge, upgrade CTA), Brokerage (connected accounts list with unlink buttons),
        // and Account (change password, delete account — destructive).
        EmptyView()
            .task { await vm.load() }
    }
}
