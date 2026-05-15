import React from 'react';
import {
  ActivityIndicator,
  FlatList,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchPortfolioDetail, fetchMyPortfolios, leavePortfolio } from '@/services/portfolio';
import { PortfolioHolding } from '@/models/Portfolio';
import { Toast } from '@/components/ui/Toast';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { colors, radius, spacing, typography, shadow } from '@/helpers/designTokens';
import { formatPercent, formatDate } from '@/helpers/formatters';
import { useState } from 'react';

export default function PortfolioDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const portfolioId = Number(id);
  const qc = useQueryClient();
  const [toast, setToast] = useState<{ message: string; variant: 'error' | 'success' } | null>(null);

  const { data: portfolio, isLoading } = useQuery({
    queryKey: ['portfolio', portfolioId],
    queryFn: () => fetchPortfolioDetail(portfolioId),
    enabled: !!portfolioId,
  });

  const { data: myPortfolios = [] } = useQuery({
    queryKey: ['my-portfolios'],
    queryFn: fetchMyPortfolios,
  });

  const isFollowing = myPortfolios.some((p) => p.id === portfolioId);

  const leaveMutation = useMutation({
    mutationFn: () => leavePortfolio(portfolioId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-portfolios'] });
      qc.invalidateQueries({ queryKey: ['marketplace'] });
      qc.invalidateQueries({ queryKey: ['portfolio', portfolioId] });
      setToast({ message: 'Left portfolio.', variant: 'success' });
      setTimeout(() => router.back(), 1200);
    },
    onError: () => setToast({ message: 'Failed to leave portfolio.', variant: 'error' }),
  });

  if (isLoading || !portfolio) {
    return (
      <SafeAreaView style={styles.safe}>
        <ActivityIndicator color={colors.accent} style={{ marginTop: spacing.xl }} />
      </SafeAreaView>
    );
  }

  const returnPct = portfolio.total_return_pct ? parseFloat(portfolio.total_return_pct) : null;
  const isPositive = returnPct !== null && returnPct >= 0;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Back */}
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>

        {/* Header */}
        <Text style={styles.name}>{portfolio.name}</Text>
        {portfolio.description ? (
          <Text style={styles.description}>{portfolio.description}</Text>
        ) : null}

        {/* Stats row */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Return</Text>
            <Text
              style={[
                styles.statValue,
                { color: returnPct === null ? colors.textMuted : isPositive ? colors.success : colors.danger },
              ]}
            >
              {returnPct !== null ? formatPercent(returnPct) : '—'}
            </Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Holdings</Text>
            <Text style={styles.statValue}>{portfolio.holdings.length}</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Created</Text>
            <Text style={styles.statValue}>{formatDate(portfolio.created_at)}</Text>
          </View>
        </View>

        {/* Holdings */}
        <Text style={styles.sectionTitle}>Holdings</Text>
        {portfolio.holdings.map((h: PortfolioHolding) => (
          <View key={h.id} style={styles.holdingRow}>
            <Text style={styles.holdingTicker}>{h.ticker}</Text>
            <Text style={styles.holdingPct}>{parseFloat(h.target_pct).toFixed(1)}%</Text>
          </View>
        ))}

        {/* Leave button */}
        {isFollowing && (
          <PrimaryButton
            title="Leave Portfolio"
            variant="danger"
            loading={leaveMutation.isPending}
            onPress={() => leaveMutation.mutate()}
            style={styles.leaveBtn}
          />
        )}
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
  container: { padding: spacing.md, paddingBottom: spacing.xl },
  backBtn: { marginBottom: spacing.md },
  backText: { ...typography.body, color: colors.accent },
  name: { ...typography.title, color: colors.textPrimary, marginBottom: spacing.xs },
  description: { ...typography.body, color: colors.textMuted, marginBottom: spacing.md },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  statBox: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.sm,
    alignItems: 'center',
    ...shadow.card,
  },
  statLabel: { ...typography.caption, color: colors.textMuted, marginBottom: 2 },
  statValue: { ...typography.headline, color: colors.textPrimary },
  sectionTitle: {
    ...typography.headline,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  holdingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  holdingTicker: { ...typography.body, color: colors.textPrimary, fontWeight: '600' },
  holdingPct: { ...typography.body, color: colors.accent },
  leaveBtn: { marginTop: spacing.xl },
});
