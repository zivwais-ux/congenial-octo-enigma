import { Platform, TextStyle } from 'react-native';

/**
 * Typography scale. Bold, readable, sans-serif — body text never drops below
 * 16px per the brief's accessibility requirement.
 */

const systemFont = Platform.select({
  ios: 'System',
  android: 'sans-serif',
  default: 'system-ui',
});

const systemFontBold = Platform.select({
  ios: 'System',
  android: 'sans-serif-medium',
  default: 'system-ui',
});

type Variant =
  | 'display'
  | 'title'
  | 'heading'
  | 'subtitle'
  | 'body'
  | 'bodyStrong'
  | 'label'
  | 'caption'
  | 'overline';

export const typography: Record<Variant, TextStyle> = {
  display: {
    fontFamily: systemFontBold,
    fontSize: 32,
    lineHeight: 38,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  title: {
    fontFamily: systemFontBold,
    fontSize: 26,
    lineHeight: 32,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  heading: {
    fontFamily: systemFontBold,
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '700',
  },
  subtitle: {
    fontFamily: systemFontBold,
    fontSize: 17,
    lineHeight: 24,
    fontWeight: '700',
  },
  body: {
    fontFamily: systemFont,
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '400',
  },
  bodyStrong: {
    fontFamily: systemFontBold,
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '600',
  },
  label: {
    fontFamily: systemFontBold,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
  },
  caption: {
    fontFamily: systemFont,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '400',
  },
  overline: {
    fontFamily: systemFontBold,
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '700',
    letterSpacing: 1.1,
    textTransform: 'uppercase',
  },
};
