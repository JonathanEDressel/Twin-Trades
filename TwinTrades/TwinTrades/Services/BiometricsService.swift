import Foundation
import LocalAuthentication
import OSLog

private let logger = Logger(subsystem: "com.twintrades.app", category: "biometrics")

// BiometricsService wraps LocalAuthentication to provide Face ID / Touch ID gating
// for sensitive actions such as viewing brokerage credentials or authorizing trades.
// The policy used is .deviceOwnerAuthenticationWithBiometrics, not passcode fallback.
actor BiometricsService {
    static let shared = BiometricsService()
    private init() {}

    // Returns true if the device supports and has enrolled biometrics (Face ID or Touch ID).
    // Should be checked before showing any biometric-gated UI element.
    // Returns false on simulators without enrolled biometrics.
    func canUseBiometrics() -> Bool {
        let context = LAContext()
        var error: NSError?
        let can = context.canEvaluatePolicy(.deviceOwnerAuthenticationWithBiometrics, error: &error)
        if let error { logger.info("Biometrics unavailable: \(error.localizedDescription, privacy: .public)") }
        return can
    }

    // Present the system biometric prompt with the given localized reason string.
    // Returns true on successful authentication; returns false if the user cancels.
    // Throws LAError for lockout or other policy failures the caller should handle.
    func authenticate(reason: String) async throws -> Bool {
        let context = LAContext()
        do {
            let success = try await context.evaluatePolicy(
                .deviceOwnerAuthenticationWithBiometrics,
                localizedReason: reason
            )
            logger.info("Biometric auth result: \(success)")
            return success
        } catch {
            logger.error("Biometric auth error: \(error.localizedDescription, privacy: .public)")
            throw error
        }
    }
}
