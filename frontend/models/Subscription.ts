export type SubscriptionPlan = 'monthly' | 'annual' | 'lifetime';
export type SubscriptionStatus = 'active' | 'expired' | 'cancelled' | 'grace_period';

export interface Subscription {
  id: number;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  apple_transaction_id: string;
  amount_paid: string;
  currency: string;
  expires_at: string | null;
  created_at: string;
}

export interface VerifyApplePayload {
  transaction_id: string;
  product_id: string;
}

export type BillingEventType =
  | 'payment_success'
  | 'payment_failed'
  | 'renewal'
  | 'refund'
  | 'cancellation';

export interface BillingEvent {
  id: number;
  event_type: BillingEventType;
  amount: string;
  currency: string;
  apple_transaction_id: string | null;
  occurred_at: string;
}

export interface PaginatedBillingHistoryResponse {
  events: BillingEvent[];
  total: number;
  page: number;
  page_size: number;
}
