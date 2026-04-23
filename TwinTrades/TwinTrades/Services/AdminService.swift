import Foundation

// AdminService provides admin-only API operations gated behind role checks.
// All methods require the caller to have role == .admin or .ultimate_admin.
// Views and ViewModels must verify user.role before invoking these methods.
actor AdminService {
    static let shared = AdminService()
    private init() {}

    // Fetch a paginated list of all users with account metadata.
    // Returns users sorted by created_at descending.
    // Includes sensitive fields (role, subscription_exempt) visible only to admins.
    func fetchUsers(page: Int = 1, pageSize: Int = 20) async throws -> [User] {
        return try await APIClient.shared.request(.adminUsers(page: page, pageSize: pageSize))
    }

    // Update mutable fields on any user account (role, active status, subscription_exempt).
    // Changes are logged to the change_log table with the admin's user_id and request_id.
    // The payload is a raw Data object to allow partial updates with arbitrary fields.
    func updateUser(id: Int, payload: Data) async throws -> User {
        return try await APIClient.shared.request(.adminUpdateUser(id: id, payload: payload))
    }

    // Permanently delete a user account; archives brokerage tokens and sells open positions.
    // Only ultimate_admin may delete other admins; regular admins cannot delete each other.
    // This action is logged to change_log and is irreversible.
    func deleteUser(id: Int) async throws {
        let _: EmptyResponse = try await APIClient.shared.request(.adminDeleteUser(id: id))
    }

    // Create a new portfolio with an initial name and optional description.
    // The portfolio starts inactive; toggle it after adding holdings.
    // Returns the newly created Portfolio with an empty holdings array.
    func createPortfolio(_ payload: CreatePortfolioPayload) async throws -> Portfolio {
        return try await APIClient.shared.request(.adminCreatePortfolio(payload))
    }

    // Update portfolio metadata (name, description) for an existing portfolio.
    // Changes are logged to change_log; holding updates use a separate endpoint.
    // The payload is raw Data to allow partial field updates.
    func updatePortfolio(id: Int, payload: Data) async throws -> Portfolio {
        return try await APIClient.shared.request(.adminUpdatePortfolio(id: id, payload: payload))
    }

    // Delete a portfolio; removes all user_portfolios rows and sells member positions.
    // Cannot be undone; all members are notified via push and email before deletion.
    // Logged to change_log with the admin's user_id and a generated request_id.
    func deletePortfolio(id: Int) async throws {
        let _: EmptyResponse = try await APIClient.shared.request(.adminDeletePortfolio(id: id))
    }

    // Replace all holdings for a portfolio with the provided ticker/weight array.
    // Weights must sum to 100%; the server validates and rejects mismatched totals.
    // Triggers a rebalance event for all active members after update.
    func updateHoldings(portfolioId: Int, holdings: [[String: String]]) async throws {
        let payload = UpdateHoldingsPayload(holdings: holdings)
        let _: EmptyResponse = try await APIClient.shared.request(.adminUpdateHoldings(portfolioId: portfolioId, payload: payload))
    }

    // Toggle the is_active flag on a portfolio, making it visible or hidden on the marketplace.
    // Deactivating a portfolio does not remove existing members or sell positions.
    // Returns the updated Portfolio with the new is_active value.
    func togglePortfolioActive(id: Int) async throws -> Portfolio {
        return try await APIClient.shared.request(.adminTogglePortfolio(id: id))
    }

    // Remove a specific user from a portfolio, closing their synced positions.
    // The user is notified by push notification and email on removal.
    // Logs the action to change_log with request_id for audit trail.
    func removeUserFromPortfolio(portfolioId: Int, userId: Int) async throws {
        let _: EmptyResponse = try await APIClient.shared.request(.adminRemoveUserFromPortfolio(portfolioId: portfolioId, userId: userId))
    }

    // Fetch server error logs paginated for the admin error log screen.
    // Each log entry includes endpoint, message, stack trace, and offending user_id.
    // Sorted by created_at descending; most recent errors first.
    func fetchErrorLogs(page: Int = 1, pageSize: Int = 20) async throws -> [AdminErrorLog] {
        return try await APIClient.shared.request(.adminErrorLogs(page: page, pageSize: pageSize))
    }

    // Fetch aggregated revenue data from the local subscriptions table.
    // No live App Store API calls are made; data reflects processed webhook events.
    // Returns totals grouped by plan type for the revenue dashboard.
    func fetchRevenue() async throws -> AdminRevenueSummary {
        return try await APIClient.shared.request(.adminRevenue)
    }

    // Fetch the audit change log paginated for the admin changelog screen.
    // Each entry records who changed what, when, and with which request_id.
    // The change_log table is insert-only; entries are never modified or deleted.
    func fetchChangelog(page: Int = 1, pageSize: Int = 20) async throws -> [AdminChangeEntry] {
        return try await APIClient.shared.request(.adminChangelog(page: page, pageSize: pageSize))
    }
}

// MARK: - Admin Response Models

struct AdminErrorLog: Codable, Identifiable {
    let id: Int
    let userId: Int?
    let endpoint: String
    let message: String
    let stackTrace: String?
    let ipAddress: String?
    let createdAt: Date

    enum CodingKeys: String, CodingKey {
        case id, endpoint, message
        case userId = "user_id"
        case stackTrace = "stack_trace"
        case ipAddress = "ip_address"
        case createdAt = "created_at"
    }
}

struct AdminRevenueSummary: Codable {
    let totalRevenue: Decimal
    let monthlyCount: Int
    let annualCount: Int
    let lifetimeCount: Int

    enum CodingKeys: String, CodingKey {
        case totalRevenue = "total_revenue"
        case monthlyCount = "monthly_count"
        case annualCount = "annual_count"
        case lifetimeCount = "lifetime_count"
    }
}

struct AdminChangeEntry: Codable, Identifiable {
    let id: Int
    let adminId: Int
    let entityType: String
    let entityId: Int?
    let action: String
    let diff: String?
    let requestId: String
    let createdAt: Date

    enum CodingKeys: String, CodingKey {
        case id, action, diff
        case adminId = "admin_id"
        case entityType = "entity_type"
        case entityId = "entity_id"
        case requestId = "request_id"
        case createdAt = "created_at"
    }
}
