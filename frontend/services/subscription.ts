import apiClient from '@/services/api/client';
import { endpoints } from '@/services/api/endpoints';
import { Subscription, VerifyApplePayload, PaginatedBillingHistoryResponse } from '@/models/Subscription';

export async function fetchSubscriptionStatus(): Promise<Subscription | null> {
  const { data } = await apiClient.get<Subscription | null>(endpoints.subscriptionStatus());
  return data;
}

export async function verifyApplePurchase(payload: VerifyApplePayload): Promise<Subscription> {
  const { data } = await apiClient.post<Subscription>(endpoints.verifyApple(), payload);
  return data;
}

export async function cancelSubscription(): Promise<Subscription> {
  const { data } = await apiClient.post<Subscription>(endpoints.cancelSubscription());
  return data;
}

export async function fetchBillingHistory(
  page = 1,
  pageSize = 20,
): Promise<PaginatedBillingHistoryResponse> {
  const { data } = await apiClient.get<PaginatedBillingHistoryResponse>(
    endpoints.billingHistory(page, pageSize),
  );
  return data;
}
