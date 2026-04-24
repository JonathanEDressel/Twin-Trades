import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { updateMe } from '@/services/user';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function requestPushPermission(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

export async function registerDeviceToken(): Promise<void> {
  if (Platform.OS === 'web') return;
  const token = await Notifications.getExpoPushTokenAsync();
  if (token?.data) {
    await updateMe({ apns_device_token: token.data });
  }
}

export type DeepLinkHandler = (url: string) => void;

export function parseDeepLink(data: Record<string, unknown>): string | null {
  if (typeof data['deep_link'] === 'string') return data['deep_link'];
  return null;
}
