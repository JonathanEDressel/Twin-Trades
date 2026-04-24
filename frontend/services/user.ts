import apiClient from '@/services/api/client';
import { endpoints } from '@/services/api/endpoints';
import { User, UserUpdatePayload } from '@/models/User';

export async function fetchMe(): Promise<User> {
  const { data } = await apiClient.get<User>(endpoints.me());
  console.log('Fetched user data:', data);
  return data;
}

export async function updateMe(payload: UserUpdatePayload): Promise<User> {
  const { data } = await apiClient.patch<User>(endpoints.me(), payload);
  return data;
}

export async function deleteMe(): Promise<void> {
  await apiClient.delete(endpoints.me());
}
