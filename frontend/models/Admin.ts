export interface ChangeLogEntry {
  id: number;
  actor_id: number;
  entity_type: string;
  entity_id: number;
  action: string;
  detail: string | null;
  created_at: string;
}

export interface PaginatedChangelog {
  entries: ChangeLogEntry[];
  total: number;
  page: number;
  page_size: number;
}

export interface AdminUserUpdate {
  role?: string;
  is_active?: boolean;
  subscription_exempt?: boolean;
}

export interface PaginatedUsers {
  users: import('./User').User[];
  total: number;
  page: number;
  page_size: number;
}

export interface ErrorLog {
  id: string;
  timestamp: string;
  level: string;
  message: string;
  detail: string | null;
}

export interface PaginatedLogs {
  logs: ErrorLog[];
  total: number;
  page: number;
  page_size: number;
}

export interface RevenueStats {
  total_revenue: string;
  monthly_revenue: string;
  active_subscriptions: number;
  plan_breakdown: Record<string, number>;
}
