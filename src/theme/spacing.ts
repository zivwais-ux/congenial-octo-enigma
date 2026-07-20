/** Spacing scale (4pt grid) and shared layout tokens. */

export const spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 48,
} as const;

export const radius = {
  sm: 10,
  md: 14,
  lg: 20,
  xl: 28,
  pill: 999,
} as const;

export const shadow = {
  card: {
    shadowColor: '#241A0E',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.09,
    shadowRadius: 24,
    elevation: 5,
  },
  floating: {
    shadowColor: '#241A0E',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.18,
    shadowRadius: 30,
    elevation: 12,
  },
  // Warm glow under sunset-gradient CTAs.
  brand: {
    shadowColor: '#FF5A1F',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 18,
    elevation: 8,
  },
} as const;

export const layout = {
  screenPadding: spacing.lg,
  cardGap: spacing.lg,
  hitSlop: { top: 10, bottom: 10, left: 10, right: 10 },
  maxContentWidth: 720, // keeps the feed readable on wide/web viewports
} as const;
