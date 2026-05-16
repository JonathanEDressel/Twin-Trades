import React from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { adminFetchRevenue as fetchRevenue } from '@/services/admin';
import { formatCurrency } from '@/helpers/formatters';
import { colors, spacing, typography, radius } from '@/helpers/designTokens';

function NavCard({
  title,
  icon,
  onPress,
}: {
  title: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.navCard} onPress={onPress} activeOpacity={0.7}>
      <Ionicons name={icon} size={32} color={colors.accent} />
      <Text style={styles.navCardTitle}>{title}</Text>
    </TouchableOpacity>
  );
}

export default function AdminDashboard() {
  const { data: revenue } = useQuery({
    queryKey: ['admin-revenue'],
    queryFn: fetchRevenue,
  });

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Admin</Text>

        {revenue && (
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>MRR</Text>
              <Text style={styles.statValue}>{formatCurrency(parseFloat(revenue.monthly_revenue))}</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Total</Text>
              <Text style={styles.statValue}>{formatCurrency(parseFloat(revenue.total_revenue))}</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Subs</Text>
              <Text style={styles.statValue}>{String(revenue.active_subscriptions)}</Text>
            </View>
          </View>
        )}

        <View style={styles.navGrid}>
          <NavCard title="Users" icon="people" onPress={() => router.push('/(app)/admin/users')} />
          <NavCard title="Portfolios" icon="briefcase" onPress={() => router.push('/(app)/admin/portfolios')} />
          <NavCard title="Change Logs" icon="time" onPress={() => router.push('/(app)/admin/changelog')} />
          <NavCard title="Error Logs" icon="warning" onPress={() => router.push('/(app)/admin/logs')} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.primary },
  scroll: { padding: spacing.md },
  title: { ...typography.title, color: colors.textPrimary, marginBottom: spacing.md },
  statsRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    alignItems: 'center',
  },
  statLabel: { ...typography.caption, color: colors.textMuted },
  statValue: { ...typography.headline, color: colors.accent, marginTop: spacing.xs },
  navGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  navCard: {
    width: '47.5%',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.lg,
    alignItems: 'center',
    gap: spacing.sm,
  },
  navCardTitle: { ...typography.caption, color: colors.textPrimary, fontWeight: '600' },
});
