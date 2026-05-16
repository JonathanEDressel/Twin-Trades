import React, { useState } from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
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
  const [imgError, setImgError] = useState(false);

  const showImage = !!portfolio.icon_url && !imgError;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
      <View style={styles.row}>
        {/* Avatar */}
        <View style={styles.avatarWrap}>
          {showImage ? (
            <Image
              source={{ uri: portfolio.icon_url! }}
              style={styles.avatar}
              onError={() => setImgError(true)}
            />
          ) : (
            <View style={styles.avatarFallback}>
              <Text style={styles.avatarLetter}>
                {portfolio.name.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
        </View>

        {/* Content */}
        <View style={styles.content}>
          <View style={styles.nameRow}>
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
        </View>
      </View>
    </TouchableOpacity>
  );
}

const AVATAR_SIZE = 52;

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
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  avatarWrap: {
    flexShrink: 0,
  },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    backgroundColor: colors.surface,
  },
  avatarFallback: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    backgroundColor: colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarLetter: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
  },
  content: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
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
    flexShrink: 0,
  },
  badgeText: {
    ...typography.caption,
    color: '#fff',
    fontWeight: '600',
  },
  description: {
    ...typography.body,
    color: colors.textMuted,
    marginBottom: spacing.sm,
    lineHeight: 20,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  holdingsCount: {
    ...typography.caption,
    color: colors.textMuted,
  },
  returnPct: {
    ...typography.caption,
    fontWeight: '600',
  },
});


