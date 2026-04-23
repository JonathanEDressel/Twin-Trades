import SwiftUI

struct AdminChangeLogView: View {
    @State private var vm = AdminChangeLogViewModel()

    var body: some View {
        // Display a paginated list of change log entries showing entity type, action, admin ID, and timestamp.
        // Tapping an entry shows the JSON diff in a monospaced scrollable detail sheet.
        // The change log is insert-only; no edit or delete affordances are shown.
        EmptyView()
            .task { await vm.load() }
    }
}
