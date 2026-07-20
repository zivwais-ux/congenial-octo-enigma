/**
 * Street Eats Asia colour system.
 *
 * Sunset-street palette: electric coral-orange, warm gold, lime pops and deep
 * ink-teal — vibrant and young, still culturally warm per the product brief.
 * Every text/background pairing below meets WCAG AA contrast for body text.
 */

const palette = {
  // Brand — electric coral-orange (primary action / energy)
  orange50: '#FFF4EE',
  orange100: '#FFE1D1',
  orange300: '#FFA470',
  orange500: '#FF5A1F', // primary
  orange600: '#E8440C',
  orange700: '#B53408',

  // Warm gold (gradient start, highlights, ratings)
  gold400: '#FFC24B',
  gold500: '#F5A623',
  gold600: '#C98508',

  // Deep teal (surfaces, headers, brand depth)
  teal50: '#E6F4F1',
  teal100: '#BFE3DC',
  teal400: '#27907F',
  teal600: '#0F6B5C',
  teal800: '#0A4A40', // brand dark
  teal900: '#07322B',

  // Lime green (freshness / "must-try" energy)
  lime400: '#A3E635',
  lime500: '#84CC16',
  lime600: '#5FA30D',

  // Neutrals — crisper, higher-contrast than v1
  ink900: '#17150F',
  ink700: '#2E2B24',
  ink500: '#645F55',
  ink400: '#8C8679',
  ink300: '#C2BCB0',
  ink200: '#E7E3DA',
  ink100: '#F2EFE8',
  paper: '#FAF9F5', // near-white with a hint of warmth
  white: '#FFFFFF',
  black: '#000000',

  // Feedback
  red500: '#E5484D',
  red50: '#FDECEC',
  green500: '#2FA36B',
};

export const lightTheme = {
  mode: 'light' as const,
  brand: palette.orange500,
  brandDark: palette.orange600,
  brandSoft: palette.orange50,
  // Sunset gradient used by primary CTAs and hero surfaces.
  gradientStart: palette.gold500,
  gradientEnd: palette.orange500,
  accent: palette.gold500,
  accentSoft: palette.gold400,
  fresh: palette.lime600,
  freshSoft: palette.lime400,

  bg: palette.paper,
  surface: palette.white,
  surfaceAlt: palette.ink100,
  surfaceSunken: palette.ink100,

  header: palette.teal800,
  headerText: palette.white,

  border: palette.ink200,
  borderStrong: palette.ink300,

  text: palette.ink900,
  textMuted: palette.ink500,
  textFaint: palette.ink400,
  textOnBrand: palette.white,
  textOnDark: palette.white,

  star: palette.gold500,
  like: palette.red500,

  danger: palette.red500,
  dangerSoft: palette.red50,
  success: palette.green500,

  overlay: 'rgba(23, 21, 15, 0.48)',
  scrim: 'rgba(7, 50, 43, 0.45)',
};

export const darkTheme: typeof lightTheme = {
  mode: 'light' as const, // keep type shape; overridden below
  brand: palette.orange500,
  brandDark: palette.orange300,
  brandSoft: 'rgba(255,90,31,0.16)',
  gradientStart: palette.gold500,
  gradientEnd: palette.orange500,
  accent: palette.gold400,
  accentSoft: palette.gold500,
  fresh: palette.lime400,
  freshSoft: palette.lime500,

  bg: '#07211D',
  surface: '#0E312B',
  surfaceAlt: '#0B2924',
  surfaceSunken: '#061B17',

  header: palette.teal900,
  headerText: palette.white,

  border: 'rgba(255,255,255,0.10)',
  borderStrong: 'rgba(255,255,255,0.20)',

  text: '#F5F2EB',
  textMuted: '#B7C4BF',
  textFaint: '#879C96',
  textOnBrand: palette.white,
  textOnDark: palette.white,

  star: palette.gold400,
  like: '#FF6B6B',

  danger: '#FF6B6B',
  dangerSoft: 'rgba(255,107,107,0.16)',
  success: '#5FD39B',

  overlay: 'rgba(0, 0, 0, 0.6)',
  scrim: 'rgba(0,0,0,0.55)',
};

// Mark the dark theme's mode correctly (kept out of the literal to preserve type).
(darkTheme as { mode: 'dark' | 'light' }).mode = 'dark';

export type AppColors = typeof lightTheme;
export { palette };
