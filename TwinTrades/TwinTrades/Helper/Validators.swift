import Foundation

enum Validators {

    static func email(_ value: String) -> Bool {
        let pattern = #"^[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}$"#
        return value.range(of: pattern, options: .regularExpression) != nil
    }

    static func password(_ value: String) -> PasswordValidation {
        var errors: [String] = []
        if value.count < 8 { errors.append("At least 8 characters") }
        if !value.contains(where: \.isUppercase) { errors.append("One uppercase letter") }
        if !value.contains(where: \.isLowercase) { errors.append("One lowercase letter") }
        if !value.contains(where: \.isNumber) { errors.append("One digit") }
        let special = CharacterSet(charactersIn: "!@#$%^&*")
        if value.unicodeScalars.first(where: { special.contains($0) }) == nil {
            errors.append("One special character (!@#$%^&*)")
        }
        return PasswordValidation(isValid: errors.isEmpty, errors: errors)
    }

    static func username(_ value: String) -> Bool {
        let pattern = #"^[A-Za-z0-9_]{3,30}$"#
        return value.range(of: pattern, options: .regularExpression) != nil
    }

    static func ticker(_ value: String) -> Bool {
        let pattern = #"^[A-Z]{1,5}$"#
        return value.range(of: pattern, options: .regularExpression) != nil
    }
}

struct PasswordValidation {
    let isValid: Bool
    let errors: [String]
}
