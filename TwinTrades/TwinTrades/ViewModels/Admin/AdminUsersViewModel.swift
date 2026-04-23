import Foundation
import Observation

@Observable
@MainActor
final class AdminUsersViewModel {
    enum State { case idle, loading, loaded, error(String) }

    private(set) var state: State = .idle
    private(set) var users: [User] = []
    private(set) var currentPage = 1
    private(set) var hasMore = true
    private let pageSize = 20
    var searchText: String = ""

    // Fetch the first page of users from the admin endpoint; resets pagination state.
    // Sets state to .loaded on success or .error with the server message on failure.
    // Called on initial view appearance and on pull-to-refresh.
    func load() async {
        state = .loading
        currentPage = 1
        do {
            let result = try await AdminService.shared.fetchUsers(page: 1, pageSize: pageSize)
            users = result
            hasMore = result.count == pageSize
            state = .loaded
        } catch {
            state = .error(error.localizedDescription)
        }
    }

    // Load the next page of users and append to the existing list (infinite scroll).
    // Guards against concurrent fetches and is a no-op when hasMore is false.
    // Decrements currentPage on failure to keep pagination state consistent.
    func loadMore() async {
        guard hasMore, case .loaded = state else { return }
        currentPage += 1
        do {
            let result = try await AdminService.shared.fetchUsers(page: currentPage, pageSize: pageSize)
            users.append(contentsOf: result)
            hasMore = result.count == pageSize
        } catch {
            currentPage -= 1
        }
    }

    // Permanently delete a user account by ID via AdminService.
    // Removes the matching user from the local array immediately (optimistic update).
    // Rolls back on error and surfaces the failure message.
    func deleteUser(id: Int) async {
        let snapshot = users
        users.removeAll { $0.id == id }
        do {
            try await AdminService.shared.deleteUser(id: id)
        } catch {
            users = snapshot
            state = .error(error.localizedDescription)
        }
    }

    var filteredUsers: [User] {
        guard !searchText.isBlank else { return users }
        return users.filter {
            $0.email.localizedCaseInsensitiveContains(searchText) ||
            $0.username.localizedCaseInsensitiveContains(searchText)
        }
    }

    func clearError() { if case .error = state { state = .idle } }
}
