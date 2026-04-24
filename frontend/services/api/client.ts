import axios, { AxiosInstance, AxiosRequestConfig, InternalAxiosRequestConfig } from 'axios';
import { ApiError } from './errors';
import { getAccessToken, getRefreshToken, saveTokens, clearTokens } from '@/services/keychain';
import { AuthToken } from '@/models/AuthToken';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8000';

let isRefreshing = false;
let refreshSubscribers: Array<(token: string) => void> = [];

function subscribeTokenRefresh(cb: (token: string) => void) {
  refreshSubscribers.push(cb);
}

function onRefreshed(token: string) {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
}

const apiClient: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
  timeout: 15000,
});

// Attach access token to every request
apiClient.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  const token = await getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 → refresh → retry
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest: AxiosRequestConfig & { _retry?: boolean } = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      if (isRefreshing) {
        // Queue until refresh completes
        return new Promise((resolve) => {
          subscribeTokenRefresh((newToken) => {
            if (originalRequest.headers) {
              originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
            }
            resolve(apiClient(originalRequest));
          });
        });
      }

      isRefreshing = true;
      try {
        const refreshToken = await getRefreshToken();
        if (!refreshToken) {
          await clearTokens();
          throw new ApiError('TOKEN_MISSING', 'Session expired. Please log in again.');
        }

        const { data } = await axios.post<AuthToken>(`${BASE_URL}/auth/refresh`, {
          refresh_token: refreshToken,
        });

        await saveTokens(data.access_token, data.refresh_token);
        onRefreshed(data.access_token);

        if (originalRequest.headers) {
          originalRequest.headers['Authorization'] = `Bearer ${data.access_token}`;
        }
        return apiClient(originalRequest);
      } catch {
        await clearTokens();
        throw new ApiError('UNAUTHORIZED', 'Session expired. Please log in again.');
      } finally {
        isRefreshing = false;
      }
    }

    if (error.response) {
      throw ApiError.fromResponse(error.response.status, error.response.data);
    }
    if (error.request) {
      throw new ApiError('NETWORK_ERROR', 'Network error. Check your connection.');
    }
    throw new ApiError('SERVER_ERROR', error.message ?? 'An unexpected error occurred.');
  }
);

export default apiClient;
