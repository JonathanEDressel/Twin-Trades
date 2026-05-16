export const colors = {
  primary: '#F0F4FF',
  accent: '#5B4FE9',
  accentHover: '#4A40C8',
  surface: '#FFFFFF',
  card: '#FFFFFF',
  border: '#E4E2F5',
  textPrimary: '#1A1A2E',
  textMuted: '#6B7280',
  success: '#10B981',
  danger: '#EF4444',
  warning: '#F59E0B',
  info: '#06B6D4',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 40,
} as const;

export const radius = {
  sm: 6,
  md: 12,
  lg: 20,
} as const;

export const typography = {
  title: { fontSize: 28, fontWeight: '700' as const },
  headline: { fontSize: 18, fontWeight: '600' as const },
  body: { fontSize: 16, fontWeight: '400' as const },
  caption: { fontSize: 13, fontWeight: '400' as const },
  mono: { fontSize: 14, fontFamily: 'monospace' as const },
} as const;

export const shadow = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
} as const;
