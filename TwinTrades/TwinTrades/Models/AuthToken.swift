import Foundation

struct AuthToken: Codable {
    let accessToken: String
    let refreshToken: String
    let tokenType: String

    enum CodingKeys: String, CodingKey {
        case accessToken = "access_token"
        case refreshToken = "refresh_token"
        case tokenType = "token_type"
    }
}

struct LoginPayload: Encodable {
    let email: String
    let password: String
}

struct RegisterPayload: Encodable {
    let email: String
    let username: String
    let password: String
    let displayName: String?

    enum CodingKeys: String, CodingKey {
        case email, username, password
        case displayName = "display_name"
    }
}

struct RefreshPayload: Encodable {
    let refreshToken: String

    enum CodingKeys: String, CodingKey {
        case refreshToken = "refresh_token"
    }
}

struct ChangePasswordPayload: Encodable {
    let currentPassword: String
    let newPassword: String

    enum CodingKeys: String, CodingKey {
        case currentPassword = "current_password"
        case newPassword = "new_password"
    }
}

struct ForgotPasswordPayload: Encodable {
    let email: String
}

struct ResetPasswordPayload: Encodable {
    let token: String
    let newPassword: String

    enum CodingKeys: String, CodingKey {
        case token
        case newPassword = "new_password"
    }
}

struct EmptyResponse: Codable {}
