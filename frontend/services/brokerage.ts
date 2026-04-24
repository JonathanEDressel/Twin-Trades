import apiClient from '@/services/api/client';
import { endpoints } from '@/services/api/endpoints';
import {
  BrokerageConnection,
  OAuthInitiateResponse,
  OAuthCallbackPayload,
} from '@/models/Brokerage';

export async function fetchBrokerageConnections(): Promise<BrokerageConnection[]> {
  const { data } = await apiClient.get<BrokerageConnection[]>(endpoints.brokerageConnections());
  return data;
}

export async function initiateOAuth(slug: string): Promise<OAuthInitiateResponse> {
  const { data } = await apiClient.post<OAuthInitiateResponse>(endpoints.initiateOAuth(slug), {
    brokerage_slug: slug,
  });
  return data;
}

export async function handleOAuthCallback(
  payload: OAuthCallbackPayload
): Promise<BrokerageConnection> {
  const { data } = await apiClient.post<BrokerageConnection>(endpoints.oauthCallback(), payload);
  return data;
}

export async function disconnectBrokerage(id: number): Promise<void> {
  await apiClient.delete(endpoints.disconnectBrokerage(id));
}
