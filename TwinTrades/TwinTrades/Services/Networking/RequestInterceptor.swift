import Foundation

// RequestInterceptor handles edge cases in request lifecycle such as
// queuing parallel requests during an active token refresh to avoid
// multiple concurrent refresh calls racing each other.
// This is a stub; the full implementation coordinates with APIClient's
// isRefreshing gate and serializes concurrent 401 retries.
struct RequestInterceptor {

    // Intercept an outgoing URLRequest to attach the current access token.
    // If the token is expired, trigger a refresh before attaching.
    // Returns a modified URLRequest with the Authorization header set.
    func intercept(_ request: URLRequest, endpoint: APIEndpoint) async throws -> URLRequest {
        var req = request
        if endpoint.requiresAuth {
            let token = try await KeychainService.shared.accessToken()
            req.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }
        return req
    }

    // Handle a 401 response by triggering token refresh and returning
    // whether the caller should retry the original request.
    // Prevents retry loops by tracking retry count via the request itself.
    func shouldRetry(after response: HTTPURLResponse, endpoint: APIEndpoint, retryCount: Int) -> Bool {
        return response.statusCode == 401 && endpoint.requiresAuth && retryCount < 1
    }
}
