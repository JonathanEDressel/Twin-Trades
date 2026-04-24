import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacityProps,
  ViewStyle,
} from 'react-native';
import { colors, radius, spacing, typography } from '@/helpers/designTokens';

interface PrimaryButtonProps extends TouchableOpacityProps {
  title: string;
  loading?: boolean;
  variant?: 'primary' | 'danger' | 'ghost';
  style?: ViewStyle;
}

export function PrimaryButton({
  title,
  loading = false,
  variant = 'primary',
  style,
  disabled,
  ...rest
}: PrimaryButtonProps) {
  const bg =
    variant === 'danger'
      ? colors.danger
      : variant === 'ghost'
      ? 'transparent'
      : colors.accent;

  const textColor =
    variant === 'ghost' ? colors.accent : colors.textPrimary;

  return (
    <TouchableOpacity
      style={[styles.button, { backgroundColor: bg }, style]}
      disabled={disabled || loading}
      activeOpacity={0.8}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={textColor} size="small" />
      ) : (
        <Text style={[styles.label, { color: textColor }]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: spacing.sm + 4,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  label: {
    ...typography.headline,
  },
});
