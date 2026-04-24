import { useEffect } from 'react';
import { Stack, router } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/authStore';
import { getAccessToken } from '@/services/keychain';
import { fetchMe } from '@/services/user';
import { requestPushPermission, registerDeviceToken } from '@/services/push';
import { colors } from '@/helpers/designTokens';
import * as Linking from 'expo-linking';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
});

export default function RootLayout() {
  const { isAuthenticated, isForceChangePassword, setUser, clearAuth } = useAuthStore();

  useEffect(() => {
    resolveInitialRoot();
  }, []);

  // Deep link handling
  useEffect(() => {
    const sub = Linking.addEventListener('url', ({ url }) => {
      handleDeepLink(url);
    });
    return () => sub.remove();
  }, []);

  async function resolveInitialRoot() {
    try {
      const token = await getAccessToken();
      if (!token) {
        router.replace('/(auth)/login');
        return;
      }
      const user = await fetchMe();
      setUser(user);
      await requestPushPermission();
      await registerDeviceToken();
      router.replace('/(app)/(tabs)/');
    } catch {
      clearAuth();
      router.replace('/(auth)/login');
    }
  }

  function handleDeepLink(url: string) {
    const parsed = Linking.parse(url);
    if (parsed.path?.startsWith('rebalance/')) {
      router.push('/(app)/(tabs)/');
    } else if (parsed.path?.startsWith('oauth/callback')) {
      const { code, state, slug } = parsed.queryParams as Record<string, string>;
      router.push(`/oauth/callback?code=${code}&state=${state}&slug=${slug}`);
    }
  }

  return (
    <QueryClientProvider client={queryClient}>
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.primary } }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(app)" />
        <Stack.Screen name="change-password" />
        <Stack.Screen name="oauth/callback" />
      </Stack>
    </QueryClientProvider>
  );
}
