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
  username?: string;
  email?: string;
  display_name?: string;
  password?: string;
}

export interface AdminUser {
  id: number;
  email: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  role: import('./User').UserRole;
  is_active: boolean;
  subscription_exempt: boolean;
  created_at: string;
  subscription_status: string | null;
  subscription_plan: string | null;
  portfolio_count: number;
  invested_amount: string;
}

export interface PaginatedUsers {
  users: AdminUser[];
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
