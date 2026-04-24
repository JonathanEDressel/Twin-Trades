export interface BrokerageConnection {
  id: number;
  brokerage_slug: string;
  account_id: string | null;
  is_active: boolean;
  token_expires_at: string | null;
  created_at: string;
}

export interface OAuthInitiateResponse {
  auth_url: string;
  state: string;
}

export interface OAuthCallbackPayload {
  code: string;
  state: string;
  brokerage_slug: string;
}
