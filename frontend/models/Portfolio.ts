export interface PortfolioHolding {
  id: number;
  ticker: string;
  target_pct: string;
}

export interface Portfolio {
  id: number;
  name: string;
  description: string | null;
  is_active: boolean;
  total_return_pct: string | null;
  holdings: PortfolioHolding[];
  created_at: string;
}

export interface CreatePortfolioPayload {
  name: string;
  description?: string;
}

export interface UpdatePortfolioPayload {
  name?: string;
  description?: string;
}

export interface UpdateHoldingsPayload {
  holdings: { ticker: string; target_pct: string }[];
}

export interface JoinPortfolioPayload {
  portfolio_id: number;
}

export interface PaginatedPortfolios {
  portfolios: Portfolio[];
  total: number;
  page: number;
  page_size: number;
}
