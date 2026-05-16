export interface PortfolioHolding {
  id: number;
  ticker: string;
  target_pct: string;
}

export interface PortfolioHoldingHistory {
  id: number;
  ticker: string;
  change_type: 'added' | 'removed' | 'changed';
  target_pct: string;
  old_target_pct: string | null;
  changed_at: string;
}

export interface Portfolio {
  id: number;
  name: string;
  description: string | null;
  icon_url: string | null;
  is_active: boolean;
  total_return_pct: string | null;
  return_1w: string | null;
  return_1m: string | null;
  return_3m: string | null;
  return_6m: string | null;
  return_1y: string | null;
  return_3y: string | null;
  holdings: PortfolioHolding[];
  created_at: string;
  user_count?: number;
}

export interface AdminPortfolio extends Portfolio {
  holding_history: PortfolioHoldingHistory[];
  user_count: number;
  total_invested: string;
}

export interface CreatePortfolioPayload {
  name: string;
  description?: string;
  icon_url?: string;
}

export interface UpdatePortfolioPayload {
  name?: string;
  description?: string;
  icon_url?: string;
}

export interface UpdateHoldingsPayload {
  holdings: { ticker: string; target_pct: string }[];
}

export interface JoinPortfolioPayload {
  portfolio_id: number;
  brokerage_connection_id?: number;
  investment_amount?: number;
}

export interface PaginatedPortfolios {
  portfolios: Portfolio[];
  total: number;
  page: number;
  page_size: number;
}

export interface PaginatedAdminPortfolios {
  portfolios: AdminPortfolio[];
  total: number;
  page: number;
  page_size: number;
}
