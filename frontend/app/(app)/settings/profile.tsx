import React from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/stores/authStore';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { colors, spacing, typography, radius, shadow } from '@/helpers/designTokens';

function ScreenHeader({ title }: { title: string }) {
  return (
    <View style={headerStyles.row}>
      <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
        <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
      </TouchableOpacity>
      <Text style={headerStyles.title}>{title}</Text>
      <View style={{ width: 24 }} />
    </View>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

export default function ProfileScreen() {
  const { user } = useAuthStore();

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <ScreenHeader title="Profile" />

        <View style={styles.card}>
          <InfoRow label="Email" value={user?.email ?? ''} />
          <View style={styles.divider} />
          <InfoRow label="Username" value={`@${user?.username ?? ''}`} />
          {user?.display_name && (
            <>
              <View style={styles.divider} />
              <InfoRow label="Display Name" value={user.display_name} />
            </>
          )}
        </View>

        <PrimaryButton
          title="Change Password"
          variant="ghost"
          onPress={() => router.push('/change-password')}
          style={styles.btn}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const headerStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  title: { ...typography.headline, color: colors.textPrimary },
});

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.primary },
  scroll: { padding: spacing.md, paddingBottom: spacing.xl },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    ...shadow.card,
  },
  infoRow: {
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.md,
  },
  label: { ...typography.caption, color: colors.textMuted },
  value: { ...typography.body, color: colors.textPrimary, marginTop: 2 },
  divider: { height: 1, backgroundColor: colors.border },
  btn: { marginTop: spacing.md },
});
