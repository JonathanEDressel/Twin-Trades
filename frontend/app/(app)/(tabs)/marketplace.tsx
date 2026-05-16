import React, { useMemo, useState } from 'react';
import {
  FlatList,
  Image,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { fetchMarketplace, fetchMyPortfolios } from '@/services/portfolio';
import { Portfolio } from '@/models/Portfolio';
import { LoadingOverlay } from '@/components/ui/LoadingOverlay';
import { colors, spacing, typography, radius, shadow } from '@/helpers/designTokens';

type Period = '1W' | '1M' | '3M' | '6M' | '1Y';
type SortOrder = 'desc' | 'asc';

const PERIOD_KEYS: Record<Period, keyof Portfolio> = {
  '1W': 'return_1w',
  '1M': 'return_1m',
  '3M': 'return_3m',
  '6M': 'return_6m',
  '1Y': 'return_1y',
};

function getReturnForPeriod(p: Portfolio, period: Period): number {
  const key = PERIOD_KEYS[period];
  const val = p[key] as string | null;
  return val !== null ? parseFloat(val) : NaN;
}

function formatReturn(val: number): { label: string; color: string } {
  if (isNaN(val)) return { label: '—', color: colors.textMuted };
  const sign = val >= 0 ? '+' : '';
  return { label: `${sign}${val.toFixed(2)}%`, color: val >= 0 ? colors.success : colors.danger };
}

function PortfolioIcon({ portfolio }: { portfolio: Portfolio }) {
  const initials = portfolio.name.charAt(0).toUpperCase();
  if (portfolio.icon_url) {
    return <Image source={{ uri: portfolio.icon_url }} style={rowStyles.icon} />;
  }
  return (
    <View style={rowStyles.iconFallback}>
      <Text style={rowStyles.iconText}>{initials}</Text>
    </View>
  );
}

function TrendingCard({ portfolio, period, onPress }: { portfolio: Portfolio; period: Period; onPress: () => void }) {
  const ret = formatReturn(getReturnForPeriod(portfolio, period));
  const initials = portfolio.name.charAt(0).toUpperCase();
  return (
    <TouchableOpacity style={trendStyles.card} onPress={onPress} activeOpacity={0.85}>
      {portfolio.icon_url ? (
        <Image source={{ uri: portfolio.icon_url }} style={trendStyles.icon} />
      ) : (
        <View style={trendStyles.iconFallback}>
          <Text style={trendStyles.iconText}>{initials}</Text>
        </View>
      )}
      <Text style={trendStyles.name} numberOfLines={2}>{portfolio.name}</Text>
      <Text style={[trendStyles.return, { color: ret.color }]}>{ret.label}</Text>
    </TouchableOpacity>
  );
}

function ExploreRow({ portfolio, period, onPress }: { portfolio: Portfolio; period: Period; onPress: () => void }) {
  const ret = formatReturn(getReturnForPeriod(portfolio, period));
  return (
    <TouchableOpacity style={rowStyles.row} onPress={onPress} activeOpacity={0.85}>
      <PortfolioIcon portfolio={portfolio} />
      <Text style={rowStyles.name} numberOfLines={1}>{portfolio.name}</Text>
      <Text style={[rowStyles.return, { color: ret.color }]}>{ret.label}</Text>
    </TouchableOpacity>
  );
}

export default function ExploreScreen() {
  const [period, setPeriod] = useState<Period>('1M');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  const { data: myPortfolios = [] } = useQuery({
    queryKey: ['my-portfolios'],
    queryFn: fetchMyPortfolios,
  });

  const {
    data,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['marketplace-all'],
    queryFn: () => fetchMarketplace(1, 100),
  });

  const myPortfolioIds = new Set(myPortfolios.map((p) => p.id));
  const allPortfolios = data?.portfolios ?? [];

  const trending = useMemo(() => {
    return [...allPortfolios]
      .sort((a, b) => (b.user_count ?? 0) - (a.user_count ?? 0))
      .slice(0, 5);
  }, [allPortfolios]);

  const sorted = useMemo(() => {
    return [...allPortfolios].sort((a, b) => {
      const av = getReturnForPeriod(a, period);
      const bv = getReturnForPeriod(b, period);
      const aNum = isNaN(av) ? -Infinity : av;
      const bNum = isNaN(bv) ? -Infinity : bv;
      return sortOrder === 'desc' ? bNum - aNum : aNum - bNum;
    });
  }, [allPortfolios, period, sortOrder]);

  const periods: Period[] = ['1W', '1M', '3M', '6M', '1Y'];

  return (
    <SafeAreaView style={styles.safe}>
      {isLoading && <LoadingOverlay />}

      <FlatList
        data={sorted}
        keyExtractor={(p) => String(p.id)}
        refreshControl={
          <RefreshControl refreshing={false} onRefresh={() => refetch()} tintColor={colors.accent} />
        }
        ListHeaderComponent={
          <View>
            {/* Trending horizontal strip */}
            {trending.length > 0 && (
              <View style={styles.trendSection}>
                <Text style={styles.trendLabel}>Trending Portfolios</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.trendScroll}>
                  {trending.map((p) => (
                    <TrendingCard
                      key={p.id}
                      portfolio={p}
                      period={period}
                      onPress={() => router.push(`/portfolio/${p.id}`)}
                    />
                  ))}
                </ScrollView>
              </View>
            )}

            {/* Filter row */}
            <View style={styles.filterRow}>
              {/* Sort toggle */}
              <TouchableOpacity
                style={styles.sortBtn}
                onPress={() => setSortOrder((o) => (o === 'desc' ? 'asc' : 'desc'))}
                activeOpacity={0.8}
              >
                <Ionicons
                  name={sortOrder === 'desc' ? 'arrow-down' : 'arrow-up'}
                  size={14}
                  color={colors.accent}
                />
                <Text style={styles.sortText}>Return</Text>
              </TouchableOpacity>

              {/* Period pills */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pills}>
                {periods.map((p) => (
                  <TouchableOpacity
                    key={p}
                    style={[styles.pill, period === p && styles.pillActive]}
                    onPress={() => setPeriod(p)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.pillText, period === p && styles.pillTextActive]}>{p}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <Text style={styles.allLabel}>All Portfolios</Text>
          </View>
        }
        renderItem={({ item }: { item: Portfolio }) => (
          <ExploreRow
            portfolio={item}
            period={period}
            onPress={() => router.push(`/portfolio/${item.id}`)}
          />
        )}
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyText}>No portfolios available.</Text>
            </View>
          ) : null
        }
        contentContainerStyle={styles.list}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.primary },
  list: { padding: spacing.md, paddingBottom: spacing.xl },

  trendSection: { marginBottom: spacing.md },
  trendLabel: {
    ...typography.headline,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    fontSize: 12,
    marginBottom: spacing.sm,
  },
  trendScroll: { gap: spacing.sm, paddingRight: spacing.md },

  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  sortBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.surface,
    borderRadius: radius.sm,
    paddingVertical: 6,
    paddingHorizontal: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sortText: { ...typography.caption, color: colors.accent, fontWeight: '600' },

  pills: { gap: spacing.xs },
  pill: {
    paddingVertical: 6,
    paddingHorizontal: spacing.sm + 2,
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pillActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  pillText: { ...typography.caption, color: colors.textMuted, fontWeight: '600' },
  pillTextActive: { color: '#FFFFFF' },

  allLabel: {
    ...typography.headline,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    fontSize: 12,
    marginBottom: spacing.xs,
  },

  emptyWrap: { paddingTop: spacing.xl, alignItems: 'center' },
  emptyText: { ...typography.body, color: colors.textMuted },
});

const trendStyles = StyleSheet.create({
  card: {
    width: 130,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    gap: spacing.xs,
    ...shadow.card,
  },
  icon: { width: 52, height: 52, borderRadius: 26 },
  iconFallback: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.accent + '22',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: { fontSize: 20, fontWeight: '700', color: colors.accent },
  name: { ...typography.caption, color: colors.textPrimary, fontWeight: '600', textAlign: 'center' },
  return: { fontSize: 14, fontWeight: '700' },
});

const rowStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.card,
  },
  icon: { width: 44, height: 44, borderRadius: 22 },
  iconFallback: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.accent + '22',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: { fontSize: 18, fontWeight: '700', color: colors.accent },
  name: { flex: 1, ...typography.body, fontWeight: '600', color: colors.textPrimary, marginLeft: spacing.sm },
  return: { fontSize: 15, fontWeight: '700' },
});
