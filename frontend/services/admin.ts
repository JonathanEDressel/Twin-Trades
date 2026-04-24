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
  Portfolio,
  CreatePortfolioPayload,
  UpdatePortfolioPayload,
  UpdateHoldingsPayload,
} from '@/models/Portfolio';

export async function adminFetchUsers(page = 1, pageSize = 20): Promise<PaginatedUsers> {
  const { data } = await apiClient.get<PaginatedUsers>(endpoints.adminUsers(page, pageSize));
  return data;
}

export async function adminUpdateUser(id: number, payload: AdminUserUpdate): Promise<User> {
  const { data } = await apiClient.patch<User>(endpoints.adminUser(id), payload);
  return data;
}

export async function adminDeleteUser(id: number): Promise<void> {
  await apiClient.delete(endpoints.adminUser(id));
}

export async function adminCreatePortfolio(payload: CreatePortfolioPayload): Promise<Portfolio> {
  const { data } = await apiClient.post<Portfolio>(endpoints.adminPortfolios(), payload);
  return data;
}

export async function adminUpdatePortfolio(
  id: number,
  payload: UpdatePortfolioPayload
): Promise<Portfolio> {
  const { data } = await apiClient.patch<Portfolio>(endpoints.adminPortfolio(id), payload);
  return data;
}

export async function adminDeletePortfolio(id: number): Promise<void> {
  await apiClient.delete(endpoints.adminPortfolio(id));
}

export async function adminUpdateHoldings(
  portfolioId: number,
  payload: UpdateHoldingsPayload
): Promise<Portfolio> {
  const { data } = await apiClient.put<Portfolio>(
    endpoints.adminPortfolioHoldings(portfolioId),
    payload
  );
  return data;
}

export async function adminTogglePortfolio(id: number): Promise<Portfolio> {
  const { data } = await apiClient.patch<Portfolio>(endpoints.adminPortfolioToggle(id));
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
