export interface AuthToken {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  email: string;
  username: string;
  password: string;
  display_name?: string;
}

export interface RefreshPayload {
  refresh_token: string;
}

export interface ChangePasswordPayload {
  current_password: string;
  new_password: string;
}

export interface ForgotPasswordPayload {
  email: string;
}

export interface ResetPasswordPayload {
  email: string;
  token: string;
  new_password: string;
}

export interface RequestOtpPayload {
  purpose: 'login_2fa';
}

export interface VerifyOtpPayload {
  otp: string;
  purpose: 'login_2fa' | 'password_reset';
}
