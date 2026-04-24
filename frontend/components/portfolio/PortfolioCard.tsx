import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Portfolio } from '@/models/Portfolio';
import { colors, radius, shadow, spacing, typography } from '@/helpers/designTokens';
import { formatPercent } from '@/helpers/formatters';

interface PortfolioCardProps {
  portfolio: Portfolio;
  onPress?: () => void;
  isFollowing?: boolean;
}

export function PortfolioCard({ portfolio, onPress, isFollowing = false }: PortfolioCardProps) {
  const returnPct = portfolio.total_return_pct ? parseFloat(portfolio.total_return_pct) : null;
  const isPositive = returnPct !== null && returnPct >= 0;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
      <View style={styles.header}>
        <Text style={styles.name} numberOfLines={1}>
          {portfolio.name}
        </Text>
        {isFollowing && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>Following</Text>
          </View>
        )}
      </View>

      {portfolio.description ? (
        <Text style={styles.description} numberOfLines={2}>
          {portfolio.description}
        </Text>
      ) : null}

      <View style={styles.footer}>
        <Text style={styles.holdingsCount}>
          {portfolio.holdings.length} holding{portfolio.holdings.length !== 1 ? 's' : ''}
        </Text>
        {returnPct !== null && (
          <Text style={[styles.returnPct, { color: isPositive ? colors.success : colors.danger }]}>
            {formatPercent(returnPct)}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.card,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  name: {
    ...typography.headline,
    color: colors.textPrimary,
    flex: 1,
  },
  badge: {
    backgroundColor: colors.accent,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    marginLeft: spacing.sm,
  },
  badgeText: {
    ...typography.caption,
    color: '#fff',
  },
  description: {
    ...typography.body,
    color: colors.textMuted,
    marginBottom: spacing.sm,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  holdingsCount: {
    ...typography.caption,
    color: colors.textMuted,
  },
  returnPct: {
    ...typography.headline,
  },
});
