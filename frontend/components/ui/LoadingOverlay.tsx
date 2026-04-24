import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { colors } from '@/helpers/designTokens';

export function LoadingOverlay() {
  return (
    <View style={styles.overlay}>
      <ActivityIndicator size="large" color={colors.accent} />
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(13,13,15,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  },
});
