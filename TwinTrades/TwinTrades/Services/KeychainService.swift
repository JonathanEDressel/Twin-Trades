import Foundation
import Security

actor KeychainService {
    static let shared = KeychainService()
    private init() {}

    private enum Keys {
        static let accessToken  = "com.twintrades.app.accessToken"
        static let refreshToken = "com.twintrades.app.refreshToken"
    }

    // MARK: - Access Token

    func accessToken() throws -> String {
        guard let value = try read(key: Keys.accessToken) else { throw APIError.tokenMissing }
        return value
    }

    func saveAccessToken(_ token: String) throws {
        try write(value: token, key: Keys.accessToken)
    }

    // MARK: - Refresh Token

    func refreshToken() throws -> String {
        guard let value = try read(key: Keys.refreshToken) else { throw APIError.tokenMissing }
        return value
    }

    func saveRefreshToken(_ token: String) throws {
        try write(value: token, key: Keys.refreshToken)
    }

    // MARK: - Clear

    func clear() {
        delete(key: Keys.accessToken)
        delete(key: Keys.refreshToken)
    }

    // MARK: - Private Helpers

    private func write(value: String, key: String) throws {
        guard let data = value.data(using: .utf8) else { throw KeychainError.encodingFailed }
        delete(key: key)    // Remove existing item before writing
        let query: [CFString: Any] = [
            kSecClass:             kSecClassGenericPassword,
            kSecAttrAccount:       key,
            kSecValueData:         data,
            kSecAttrAccessible:    kSecAttrAccessibleWhenUnlockedThisDeviceOnly
        ]
        let status = SecItemAdd(query as CFDictionary, nil)
        guard status == errSecSuccess else { throw KeychainError.saveFailed(status) }
    }

    private func read(key: String) throws -> String? {
        let query: [CFString: Any] = [
            kSecClass:             kSecClassGenericPassword,
            kSecAttrAccount:       key,
            kSecReturnData:        true,
            kSecMatchLimit:        kSecMatchLimitOne
        ]
        var result: AnyObject?
        let status = SecItemCopyMatching(query as CFDictionary, &result)
        if status == errSecItemNotFound { return nil }
        guard status == errSecSuccess else { throw KeychainError.readFailed(status) }
        guard let data = result as? Data, let string = String(data: data, encoding: .utf8) else {
            throw KeychainError.decodingFailed
        }
        return string
    }

    @discardableResult
    private func delete(key: String) -> Bool {
        let query: [CFString: Any] = [
            kSecClass:       kSecClassGenericPassword,
            kSecAttrAccount: key
        ]
        let status = SecItemDelete(query as CFDictionary)
        return status == errSecSuccess || status == errSecItemNotFound
    }
}

enum KeychainError: LocalizedError {
    case encodingFailed
    case decodingFailed
    case saveFailed(OSStatus)
    case readFailed(OSStatus)

    var errorDescription: String? {
        switch self {
        case .encodingFailed:       return "Keychain: failed to encode token."
        case .decodingFailed:       return "Keychain: failed to decode token."
        case .saveFailed(let s):    return "Keychain save failed (OSStatus: \(s))."
        case .readFailed(let s):    return "Keychain read failed (OSStatus: \(s))."
        }
    }
}
