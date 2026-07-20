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
  sm: 8,
  md: 12,
  lg: 16,
  xl: 22,
  pill: 999,
} as const;

export const shadow = {
  card: {
    shadowColor: '#241A0E',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 14,
    elevation: 4,
  },
  floating: {
    shadowColor: '#241A0E',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 22,
    elevation: 10,
  },
} as const;

export const layout = {
  screenPadding: spacing.lg,
  cardGap: spacing.lg,
  hitSlop: { top: 10, bottom: 10, left: 10, right: 10 },
  maxContentWidth: 720, // keeps the feed readable on wide/web viewports
} as const;
