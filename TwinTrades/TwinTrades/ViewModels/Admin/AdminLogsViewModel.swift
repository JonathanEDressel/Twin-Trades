import Foundation
import Observation

@Observable
@MainActor
final class AdminLogsViewModel {
    enum State { case idle, loading, loaded, error(String) }

    private(set) var state: State = .idle
    private(set) var logs: [AdminErrorLog] = []
    private(set) var currentPage = 1
    private(set) var hasMore = true
    private let pageSize = 30

    // Fetch the first page of error logs from the admin endpoint; resets pagination state.
    // Logs are sorted by created_at descending — most recent errors appear first.
    // Sets state to .loaded on success or .error with the server message on failure.
    func load() async {
        state = .loading
        currentPage = 1
        do {
            logs = try await AdminService.shared.fetchErrorLogs(page: 1, pageSize: pageSize)
            hasMore = logs.count == pageSize
            state = .loaded
        } catch {
            state = .error(error.localizedDescription)
        }
    }

    // Append the next page of logs (infinite scroll); no-op when hasMore is false.
    // Decrements currentPage on failure to allow retry on next scroll trigger.
    // Does not set state to .loading to avoid hiding already-loaded logs.
    func loadMore() async {
        guard hasMore, case .loaded = state else { return }
        currentPage += 1
        do {
            let more = try await AdminService.shared.fetchErrorLogs(page: currentPage, pageSize: pageSize)
            logs.append(contentsOf: more)
            hasMore = more.count == pageSize
        } catch {
            currentPage -= 1
        }
    }

    func clearError() { if case .error = state { state = .idle } }
}
