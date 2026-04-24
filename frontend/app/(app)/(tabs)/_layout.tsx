import { Tabs } from 'expo-router';
import { colors } from '@/helpers/designTokens';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
        },
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textMuted,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: 'Dashboard', tabBarLabel: 'Dashboard' }}
      />
      <Tabs.Screen
        name="marketplace"
        options={{ title: 'Marketplace', tabBarLabel: 'Explore' }}
      />
      <Tabs.Screen
        name="trades"
        options={{ title: 'Trades', tabBarLabel: 'Trades' }}
      />
      <Tabs.Screen
        name="settings"
        options={{ title: 'Settings', tabBarLabel: 'Settings' }}
      />
    </Tabs>
  );
}
