import Foundation
import Observation

@Observable
@MainActor
final class SettingsViewModel {
    enum State { case idle, loading, loaded, error(String) }

    private(set) var state: State = .idle
    private(set) var user: User?
    private(set) var subscription: Subscription?
    private(set) var brokerageConnections: [BrokerageConnection] = []
    private(set) var oauthURL: URL?

    // Load current user profile, subscription status, and brokerage connections in parallel.
    // Uses structured concurrency (async let) to minimize total loading time.
    // Sets state to .loaded on all-success or .error with the first failure message.
    func load() async {
        state = .loading
        do {
            async let userTask         = UserService.shared.fetchMe()
            async let subTask          = SubscriptionService.shared.fetchStatus()
            async let brokerageTask    = BrokerageService.shared.fetchConnections()
            user                  = try await userTask
            subscription          = try await subTask
            brokerageConnections  = try await brokerageTask
            state = .loaded
        } catch {
            state = .error(error.localizedDescription)
        }
    }

    // Persist updated user settings (display name, rebalance confirmation preference) via UserService.
    // Refreshes the local user property on success for immediate UI update.
    // Validates the payload locally before making a network request.
    func updateSettings(payload: UserUpdatePayload) async {
        do {
            user = try await UserService.shared.updateMe(payload)
        } catch {
            state = .error(error.localizedDescription)
        }
    }

    // Initiate the OAuth flow for a brokerage by slug (e.g. "webull").
    // Stores the returned auth URL in oauthURL; the View opens it in ASWebAuthenticationSession.
    // Clears oauthURL when the OAuth session is dismissed regardless of outcome.
    func linkBrokerage(slug: String) async {
        do {
            let result = try await BrokerageService.shared.initiateOAuth(slug: slug)
            oauthURL = URL(string: result.authURL)
        } catch {
            state = .error(error.localizedDescription)
        }
    }

    // Disconnect a brokerage connection by its row ID via BrokerageService.
    // Removes the connection from the local brokerageConnections array immediately (optimistic).
    // Rolls back the removal and shows an error if the server request fails.
    func unlinkBrokerage(id: Int) async {
        let snapshot = brokerageConnections
        brokerageConnections.removeAll { $0.id == id }
        do {
            try await BrokerageService.shared.disconnect(connectionId: id)
        } catch {
            brokerageConnections = snapshot
            state = .error(error.localizedDescription)
        }
    }

    // Request account deletion after biometric confirmation in the View layer.
    // Calls UserService.deleteMe() which clears tokens; posts .didLogout on success.
    // This action is irreversible — the View must show a destructive confirmation dialog first.
    func deleteAccount() async {
        do {
            try await UserService.shared.deleteMe()
            NotificationCenter.default.post(name: .didLogout, object: nil)
        } catch {
            state = .error(error.localizedDescription)
        }
    }

    func clearError() { if case .error = state { state = .idle } }
}
