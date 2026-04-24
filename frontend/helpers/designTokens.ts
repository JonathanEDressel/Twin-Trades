export const colors = {
  primary: '#0D0D0F',
  accent: '#6C63FF',
  accentHover: '#574FD6',
  surface: '#1A1A1F',
  card: '#1E1E24',
  border: '#2C2C35',
  textPrimary: '#F0F0F5',
  textMuted: '#8A8A9A',
  success: '#34D399',
  danger: '#F87171',
  warning: '#FBBF24',
  info: '#22D3EE',
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
