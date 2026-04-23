import SwiftUI

struct AdminLogsView: View {
    @State private var vm = AdminLogsViewModel()

    var body: some View {
        // Display a paginated list of error log entries with endpoint, message, timestamp, and user_id.
        // Tapping a row presents a full-screen sheet with the stack trace rendered in a monospaced font.
        // Scroll-to-end triggers vm.loadMore() to fetch additional pages.
        EmptyView()
            .task { await vm.load() }
    }
}
