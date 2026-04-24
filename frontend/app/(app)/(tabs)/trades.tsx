import React, { useState } from 'react';
import {
  FlatList,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useInfiniteQuery } from '@tanstack/react-query';
import { fetchTradeHistory } from '@/services/trade';
import { Trade, TradeAction, TradeStatus } from '@/models/Trade';
import { LoadingOverlay } from '@/components/ui/LoadingOverlay';
import { colors, radius, spacing, typography } from '@/helpers/designTokens';
import { formatDate, formatCurrency } from '@/helpers/formatters';

const PAGE_SIZE = 20;

function TradeStatusBadge({ status }: { status: TradeStatus }) {
  const color =
    status === 'filled'
      ? colors.success
      : status === 'failed'
      ? colors.danger
      : status === 'cancelled'
      ? colors.textMuted
      : colors.warning;
  return (
    <View style={[styles.badge, { borderColor: color }]}>
      <Text style={[styles.badgeText, { color }]}>{status}</Text>
    </View>
  );
}

function TradeRow({ trade }: { trade: Trade }) {
  const isBuy = trade.action === 'buy';
  return (
    <View style={styles.row}>
      <View style={styles.rowLeft}>
        <Text style={styles.ticker}>{trade.ticker}</Text>
        <Text style={[styles.action, { color: isBuy ? colors.success : colors.danger }]}>
          {trade.action.toUpperCase()} {trade.quantity}
        </Text>
        <Text style={styles.date}>{formatDate(trade.created_at)}</Text>
      </View>
      <View style={styles.rowRight}>
        {trade.price ? (
          <Text style={styles.price}>{formatCurrency(trade.price)}</Text>
        ) : null}
        <TradeStatusBadge status={trade.status} />
      </View>
    </View>
  );
}

export default function TradesScreen() {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    refetch,
  } = useInfiniteQuery({
    queryKey: ['trade-history'],
    queryFn: ({ pageParam = 1 }) => fetchTradeHistory(pageParam as number, PAGE_SIZE),
    initialPageParam: 1,
    getNextPageParam: (last, all) =>
      last.trades.length === PAGE_SIZE ? all.length + 1 : undefined,
  });

  const trades = data?.pages.flatMap((p) => p.trades) ?? [];

  return (
    <SafeAreaView style={styles.safe}>
      {isLoading && <LoadingOverlay />}

      <FlatList
        data={trades}
        keyExtractor={(t) => String(t.id)}
        refreshControl={
          <RefreshControl refreshing={false} onRefresh={() => refetch()} tintColor={colors.accent} />
        }
        onEndReached={() => hasNextPage && !isFetchingNextPage && fetchNextPage()}
        onEndReachedThreshold={0.4}
        ListHeaderComponent={<Text style={styles.title}>Trade History</Text>}
        renderItem={({ item }: { item: Trade }) => <TradeRow trade={item} />}
        ListEmptyComponent={
          !isLoading ? (
            <Text style={styles.empty}>No trades yet.</Text>
          ) : null
        }
        contentContainerStyle={styles.list}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.primary },
  list: { padding: spacing.md },
  title: { ...typography.title, color: colors.textPrimary, marginBottom: spacing.md },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: spacing.md,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm,
  },
  rowLeft: { flex: 1 },
  rowRight: { alignItems: 'flex-end', justifyContent: 'center', gap: spacing.xs },
  ticker: { ...typography.headline, color: colors.textPrimary },
  action: { ...typography.caption, marginTop: 2 },
  date: { ...typography.caption, color: colors.textMuted, marginTop: 2 },
  price: { ...typography.body, color: colors.textPrimary },
  badge: {
    borderRadius: radius.sm,
    borderWidth: 1,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  badgeText: { ...typography.caption },
  empty: { ...typography.body, color: colors.textMuted, textAlign: 'center', marginTop: spacing.xl },
});
