export type TradeAction = 'buy' | 'sell';
export type TradeStatus = 'pending' | 'filled' | 'cancelled' | 'failed';

export interface Trade {
  id: number;
  ticker: string;
  action: TradeAction;
  quantity: string;
  price: string | null;
  status: TradeStatus;
  broker_order_id: string | null;
  executed_at: string | null;
  created_at: string;
}

export interface TradeHistoryResponse {
  trades: Trade[];
  total: number;
  page: number;
  page_size: number;
}
