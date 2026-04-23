import Foundation
import Observation

@Observable
@MainActor
final class AdminChangeLogViewModel {
    enum State { case idle, loading, loaded, error(String) }

    private(set) var state: State = .idle
    private(set) var entries: [AdminChangeEntry] = []
    private(set) var currentPage = 1
    private(set) var hasMore = true
    private let pageSize = 30

    // Fetch the first page of changelog entries; entries are never modified or deleted (insert-only).
    // Sorted by created_at descending — most recent admin actions appear first.
    // Sets state to .loaded on success or .error with the server message on failure.
    func load() async {
        state = .loading
        currentPage = 1
        do {
            entries = try await AdminService.shared.fetchChangelog(page: 1, pageSize: pageSize)
            hasMore = entries.count == pageSize
            state = .loaded
        } catch {
            state = .error(error.localizedDescription)
        }
    }

    // Append the next page of changelog entries (infinite scroll).
    // No-op when hasMore is false to avoid unnecessary server requests.
    // Does not alter the state value to avoid hiding existing visible entries.
    func loadMore() async {
        guard hasMore, case .loaded = state else { return }
        currentPage += 1
        do {
            let more = try await AdminService.shared.fetchChangelog(page: currentPage, pageSize: pageSize)
            entries.append(contentsOf: more)
            hasMore = more.count == pageSize
        } catch {
            currentPage -= 1
        }
    }

    func clearError() { if case .error = state { state = .idle } }
}
