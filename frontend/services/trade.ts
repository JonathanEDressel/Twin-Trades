import apiClient from '@/services/api/client';
import { endpoints } from '@/services/api/endpoints';
import { TradeHistoryResponse } from '@/models/Trade';

export async function fetchTradeHistory(
  page = 1,
  pageSize = 20
): Promise<TradeHistoryResponse> {
  const { data } = await apiClient.get<TradeHistoryResponse>(
    endpoints.tradeHistory(page, pageSize)
  );
  return data;
}
