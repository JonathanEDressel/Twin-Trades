import apiClient from '@/services/api/client';
import { endpoints } from '@/services/api/endpoints';
import {
  Portfolio,
  CreatePortfolioPayload,
  JoinPortfolioPayload,
  PaginatedPortfolios,
} from '@/models/Portfolio';
import { PendingRebalance, ConfirmRebalanceResponse } from '@/models/RebalanceEvent';

export async function fetchMyPortfolios(): Promise<Portfolio[]> {
  const { data } = await apiClient.get<Portfolio[]>(endpoints.myPortfolios());
  return data;
}

export async function fetchMarketplace(page = 1, pageSize = 20): Promise<PaginatedPortfolios> {
  const { data } = await apiClient.get<PaginatedPortfolios>(
    `${endpoints.marketplace()}?page=${page}&page_size=${pageSize}`
  );
  return data;
}

export async function fetchPortfolioDetail(id: number): Promise<Portfolio> {
  const { data } = await apiClient.get<Portfolio>(endpoints.portfolioDetail(id));
  return data;
}

export async function joinPortfolio(payload: JoinPortfolioPayload): Promise<void> {
  await apiClient.post(endpoints.joinPortfolio(), payload);
}

export async function leavePortfolio(portfolioId: number): Promise<void> {
  await apiClient.delete(endpoints.leavePortfolio(portfolioId));
}

export async function fetchPendingRebalances(): Promise<PendingRebalance[]> {
  const { data } = await apiClient.get<PendingRebalance[]>(endpoints.pendingRebalances());
  return data;
}

export async function confirmRebalance(eventId: number): Promise<ConfirmRebalanceResponse> {
  const { data } = await apiClient.post<ConfirmRebalanceResponse>(
    endpoints.confirmRebalance(eventId)
  );
  return data;
}

export async function rejectRebalance(eventId: number): Promise<void> {
  await apiClient.post(endpoints.rejectRebalance(eventId));
}
