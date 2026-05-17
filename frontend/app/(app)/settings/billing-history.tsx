import React from 'react';
import {
  ActivityIndicator,
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
import { fetchBillingHistory } from '@/services/subscription';
import { BillingEvent, BillingEventType } from '@/models/Subscription';
import { colors, spacing, typography, radius, shadow } from '@/helpers/designTokens';

const EVENT_LABELS: Record<BillingEventType, string> = {
  payment_success: 'Payment',
  payment_failed: 'Payment Failed',
  renewal: 'Renewal',
  refund: 'Refund',
  cancellation: 'Cancelled',
};

const EVENT_COLORS: Record<BillingEventType, string> = {
  payment_success: colors.success,
  payment_failed: colors.danger,
  renewal: colors.success,
  refund: colors.warning,
  cancellation: colors.warning,
};

function formatAmount(event: BillingEvent): string {
  const prefix = event.event_type === 'refund' ? '-' : '';
  return `${prefix}$${parseFloat(event.amount).toFixed(2)} ${event.currency}`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export default function BillingHistoryScreen() {
  const { data, isLoading } = useQuery({
    queryKey: ['billing-history'],
    queryFn: () => fetchBillingHistory(1, 50),
  });

  const events = data?.events ?? [];

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.title}>Billing History</Text>
          <View style={{ width: 24 }} />
        </View>

        {isLoading ? (
          <ActivityIndicator color={colors.accent} style={{ marginTop: spacing.xl }} />
        ) : events.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="receipt-outline" size={40} color={colors.textMuted} />
            <Text style={styles.emptyText}>No billing events yet.</Text>
          </View>
        ) : (
          <View style={styles.list}>
            {events.map((event) => {
              const dotColor = EVENT_COLORS[event.event_type];
              return (
                <View key={event.id} style={styles.row}>
                  <View style={[styles.dot, { backgroundColor: dotColor }]} />
                  <View style={styles.rowContent}>
                    <Text style={styles.eventLabel}>{EVENT_LABELS[event.event_type]}</Text>
                    <Text style={styles.eventDate}>{formatDate(event.occurred_at)}</Text>
                  </View>
                  <Text style={[styles.amount, { color: dotColor }]}>
                    {formatAmount(event)}
                  </Text>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.primary },
  scroll: { padding: spacing.md, paddingBottom: spacing.xl },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  title: { ...typography.headline, color: colors.textPrimary },
  emptyCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.sm,
    ...shadow.card,
  },
  emptyText: { ...typography.body, color: colors.textMuted },
  list: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    ...shadow.card,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: spacing.sm,
  },
  rowContent: { flex: 1 },
  eventLabel: { ...typography.body, color: colors.textPrimary, fontWeight: '600' },
  eventDate: { ...typography.caption, color: colors.textMuted, marginTop: 2 },
  amount: { ...typography.body, fontWeight: '600' },
});
