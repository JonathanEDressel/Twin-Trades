import UIKit
import OSLog

private let logger = Logger(subsystem: "com.twintrades.app", category: "appdelegate")

// AppDelegate handles system callbacks that cannot be expressed in SwiftUI lifecycle hooks,
// specifically APNs device token registration and inbound remote notification routing.
// Deep-link routing is forwarded to AppCoordinator via the PushNotificationService.
final class AppDelegate: NSObject, UIApplicationDelegate {

    func application(
        _ application: UIApplication,
        didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
    ) -> Bool {
        // Register for remote (APNs) notifications at launch so iOS can assign a device token.
        // The actual permission request (UNUserNotificationCenter) is deferred until after
        // the user has seen value from the app — triggered by PushNotificationService.requestPermission().
        application.registerForRemoteNotifications()
        return true
    }

    func application(
        _ application: UIApplication,
        didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data
    ) {
        // Forward the APNs device token to PushNotificationService, which converts it to a
        // hex string and registers it with the backend via PUT /users/me.
        logger.info("APNs device token received")
        Task { await PushNotificationService.shared.registerDeviceToken(deviceToken) }
    }

    func application(
        _ application: UIApplication,
        didFailToRegisterForRemoteNotificationsWithError error: Error
    ) {
        logger.error("APNs registration failed: \(error.localizedDescription, privacy: .public)")
    }

    func application(
        _ application: UIApplication,
        didReceiveRemoteNotification userInfo: [AnyHashable: Any],
        fetchCompletionHandler completionHandler: @escaping (UIBackgroundFetchResult) -> Void
    ) {
        // Handle a background APNs notification payload; parse the deep_link field and
        // route to PushNotificationService for notification-center posting.
        PushNotificationService.shared.handleNotification(userInfo)
        completionHandler(.newData)
    }
}
