import SwiftUI
import OSLog

private let logger = Logger(subsystem: "com.twintrades.app", category: "coordinator")

// AppCoordinator manages the top-level navigation state, switching between the
// unauthenticated flow (Login/Register) and the authenticated main tab bar.
// It observes .didAuthenticate and .didLogout notifications to transition the root view.
@Observable
@MainActor
final class AppCoordinator {
    enum Root { case unauthenticated, authenticated, forceChangePassword }

    private(set) var root: Root = .unauthenticated
    private(set) var currentUser: User?

    init() {
        setupNotificationObservers()
    }

    // Determine the initial root by checking whether a valid access token exists in Keychain.
    // If a token is present, attempt a /users/me fetch to validate it and populate currentUser.
    // Falls back to .unauthenticated on any Keychain miss or network error.
    func resolveInitialRoot() async {
        do {
            _ = try await KeychainService.shared.accessToken()
            let user = try await UserService.shared.fetchMe()
            currentUser = user
            logger.info("Restored session for user: \(user.id)")
            root = .authenticated
        } catch {
            logger.info("No valid session: \(error.localizedDescription, privacy: .public)")
            root = .unauthenticated
        }
    }

    // Handle a successful authentication event by fetching the user profile and
    // setting root to .forceChangePassword if must_change_password is indicated by the server
    // (detected via a 403 with change_password_only scope on a subsequent request).
    // Otherwise sets root to .authenticated.
    private func handleAuthSuccess() {
        Task {
            do {
                currentUser = try await UserService.shared.fetchMe()
                root = .authenticated
            } catch {
                root = .unauthenticated
            }
        }
    }

    // Handle a deep link URL of the scheme twintrades://rebalance/{event_id}.
    // Posts a notification that DashboardViewModel listens to in order to present the
    // RebalanceConfirmSheet for the matching pending event.
    func handleDeepLink(_ url: URL) {
        guard url.scheme == "twintrades", url.host == "rebalance",
              let eventIdString = url.pathComponents.last,
              let eventId = Int(eventIdString) else {
            logger.info("Unrecognized deep link: \(url.absoluteString, privacy: .public)")
            return
        }
        logger.info("Routing deep link to rebalance event: \(eventId)")
        NotificationCenter.default.post(name: .didReceiveDeepLink, object: eventId)
    }

    private func setupNotificationObservers() {
        NotificationCenter.default.addObserver(
            forName: .didAuthenticate, object: nil, queue: .main
        ) { [weak self] _ in self?.handleAuthSuccess() }

        NotificationCenter.default.addObserver(
            forName: .didLogout, object: nil, queue: .main
        ) { [weak self] _ in
            self?.currentUser = nil
            self?.root = .unauthenticated
        }
    }
}
