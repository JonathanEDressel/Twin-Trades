import Foundation
import UserNotifications
import OSLog

private let logger = Logger(subsystem: "com.twintrades.app", category: "push")

// PushNotificationService manages APNs registration and inbound notification routing.
// Device tokens are persisted to the backend via UserService so the server can target
// this specific device for rebalance alerts and admin messages.
final class PushNotificationService: NSObject {
    static let shared = PushNotificationService()
    private override init() { super.init() }

    // Request APNs authorization from the user for alerts, sounds, and badges.
    // Logs the user's decision; does not throw — the caller checks the result.
    // Should be called after the user has seen value from the app (soft prompt first).
    func requestPermission() async {
        do {
            let granted = try await UNUserNotificationCenter.current()
                .requestAuthorization(options: [.alert, .sound, .badge])
            logger.info("Push permission granted: \(granted)")
        } catch {
            logger.error("Push permission error: \(error.localizedDescription, privacy: .public)")
        }
    }

    // Send the APNs device token hex string to the backend for storage against the current user.
    // Called from AppDelegate.application(_:didRegisterForRemoteNotificationsWithDeviceToken:).
    // The token is re-sent on every app launch in case it has been rotated by APNs.
    func registerDeviceToken(_ tokenData: Data) async {
        let token = tokenData.map { String(format: "%02x", $0) }.joined()
        let payload = UserUpdatePayload(apnsDeviceToken: token)
        _ = try? await UserService.shared.updateMe(payload)
        logger.info("Device token registered with backend")
    }

    // Parse an incoming notification payload and route to the appropriate screen.
    // Rebalance deep links (twintrades://rebalance/{event_id}) trigger a sheet or navigation push.
    // Unknown payloads are logged and discarded without crashing.
    func handleNotification(_ userInfo: [AnyHashable: Any]) {
        guard let deepLink = userInfo["deep_link"] as? String,
              let url = URL(string: deepLink) else { return }
        logger.info("Handling deep link: \(url.absoluteString, privacy: .public)")
        NotificationCenter.default.post(name: .didReceiveDeepLink, object: url)
    }
}

extension Notification.Name {
    static let didReceiveDeepLink = Notification.Name("com.twintrades.app.deepLink")
}
