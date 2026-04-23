import Foundation

enum APIEndpoint {
    // MARK: - Auth
    case login(LoginPayload)
    case register(RegisterPayload)
    case refresh(RefreshPayload)
    case logout
    case changePassword(ChangePasswordPayload)
    case forgotPassword(ForgotPasswordPayload)
    case resetPassword(ResetPasswordPayload)

    // MARK: - User
    case me
    case updateMe(UserUpdatePayload)
    case deleteMe

    // MARK: - Portfolio
    case myPortfolios
    case marketplace
    case portfolioDetail(id: Int)
    case joinPortfolio(payload: JoinPortfolioPayload)
    case leavePortfolio(portfolioId: Int)
    case pendingRebalances
    case confirmRebalance(eventId: Int)
    case rejectRebalance(eventId: Int)

    // MARK: - Trade
    case tradeHistory(page: Int, pageSize: Int)

    // MARK: - Subscription
    case subscriptionStatus
    case verifyApple(VerifyApplePayload)

    // MARK: - Brokerage
    case brokerageConnections
    case initiateOAuth(slug: String)
    case handleOAuthCallback(OAuthCallbackPayload)
    case disconnectBrokerage(id: Int)

    // MARK: - Admin
    case adminUsers(page: Int, pageSize: Int)
    case adminUpdateUser(id: Int, payload: Data)
    case adminDeleteUser(id: Int)
    case adminCreatePortfolio(CreatePortfolioPayload)
    case adminUpdatePortfolio(id: Int, payload: Data)
    case adminDeletePortfolio(id: Int)
    case adminUpdateHoldings(portfolioId: Int, payload: UpdateHoldingsPayload)
    case adminTogglePortfolio(id: Int)
    case adminRemoveUserFromPortfolio(portfolioId: Int, userId: Int)
    case adminErrorLogs(page: Int, pageSize: Int)
    case adminRevenue
    case adminChangelog(page: Int, pageSize: Int)

    // MARK: - Push
    case registerDeviceToken(token: String)
}

extension APIEndpoint {
    var baseURL: URL { AppConfig.shared.apiBaseURL }

    var path: String {
        switch self {
        case .login:                     return "/auth/login"
        case .register:                  return "/auth/register"
        case .refresh:                   return "/auth/refresh"
        case .logout:                    return "/auth/logout"
        case .changePassword:            return "/auth/change-password"
        case .forgotPassword:            return "/auth/forgot-password"
        case .resetPassword:             return "/auth/reset-password"
        case .me, .updateMe, .deleteMe:  return "/users/me"
        case .myPortfolios:              return "/portfolios/mine"
        case .marketplace:               return "/portfolios/marketplace"
        case .portfolioDetail(let id):   return "/portfolios/\(id)"
        case .joinPortfolio:             return "/portfolios/join"
        case .leavePortfolio(let id):    return "/portfolios/\(id)/leave"
        case .pendingRebalances:         return "/portfolios/rebalances/pending"
        case .confirmRebalance(let id):  return "/portfolios/rebalances/\(id)/confirm"
        case .rejectRebalance(let id):   return "/portfolios/rebalances/\(id)/reject"
        case .tradeHistory:              return "/trades"
        case .subscriptionStatus:        return "/subscriptions/status"
        case .verifyApple:               return "/subscriptions/verify/apple"
        case .brokerageConnections:      return "/brokerages"
        case .initiateOAuth(let slug):   return "/brokerages/\(slug)/oauth/initiate"
        case .handleOAuthCallback:       return "/brokerages/oauth/callback"
        case .disconnectBrokerage(let id): return "/brokerages/\(id)"
        case .adminUsers:                return "/admin/users"
        case .adminUpdateUser(let id, _): return "/admin/users/\(id)"
        case .adminDeleteUser(let id):   return "/admin/users/\(id)"
        case .adminCreatePortfolio:      return "/admin/portfolios"
        case .adminUpdatePortfolio(let id, _): return "/admin/portfolios/\(id)"
        case .adminDeletePortfolio(let id): return "/admin/portfolios/\(id)"
        case .adminUpdateHoldings(let id, _): return "/admin/portfolios/\(id)/holdings"
        case .adminTogglePortfolio(let id): return "/admin/portfolios/\(id)/toggle"
        case .adminRemoveUserFromPortfolio(let pid, let uid): return "/admin/portfolios/\(pid)/users/\(uid)"
        case .adminErrorLogs:            return "/admin/logs"
        case .adminRevenue:              return "/admin/revenue"
        case .adminChangelog:            return "/admin/changelog"
        case .registerDeviceToken:       return "/users/me/device-token"
        }
    }

    var method: String {
        switch self {
        case .login, .register, .refresh, .changePassword, .forgotPassword,
             .resetPassword, .joinPortfolio, .handleOAuthCallback,
             .verifyApple, .confirmRebalance, .rejectRebalance,
             .adminCreatePortfolio, .registerDeviceToken:
            return "POST"
        case .updateMe, .adminUpdateUser, .adminUpdatePortfolio,
             .adminUpdateHoldings, .adminTogglePortfolio:
            return "PUT"
        case .logout, .deleteMe, .disconnectBrokerage, .leavePortfolio,
             .adminDeleteUser, .adminDeletePortfolio, .adminRemoveUserFromPortfolio:
            return "DELETE"
        default:
            return "GET"
        }
    }

    var requiresAuth: Bool {
        switch self {
        case .login, .register, .forgotPassword, .resetPassword, .refresh: return false
        default: return true
        }
    }

    func urlRequest() throws -> URLRequest {
        var components = URLComponents(url: baseURL.appendingPathComponent(path), resolvingAgainstBaseURL: false)!
        // Attach query parameters for paginated GET endpoints
        switch self {
        case .tradeHistory(let page, let ps), .adminUsers(let page, let ps), .adminErrorLogs(let page, let ps), .adminChangelog(let page, let ps):
            components.queryItems = [
                URLQueryItem(name: "page", value: "\(page)"),
                URLQueryItem(name: "page_size", value: "\(ps)")
            ]
        default: break
        }

        guard let url = components.url else { throw APIError.invalidURL }
        var request = URLRequest(url: url)
        request.httpMethod = method
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue("application/json", forHTTPHeaderField: "Accept")

        let encoder = JSONEncoder.apiEncoder
        switch self {
        case .login(let p):               request.httpBody = try encoder.encode(p)
        case .register(let p):            request.httpBody = try encoder.encode(p)
        case .refresh(let p):             request.httpBody = try encoder.encode(p)
        case .changePassword(let p):      request.httpBody = try encoder.encode(p)
        case .forgotPassword(let p):      request.httpBody = try encoder.encode(p)
        case .resetPassword(let p):       request.httpBody = try encoder.encode(p)
        case .updateMe(let p):            request.httpBody = try encoder.encode(p)
        case .joinPortfolio(let p):       request.httpBody = try encoder.encode(p)
        case .handleOAuthCallback(let p): request.httpBody = try encoder.encode(p)
        case .verifyApple(let p):         request.httpBody = try encoder.encode(p)
        case .adminUpdateUser(_, let d):  request.httpBody = d
        case .adminUpdatePortfolio(_, let d): request.httpBody = d
        case .adminUpdateHoldings(_, let p): request.httpBody = try encoder.encode(p)
        case .adminCreatePortfolio(let p): request.httpBody = try encoder.encode(p)
        case .registerDeviceToken(let token):
            request.httpBody = try encoder.encode(["device_token": token])
        default: break
        }
        return request
    }
}
