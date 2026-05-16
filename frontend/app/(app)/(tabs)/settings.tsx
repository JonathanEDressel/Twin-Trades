import React, { useState } from 'react';
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
import { useMutation } from '@tanstack/react-query';
import { logout } from '@/services/auth';
import { disconnectIAP } from '@/services/iap';
import { useAuthStore } from '@/stores/authStore';
import { clearTokens } from '@/services/keychain';
import { LoadingOverlay } from '@/components/ui/LoadingOverlay';
import { Toast } from '@/components/ui/Toast';
import { colors, spacing, typography, radius, shadow } from '@/helpers/designTokens';

type SectionRow = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  adminOnly?: boolean;
};

function UserAvatar({ name, email }: { name: string; email: string }) {
  const initials = name.charAt(0).toUpperCase();
  return (
    <View style={avatarStyles.container}>
      <View style={avatarStyles.circle}>
        <Text style={avatarStyles.initials}>{initials}</Text>
      </View>
      <Text style={avatarStyles.name}>{name}</Text>
      <Text style={avatarStyles.email}>{email}</Text>
    </View>
  );
}

function MenuRow({ icon, label, onPress }: { icon: keyof typeof Ionicons.glyphMap; label: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={menuStyles.row} onPress={onPress} activeOpacity={0.75}>
      <View style={menuStyles.iconWrap}>
        <Ionicons name={icon} size={20} color={colors.accent} />
      </View>
      <Text style={menuStyles.label}>{label}</Text>
      <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
    </TouchableOpacity>
  );
}

export default function SettingsScreen() {
  const { user, clearAuth } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; variant: 'error' | 'success' } | null>(null);

  const isAdmin = user?.role === 'admin' || user?.role === 'ultimate_admin';
  const displayName = user?.display_name ?? user?.username ?? '';

  async function handleLogout() {
    setLoading(true);
    try {
      await logout();
    } finally {
      await disconnectIAP();
      clearAuth();
      setLoading(false);
      router.replace('/(auth)/login');
    }
  }

  const sections: SectionRow[] = [
    {
      icon: 'person-circle-outline',
      label: 'Profile',
      onPress: () => router.push('/(app)/settings/profile'),
    },
    {
      icon: 'card-outline',
      label: 'Subscription',
      onPress: () => router.push('/(app)/settings/subscription'),
    },
    {
      icon: 'link-outline',
      label: 'Brokerage Connections',
      onPress: () => router.push('/(app)/settings/brokerages'),
    },
    {
      icon: 'shield-checkmark-outline',
      label: 'Admin Dashboard',
      onPress: () => router.push('/(app)/admin'),
      adminOnly: true,
    },
    {
      icon: 'trash-outline',
      label: 'Account',
      onPress: () => router.push('/(app)/settings/account'),
    },
  ];

  const visibleSections = sections.filter((s) => !s.adminOnly || isAdmin);

  return (
    <SafeAreaView style={styles.safe}>
      {loading && <LoadingOverlay />}
      <ScrollView contentContainerStyle={styles.scroll}>
        <UserAvatar name={displayName} email={user?.email ?? ''} />

        <View style={styles.card}>
          {visibleSections.map((s, i) => (
            <View key={s.label}>
              <MenuRow icon={s.icon} label={s.label} onPress={s.onPress} />
              {i < visibleSections.length - 1 && <View style={styles.divider} />}
            </View>
          ))}
        </View>

        <TouchableOpacity style={styles.signOutBtn} onPress={handleLogout} activeOpacity={0.8}>
          <Ionicons name="log-out-outline" size={20} color={colors.danger} />
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>

      {toast && (
        <Toast
          message={toast.message}
          variant={toast.variant}
          visible
          onHide={() => setToast(null)}
        />
      )}
    </SafeAreaView>
  );
}

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
  divider: { height: 1, backgroundColor: colors.border, marginLeft: 56 },
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.lg,
    paddingVertical: spacing.sm + 4,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.danger + '44',
    backgroundColor: colors.danger + '10',
  },
  signOutText: { ...typography.headline, color: colors.danger },
});

const avatarStyles = StyleSheet.create({
  container: { alignItems: 'center', paddingVertical: spacing.lg, marginBottom: spacing.md },
  circle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.accent + '22',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  initials: { fontSize: 32, fontWeight: '700', color: colors.accent },
  name: { ...typography.headline, color: colors.textPrimary },
  email: { ...typography.caption, color: colors.textMuted, marginTop: 2 },
});

const menuStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: colors.accent + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  label: { flex: 1, ...typography.body, color: colors.textPrimary },
});
