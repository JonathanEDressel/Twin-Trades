export interface RebalanceHoldingSnapshot {
  ticker: string;
  target_pct: string;
}

export interface PendingRebalance {
  id: number;
  portfolio_id: number;
  deep_link: string | null;
  expires_at: string;
  holdings: RebalanceHoldingSnapshot[];
  created_at: string;
}

export interface ConfirmRebalanceResponse {
  event_id: number;
  status: string;
  message: string;
}
