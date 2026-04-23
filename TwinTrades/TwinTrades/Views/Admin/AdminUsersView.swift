import SwiftUI

struct AdminUsersView: View {
    @State private var vm = AdminUsersViewModel()

    var body: some View {
        // Display a searchable paginated list of users showing email, username, role badge, and status.
        // Swipe-to-delete calls vm.deleteUser(id:) with a destructive confirmation dialog.
        // Tapping a row navigates to a user detail sheet for editing role and subscription_exempt.
        EmptyView()
            .task { await vm.load() }
    }
}
