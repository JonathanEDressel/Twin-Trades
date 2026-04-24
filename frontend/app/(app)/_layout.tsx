import { Stack } from 'expo-router';
import { colors } from '@/helpers/designTokens';

export default function AppLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.primary },
      }}
    />
  );
}
