import Foundation
import OSLog

private let logger = Logger(subsystem: "com.twintrades.app", category: "networking")

actor APIClient {
    static let shared = APIClient()
    private let session: URLSession = .shared
    private let decoder = JSONDecoder.apiDecoder
    private let encoder = JSONEncoder.apiEncoder
    private var isRefreshing = false

    private init() {}

    func request<T: Decodable>(_ endpoint: APIEndpoint) async throws -> T {
        var urlRequest = try endpoint.urlRequest()

        if endpoint.requiresAuth {
            let token = try await KeychainService.shared.accessToken()
            urlRequest.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }

        logger.info("Request: \(endpoint.method, privacy: .public) \(endpoint.path, privacy: .public)")

        let data: Data
        let response: URLResponse
        do {
            (data, response) = try await session.data(for: urlRequest)
        } catch {
            logger.error("Network error: \(error.localizedDescription, privacy: .public)")
            throw APIError.network(error)
        }

        guard let http = response as? HTTPURLResponse else {
            throw APIError.invalidResponse
        }

        logger.info("Response: \(http.statusCode) for \(endpoint.path, privacy: .public)")

        if http.statusCode == 401, endpoint.requiresAuth {
            // Attempt a single token refresh then retry. If refresh also fails, bubble the error.
            try await refreshTokens()
            return try await request(endpoint)
        }

        switch http.statusCode {
        case 200..<300:
            do {
                return try decoder.decode(T.self, from: data)
            } catch {
                logger.error("Decoding error: \(error.localizedDescription, privacy: .public)")
                throw APIError.decoding(error)
            }
        case 401: throw APIError.unauthorized
        case 403: throw APIError.forbidden
        case 404: throw APIError.notFound
        default:  throw APIError.server(status: http.statusCode, data: data)
        }
    }

    // Performs a token refresh using the stored refresh token and persists new tokens.
    // Called automatically on 401 responses when requiresAuth is true.
    // Throws if the refresh token is missing or the server rejects it.
    private func refreshTokens() async throws {
        guard !isRefreshing else { return }
        isRefreshing = true
        defer { isRefreshing = false }
        let refreshToken = try await KeychainService.shared.refreshToken()
        let payload = RefreshPayload(refreshToken: refreshToken)
        let tokens: AuthToken = try await request(.refresh(payload))
        try await KeychainService.shared.saveAccessToken(tokens.accessToken)
        try await KeychainService.shared.saveRefreshToken(tokens.refreshToken)
    }
}
