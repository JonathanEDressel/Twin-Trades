import Foundation

enum UserRole: String, Codable {
    case user
    case admin
    case ultimate_admin
}

enum RebalanceConfirmation: String, Codable {
    case push
    case email
    case sms
}

struct User: Codable, Identifiable {
    let id: Int
    let email: String
    let username: String
    let displayName: String?
    let avatarURL: String?
    let role: UserRole
    let rebalanceConfirmation: RebalanceConfirmation
    let isActive: Bool
    let createdAt: Date

    enum CodingKeys: String, CodingKey {
        case id, email, username, role
        case displayName = "display_name"
        case avatarURL = "avatar_url"
        case rebalanceConfirmation = "rebalance_confirmation"
        case isActive = "is_active"
        case createdAt = "created_at"
    }
}

struct UserUpdatePayload: Encodable {
    var displayName: String?
    var avatarURL: String?
    var rebalanceConfirmation: RebalanceConfirmation?
    var phoneNumber: String?
    var apnsDeviceToken: String?

    enum CodingKeys: String, CodingKey {
        case displayName = "display_name"
        case avatarURL = "avatar_url"
        case rebalanceConfirmation = "rebalance_confirmation"
        case phoneNumber = "phone_number"
        case apnsDeviceToken = "apns_device_token"
    }
}
