import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, typography } from '@/helpers/designTokens';

type ToastVariant = 'success' | 'error' | 'info';

interface ToastProps {
  message: string;
  variant?: ToastVariant;
  visible: boolean;
  onHide: () => void;
  duration?: number;
}

export function Toast({
  message,
  variant = 'info',
  visible,
  onHide,
  duration = 3000,
}: ToastProps) {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.delay(duration),
        Animated.timing(opacity, { toValue: 0, duration: 300, useNativeDriver: true }),
      ]).start(() => onHide());
    }
  }, [visible]);

  if (!visible) return null;

  const bg =
    variant === 'success'
      ? colors.success
      : variant === 'error'
      ? colors.danger
      : colors.info;

  return (
    <Animated.View style={[styles.container, { backgroundColor: bg, opacity }]}>
      <Text style={styles.text}>{message}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: spacing.xl,
    left: spacing.lg,
    right: spacing.lg,
    padding: spacing.md,
    borderRadius: radius.md,
    zIndex: 999,
  },
  text: {
    ...typography.body,
    color: '#fff',
    textAlign: 'center',
  },
});
