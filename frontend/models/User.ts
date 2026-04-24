export type UserRole = 'user' | 'admin' | 'ultimate_admin';
export type RebalanceConfirmation = 'push' | 'email' | 'sms';

export interface User {
  id: number;
  email: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  role: UserRole;
  rebalance_confirmation: RebalanceConfirmation;
  is_active: boolean;
  created_at: string;
}

export interface UserUpdatePayload {
  display_name?: string;
  avatar_url?: string;
  rebalance_confirmation?: RebalanceConfirmation;
  phone_number?: string;
  apns_device_token?: string;
}
