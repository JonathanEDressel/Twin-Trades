import React, { useEffect, useState } from 'react';
import { ActivityIndicator, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { handleOAuthCallback } from '@/services/brokerage';
import { Toast } from '@/components/ui/Toast';
import { colors, spacing, typography } from '@/helpers/designTokens';

export default function OAuthCallbackScreen() {
  const params = useLocalSearchParams<{ code: string; state: string; slug: string }>();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    processCallback();
  }, []);

  async function processCallback() {
    const { code, state, slug } = params;
    if (!code || !state || !slug) {
      setError('Invalid callback parameters.');
      return;
    }
    try {
      await handleOAuthCallback({ code, state, brokerage_slug: slug });
      router.replace('/(app)/(tabs)/settings');
    } catch {
      setError('Failed to connect brokerage. Please try again.');
      setTimeout(() => router.replace('/(app)/(tabs)/settings'), 2500);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.center}>
        {!error ? (
          <>
            <ActivityIndicator size="large" color={colors.accent} />
            <Text style={styles.message}>Connecting your brokerage…</Text>
          </>
        ) : null}
      </View>
      {error && (
        <Toast message={error} variant="error" visible onHide={() => {}} />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.primary },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.lg },
  message: { ...typography.body, color: colors.textMuted, marginTop: spacing.md },
});
