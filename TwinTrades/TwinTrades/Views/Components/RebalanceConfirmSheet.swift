import SwiftUI

struct RebalanceConfirmSheet: View {
    let event: PendingRebalance
    var onConfirm: () async -> Void
    var onReject: () async -> Void
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        // Show the rebalance event details: portfolio name, target holdings with percentages,
        // and the expiry time formatted as a countdown string.
        // Two buttons at the bottom: "Confirm" (calls onConfirm then dismiss) and "Skip" (calls onReject then dismiss).
        EmptyView()
    }
}
