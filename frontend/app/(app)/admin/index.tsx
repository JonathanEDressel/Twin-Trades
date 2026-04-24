import React from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { adminFetchRevenue as fetchRevenue } from '@/services/admin';
import { formatCurrency } from '@/helpers/formatters';
import { colors, spacing, typography, radius } from '@/helpers/designTokens';

function AdminCard({
  title,
  value,
  onPress,
}: {
  title: string;
  value?: string;
  onPress?: () => void;
}) {
  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <Text style={styles.cardTitle}>{title}</Text>
      {value ? <Text style={styles.cardValue}>{value}</Text> : null}
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

        <AdminCard title="Users" onPress={() => router.push('/(app)/(tabs)/admin/users')} />
        <AdminCard
          title="Portfolios"
          onPress={() => router.push('/(app)/(tabs)/admin/portfolios')}
        />
        <AdminCard title="Changelog" onPress={() => router.push('/(app)/(tabs)/admin/changelog')} />
        <AdminCard title="Error Logs" onPress={() => router.push('/(app)/(tabs)/admin/logs')} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.primary },
  scroll: { padding: spacing.md },
  title: { ...typography.title, color: colors.textPrimary, marginBottom: spacing.md },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  cardTitle: { ...typography.headline, color: colors.textPrimary },
  cardValue: { ...typography.body, color: colors.textMuted, marginTop: spacing.xs },
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
});
