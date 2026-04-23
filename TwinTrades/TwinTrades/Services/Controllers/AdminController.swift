import Foundation

// AdminController constructs URLRequests for all /admin endpoints.
// AdminService is the intended caller; callers must confirm user.role before using.
struct AdminController {

    // GET /admin/users — paginated list of all users.
    func fetchUsers(page: Int, pageSize: Int) async throws -> [User] {
        return try await APIClient.shared.request(.adminUsers(page: page, pageSize: pageSize))
    }

    // PUT /admin/users/{id} — update a user by ID with raw JSON data.
    func updateUser(id: Int, payload: Data) async throws -> User {
        return try await APIClient.shared.request(.adminUpdateUser(id: id, payload: payload))
    }

    // DELETE /admin/users/{id} — permanently delete a user account.
    func deleteUser(id: Int) async throws {
        let _: EmptyResponse = try await APIClient.shared.request(.adminDeleteUser(id: id))
    }

    // POST /admin/portfolios — create a new portfolio.
    func createPortfolio(_ payload: CreatePortfolioPayload) async throws -> Portfolio {
        return try await APIClient.shared.request(.adminCreatePortfolio(payload))
    }

    // PUT /admin/portfolios/{id} — update portfolio metadata.
    func updatePortfolio(id: Int, payload: Data) async throws -> Portfolio {
        return try await APIClient.shared.request(.adminUpdatePortfolio(id: id, payload: payload))
    }

    // DELETE /admin/portfolios/{id} — delete a portfolio and remove all members.
    func deletePortfolio(id: Int) async throws {
        let _: EmptyResponse = try await APIClient.shared.request(.adminDeletePortfolio(id: id))
    }

    // PUT /admin/portfolios/{id}/holdings — replace all holdings for a portfolio.
    func updateHoldings(portfolioId: Int, payload: UpdateHoldingsPayload) async throws {
        let _: EmptyResponse = try await APIClient.shared.request(.adminUpdateHoldings(portfolioId: portfolioId, payload: payload))
    }

    // PUT /admin/portfolios/{id}/toggle — flip is_active flag.
    func togglePortfolio(id: Int) async throws -> Portfolio {
        return try await APIClient.shared.request(.adminTogglePortfolio(id: id))
    }

    // DELETE /admin/portfolios/{portfolioId}/users/{userId} — remove user from portfolio.
    func removeUserFromPortfolio(portfolioId: Int, userId: Int) async throws {
        let _: EmptyResponse = try await APIClient.shared.request(.adminRemoveUserFromPortfolio(portfolioId: portfolioId, userId: userId))
    }

    // GET /admin/logs — paginated error log entries.
    func fetchErrorLogs(page: Int, pageSize: Int) async throws -> [AdminErrorLog] {
        return try await APIClient.shared.request(.adminErrorLogs(page: page, pageSize: pageSize))
    }

    // GET /admin/revenue — aggregated revenue summary from subscriptions table.
    func fetchRevenue() async throws -> AdminRevenueSummary {
        return try await APIClient.shared.request(.adminRevenue)
    }

    // GET /admin/changelog — paginated audit changelog.
    func fetchChangelog(page: Int, pageSize: Int) async throws -> [AdminChangeEntry] {
        return try await APIClient.shared.request(.adminChangelog(page: page, pageSize: pageSize))
    }
}
