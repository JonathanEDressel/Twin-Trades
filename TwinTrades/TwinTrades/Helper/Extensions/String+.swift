import Foundation

extension String {
    var isValidEmail: Bool { Validators.email(self) }
    var isValidUsername: Bool { Validators.username(self) }
    var trimmed: String { trimmingCharacters(in: .whitespacesAndNewlines) }
    var isBlank: Bool { trimmed.isEmpty }
}
