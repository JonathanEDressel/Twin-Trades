import React, { useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, View } from 'react-native';
import { PendingRebalance } from '@/models/RebalanceEvent';
import { colors, radius, spacing, typography } from '@/helpers/designTokens';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { formatRelativeDate } from '@/helpers/formatters';

interface RebalanceConfirmSheetProps {
  rebalance: PendingRebalance | null;
  visible: boolean;
  onConfirm: (id: number) => Promise<void>;
  onReject: (id: number) => Promise<void>;
  onDismiss: () => void;
}

export function RebalanceConfirmSheet({
  rebalance,
  visible,
  onConfirm,
  onReject,
  onDismiss,
}: RebalanceConfirmSheetProps) {
  const [loading, setLoading] = useState<'confirm' | 'reject' | null>(null);

  if (!rebalance) return null;

  const expiresIn = formatRelativeDate(rebalance.expires_at);

  async function handleConfirm() {
    setLoading('confirm');
    try {
      await onConfirm(rebalance!.id);
    } finally {
      setLoading(null);
    }
  }

  async function handleReject() {
    setLoading('reject');
    try {
      await onReject(rebalance!.id);
    } finally {
      setLoading(null);
    }
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onDismiss}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <Text style={styles.title}>Rebalance Pending</Text>
          <Text style={styles.expiry}>Expires {expiresIn}</Text>

          <ScrollView style={styles.holdings} showsVerticalScrollIndicator={false}>
            {rebalance.holdings.map((h) => (
              <View key={h.ticker} style={styles.holdingRow}>
                <Text style={styles.ticker}>{h.ticker}</Text>
                <Text style={styles.pct}>{parseFloat(h.target_pct).toFixed(1)}%</Text>
              </View>
            ))}
          </ScrollView>

          <View style={styles.actions}>
            <PrimaryButton
              title="Approve"
              style={styles.confirmBtn}
              loading={loading === 'confirm'}
              disabled={loading !== null}
              onPress={handleConfirm}
            />
            <PrimaryButton
              title="Reject"
              variant="danger"
              style={styles.rejectBtn}
              loading={loading === 'reject'}
              disabled={loading !== null}
              onPress={handleReject}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.card,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  title: {
    ...typography.title,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  expiry: {
    ...typography.caption,
    color: colors.textMuted,
    marginBottom: spacing.md,
  },
  holdings: {
    maxHeight: 240,
    marginBottom: spacing.md,
  },
  holdingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  ticker: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  pct: {
    ...typography.body,
    color: colors.accent,
  },
  actions: {
    gap: spacing.sm,
  },
  confirmBtn: {
    marginBottom: spacing.xs,
  },
  rejectBtn: {},
});
