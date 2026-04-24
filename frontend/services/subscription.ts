import apiClient from '@/services/api/client';
import { endpoints } from '@/services/api/endpoints';
import { Subscription, VerifyApplePayload } from '@/models/Subscription';

export async function fetchSubscriptionStatus(): Promise<Subscription | null> {
  const { data } = await apiClient.get<Subscription | null>(endpoints.subscriptionStatus());
  return data;
}

export async function verifyApplePurchase(payload: VerifyApplePayload): Promise<Subscription> {
  const { data } = await apiClient.post<Subscription>(endpoints.verifyApple(), payload);
  return data;
}
