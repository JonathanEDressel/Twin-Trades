import React, { useState } from 'react';
import {
  Alert,
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
import { fetchBrokerageConnections, initiateOAuth, disconnectBrokerage, fetchAvailableBrokerages } from '@/services/brokerage';
import { BrokerageConnection } from '@/models/Brokerage';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { Toast } from '@/components/ui/Toast';
import { LoadingOverlay } from '@/components/ui/LoadingOverlay';
import { colors, spacing, typography, radius, shadow } from '@/helpers/designTokens';
import * as Linking from 'expo-linking';

function ScreenHeader({ title }: { title: string }) {
  return (
    <View style={headerStyles.row}>
      <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
        <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
      </TouchableOpacity>
      <Text style={headerStyles.title}>{title}</Text>
      <View style={{ width: 24 }} />
    </View>
  );
}

export default function BrokeragesScreen() {
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; variant: 'error' | 'success' } | null>(null);

  const { data: brokerages = [], refetch: refetchBrokerages } = useQuery({
    queryKey: ['brokerage-connections'],
    queryFn: fetchBrokerageConnections,
  });

  const { data: availableSlugs = [] } = useQuery({
    queryKey: ['brokerage-available'],
    queryFn: fetchAvailableBrokerages,
  });

  async function handleConnect(slug: string) {
    setLoading(true);
    try {
      const { auth_url } = await initiateOAuth(slug);
      await Linking.openURL(auth_url);
    } catch {
      setToast({ message: 'Failed to initiate connection.', variant: 'error' });
    } finally {
      setLoading(false);
    }
  }

  async function handleDisconnect(connection: BrokerageConnection) {
    Alert.alert('Disconnect', `Disconnect from ${connection.brokerage_slug}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Disconnect',
        style: 'destructive',
        onPress: async () => {
          try {
            await disconnectBrokerage(connection.id);
            refetchBrokerages();
          } catch {
            setToast({ message: 'Failed to disconnect brokerage.', variant: 'error' });
          }
        },
      },
    ]);
  }

  const connectedSlugs = new Set(brokerages.map((b) => b.brokerage_slug));
  const unconnectedSlugs = availableSlugs.filter((slug) => !connectedSlugs.has(slug));

  return (
    <SafeAreaView style={styles.safe}>
      {loading && <LoadingOverlay />}
      <ScrollView contentContainerStyle={styles.scroll}>
        <ScreenHeader title="Brokerage Connections" />

        {brokerages.length > 0 && (
          <View style={styles.card}>
            {brokerages.map((b, i) => (
              <View key={b.id}>
                <View style={styles.brokerageRow}>
                  <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                  <Text style={styles.brokerageSlug}>
                    {b.brokerage_slug.charAt(0).toUpperCase() + b.brokerage_slug.slice(1)}
                  </Text>
                  <TouchableOpacity onPress={() => handleDisconnect(b)}>
                    <Text style={styles.disconnectText}>Disconnect</Text>
                  </TouchableOpacity>
                </View>
                {i < brokerages.length - 1 && <View style={styles.divider} />}
              </View>
            ))}
          </View>
        )}

        {unconnectedSlugs.length > 0 && (
          <View style={styles.connectSection}>
            <Text style={styles.sectionLabel}>Connect a Brokerage</Text>
            {unconnectedSlugs.map((slug) => (
              <PrimaryButton
                key={slug}
                title={`Connect ${slug.charAt(0).toUpperCase() + slug.slice(1)}`}
                variant="ghost"
                onPress={() => handleConnect(slug)}
                style={styles.btn}
              />
            ))}
          </View>
        )}

        {brokerages.length === 0 && (
          <View style={styles.emptyWrap}>
            <Ionicons name="link-outline" size={40} color={colors.textMuted} />
            <Text style={styles.emptyText}>No brokerages connected yet.</Text>
          </View>
        )}
      </ScrollView>

      {toast && (
        <Toast message={toast.message} variant={toast.variant} visible onHide={() => setToast(null)} />
      )}
    </SafeAreaView>
  );
}

const headerStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  title: { ...typography.headline, color: colors.textPrimary },
});

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
  brokerageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  brokerageSlug: { flex: 1, ...typography.body, color: colors.textPrimary },
  disconnectText: { ...typography.body, color: colors.danger, fontWeight: '600' },
  divider: { height: 1, backgroundColor: colors.border },
  connectSection: { marginTop: spacing.lg },
  sectionLabel: {
    ...typography.headline,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    fontSize: 12,
    marginBottom: spacing.sm,
  },
  btn: { marginTop: spacing.sm },
  emptyWrap: { alignItems: 'center', paddingTop: spacing.xl, gap: spacing.sm },
  emptyText: { ...typography.body, color: colors.textMuted },
});
