import apiClient from '@/services/api/client';
import { endpoints } from '@/services/api/endpoints';
import { User } from '@/models/User';
import {
  AdminUserUpdate,
  PaginatedUsers,
  PaginatedChangelog,
  PaginatedLogs,
  RevenueStats,
} from '@/models/Admin';
import {
  AdminPortfolio,
  CreatePortfolioPayload,
  UpdatePortfolioPayload,
  UpdateHoldingsPayload,
  PaginatedAdminPortfolios,
} from '@/models/Portfolio';

export async function adminFetchUsers(page = 1, pageSize = 20, search?: string, sortBy = 'created_at', sortOrder = 'desc'): Promise<PaginatedUsers> {
  const { data } = await apiClient.get<PaginatedUsers>(endpoints.adminUsers(page, pageSize, search, sortBy, sortOrder));
  return data;
}

export async function adminUpdateUser(id: number, payload: AdminUserUpdate): Promise<User> {
  const { data } = await apiClient.patch<User>(endpoints.adminUser(id), payload);
  return data;
}

export async function adminDeleteUser(id: number): Promise<void> {
  await apiClient.delete(endpoints.adminUser(id));
}

export async function adminFetchPortfolios(page = 1, pageSize = 20): Promise<PaginatedAdminPortfolios> {
  const { data } = await apiClient.get<PaginatedAdminPortfolios>(endpoints.adminPortfolios(), {
    params: { page, page_size: pageSize },
  });
  return data;
}

export async function adminFetchPortfolio(id: number): Promise<AdminPortfolio> {
  const { data } = await apiClient.get<AdminPortfolio>(endpoints.adminPortfolio(id));
  return data;
}

export async function adminCreatePortfolio(payload: CreatePortfolioPayload): Promise<AdminPortfolio> {
  const { data } = await apiClient.post<AdminPortfolio>(endpoints.adminPortfolios(), payload);
  return data;
}

export async function adminUpdatePortfolio(
  id: number,
  payload: UpdatePortfolioPayload
): Promise<AdminPortfolio> {
  const { data } = await apiClient.patch<AdminPortfolio>(endpoints.adminPortfolio(id), payload);
  return data;
}

export async function adminDeletePortfolio(id: number): Promise<void> {
  await apiClient.delete(endpoints.adminPortfolio(id));
}

export async function adminUpdateHoldings(
  portfolioId: number,
  payload: UpdateHoldingsPayload
): Promise<AdminPortfolio> {
  const { data } = await apiClient.put<AdminPortfolio>(
    endpoints.adminPortfolioHoldings(portfolioId),
    payload
  );
  return data;
}

export async function adminTogglePortfolio(id: number): Promise<AdminPortfolio> {
  const { data } = await apiClient.patch<AdminPortfolio>(endpoints.adminPortfolioToggle(id));
  return data;
}

export async function adminRemoveUserFromPortfolio(
  portfolioId: number,
  userId: number
): Promise<void> {
  await apiClient.delete(endpoints.adminRemoveUserFromPortfolio(portfolioId, userId));
}

export async function adminFetchRevenue(): Promise<RevenueStats> {
  const { data } = await apiClient.get<RevenueStats>(endpoints.adminRevenue());
  return data;
}

export async function adminFetchChangelog(
  page = 1,
  pageSize = 20
): Promise<PaginatedChangelog> {
  const { data } = await apiClient.get<PaginatedChangelog>(
    endpoints.adminChangelog(page, pageSize)
  );
  return data;
}

export async function adminFetchLogs(page = 1, pageSize = 50): Promise<PaginatedLogs> {
  const { data } = await apiClient.get<PaginatedLogs>(endpoints.adminLogs(page, pageSize));
  return data;
}
