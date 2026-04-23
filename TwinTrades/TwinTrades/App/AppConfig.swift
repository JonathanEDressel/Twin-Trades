import Foundation

// AppConfig is the single source of truth for all runtime configuration values on iOS.
// Values are read from the active .xcconfig file (Debug.xcconfig / Staging.xcconfig / Release.xcconfig)
// via the main bundle's Info.plist. Never read ProcessInfo.processInfo.environment directly in feature code.
final class AppConfig {
    static let shared = AppConfig()
    private init() {}

    // The base URL for all API requests. Configured per build scheme via .xcconfig.
    // Debug: http://localhost:8000  |  Staging: https://staging-api.twintrades.com  |  Release: https://api.twintrades.com
    var apiBaseURL: URL {
        guard let urlString = Bundle.main.object(forInfoDictionaryKey: "API_BASE_URL") as? String,
              let url = URL(string: urlString) else {
            fatalError("API_BASE_URL not set in Info.plist or is invalid.")
        }
        return url
    }

    // The Apple bundle identifier. Must match App Store Connect and the entitlements file.
    // Value: com.twintrades.app — same for all build schemes.
    var bundleID: String {
        Bundle.main.bundleIdentifier ?? "com.twintrades.app"
    }

    // Indicates the current build environment; used for logging and feature flags only.
    // Derived from the ENVIRONMENT key in the active .xcconfig, e.g. "debug", "staging", "release".
    var environment: String {
        Bundle.main.object(forInfoDictionaryKey: "ENVIRONMENT") as? String ?? "release"
    }

    // Returns true when running in the debug or staging environment.
    // Used to gate developer-only UI (e.g. build info badge) — never for security decisions.
    var isDevelopment: Bool {
        environment == "debug" || environment == "staging"
    }

    // StoreKit product identifier for the monthly subscription plan.
    static let monthlyProductID  = "com.twintrades.app.monthly"
    // StoreKit product identifier for the annual subscription plan.
    static let annualProductID   = "com.twintrades.app.annual"
    // StoreKit product identifier for the lifetime purchase.
    static let lifetimeProductID = "com.twintrades.app.lifetime"
}
