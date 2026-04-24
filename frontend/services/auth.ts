import apiClient from '@/services/api/client';
import { endpoints } from '@/services/api/endpoints';
import { saveTokens, clearTokens } from '@/services/keychain';
import {
  AuthToken,
  LoginPayload,
  RegisterPayload,
  ChangePasswordPayload,
  ForgotPasswordPayload,
  ResetPasswordPayload,
  RequestOtpPayload,
  VerifyOtpPayload,
} from '@/models/AuthToken';

export async function login(payload: LoginPayload): Promise<AuthToken> {
  const { data } = await apiClient.post<AuthToken>(endpoints.login(), payload);
  await saveTokens(data.access_token, data.refresh_token);
  return data;
}

export async function register(payload: RegisterPayload): Promise<AuthToken> {
  const { data } = await apiClient.post<AuthToken>(endpoints.register(), payload);
  await saveTokens(data.access_token, data.refresh_token);
  return data;
}

export async function logout(): Promise<void> {
  await apiClient.delete(endpoints.logout());
  await clearTokens();
}

export async function changePassword(payload: ChangePasswordPayload): Promise<void> {
  await apiClient.post(endpoints.changePassword(), payload);
}

export async function forgotPassword(payload: ForgotPasswordPayload): Promise<void> {
  await apiClient.post(endpoints.forgotPassword(), payload);
}

export async function resetPassword(payload: ResetPasswordPayload): Promise<void> {
  await apiClient.post(endpoints.resetPassword(), payload);
}

export async function requestOtp(payload: RequestOtpPayload): Promise<void> {
  await apiClient.post(endpoints.requestOtp(), payload);
}

export async function verifyOtp(payload: VerifyOtpPayload): Promise<void> {
  await apiClient.post(endpoints.verifyOtp(), payload);
}
