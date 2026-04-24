import { Stack } from 'expo-router';
import { colors } from '@/helpers/designTokens';

export default function AdminLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.primary },
      }}
    />
  );
}
