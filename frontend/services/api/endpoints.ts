// Typed endpoint builders matching the FastAPI backend routes exactly.

export const endpoints = {
  // Auth
  login: () => '/auth/login',
  register: () => '/auth/register',
  refresh: () => '/auth/refresh',
  logout: () => '/auth/logout',
  requestOtp: () => '/auth/request-otp',
  verifyOtp: () => '/auth/verify-otp',
  changePassword: () => '/auth/change-password',
  forgotPassword: () => '/auth/forgot-password',
  resetPassword: () => '/auth/reset-password',

  // User
  me: () => '/users/me',

  // Portfolio
  myPortfolios: () => '/portfolios/mine',
  marketplace: () => '/portfolios/marketplace',
  portfolioDetail: (id: number) => `/portfolios/${id}`,
  joinPortfolio: () => '/portfolios/join',
  leavePortfolio: (id: number) => `/portfolios/${id}/leave`,

  // Rebalances
  pendingRebalances: () => '/rebalances/pending',
  confirmRebalance: (id: number) => `/rebalances/${id}/confirm`,
  rejectRebalance: (id: number) => `/rebalances/${id}/reject`,

  // Trades
  tradeHistory: (page: number, pageSize: number) =>
    `/trades/history?page=${page}&page_size=${pageSize}`,

  // Subscriptions
  subscriptionStatus: () => '/subscriptions/status',
  verifyApple: () => '/subscriptions/verify-apple',
  cancelSubscription: () => '/subscriptions/cancel',
  billingHistory: (page: number, pageSize: number) =>
    `/subscriptions/billing-history?page=${page}&page_size=${pageSize}`,

  // Brokerages
  availableBrokerages: () => '/brokerages/available',
  brokerageConnections: () => '/brokerages/connections',
  initiateOAuth: (slug: string) => `/brokerages/oauth/initiate`,
  oauthCallback: () => '/brokerages/oauth/callback',
  disconnectBrokerage: (id: number) => `/brokerages/connections/${id}`,

  // Admin
  adminUsers: (page: number, pageSize: number, search?: string, sortBy = 'created_at', sortOrder = 'desc') =>
    `/admin/users?page=${page}&page_size=${pageSize}&sort_by=${sortBy}&sort_order=${sortOrder}${search ? `&search=${encodeURIComponent(search)}` : ''}`,
  adminUser: (id: number) => `/admin/users/${id}`,
  adminPortfolios: () => '/admin/portfolios',
  adminPortfolio: (id: number) => `/admin/portfolios/${id}`,
  adminPortfolioHoldings: (id: number) => `/admin/portfolios/${id}/holdings`,
  adminPortfolioToggle: (id: number) => `/admin/portfolios/${id}/toggle`,
  adminRemoveUserFromPortfolio: (portfolioId: number, userId: number) =>
    `/admin/portfolios/${portfolioId}/users/${userId}`,
  adminRevenue: () => '/admin/revenue',
  adminChangelog: (page: number, pageSize: number) =>
    `/admin/changelog?page=${page}&page_size=${pageSize}`,
  adminLogs: (page: number, pageSize: number) =>
    `/admin/logs?page=${page}&page_size=${pageSize}`,
  adminUserBillingHistory: (userId: number, page: number, pageSize: number) =>
    `/admin/users/${userId}/billing-history?page=${page}&page_size=${pageSize}`,
  adminCancelSubscription: (userId: number) =>
    `/admin/users/${userId}/subscription/cancel`,
} as const;
