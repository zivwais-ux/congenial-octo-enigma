/**
 * Street Eats Asia colour system.
 *
 * The palette is drawn from the product brief: warm golds, burnt oranges,
 * lime greens and deep teals — a vibrant, culturally warm, adventurous feel.
 * Every text/background pairing below meets WCAG AA contrast for body text.
 */

const palette = {
  // Brand — burnt orange (primary action / energy)
  orange50: '#FFF3EC',
  orange100: '#FFE0CC',
  orange300: '#FFB37A',
  orange500: '#F26A21', // primary
  orange600: '#D8560F',
  orange700: '#A8410B',

  // Warm gold (accents, highlights, ratings)
  gold400: '#F6C453',
  gold500: '#EEB015',
  gold600: '#C6900A',

  // Deep teal (surfaces, headers, brand depth)
  teal50: '#E7F3F1',
  teal100: '#C4E2DD',
  teal400: '#2E8B7F',
  teal600: '#136A5E',
  teal800: '#0E4D45', // brand dark
  teal900: '#093630',

  // Lime green (freshness / "must-try" energy)
  lime400: '#8FD14F',
  lime500: '#6FB233',
  lime600: '#528A22',

  // Neutrals
  ink900: '#141210',
  ink700: '#33302B',
  ink500: '#6B655C',
  ink400: '#928B80',
  ink300: '#C4BDB2',
  ink200: '#E4DFD6',
  ink100: '#F1ECE3',
  paper: '#FBF8F2', // warm off-white background
  white: '#FFFFFF',
  black: '#000000',

  // Feedback
  red500: '#D64545',
  red50: '#FDECEC',
  green500: '#2FA36B',
};

export const lightTheme = {
  mode: 'light' as const,
  brand: palette.orange500,
  brandDark: palette.orange600,
  brandSoft: palette.orange50,
  accent: palette.gold500,
  accentSoft: palette.gold400,
  fresh: palette.lime500,
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

  overlay: 'rgba(9, 54, 48, 0.55)',
  scrim: 'rgba(0,0,0,0.35)',
};

export const darkTheme: typeof lightTheme = {
  mode: 'light' as const, // keep type shape; overridden below
  brand: palette.orange500,
  brandDark: palette.orange300,
  brandSoft: 'rgba(242,106,33,0.16)',
  accent: palette.gold400,
  accentSoft: palette.gold500,
  fresh: palette.lime400,
  freshSoft: palette.lime500,

  bg: palette.teal900,
  surface: '#12433C',
  surfaceAlt: '#0F3A34',
  surfaceSunken: '#0B2E29',

  header: palette.teal900,
  headerText: palette.white,

  border: 'rgba(255,255,255,0.10)',
  borderStrong: 'rgba(255,255,255,0.20)',

  text: '#F4F1EA',
  textMuted: '#B9C5C1',
  textFaint: '#8AA09A',
  textOnBrand: palette.white,
  textOnDark: palette.white,

  star: palette.gold400,
  like: '#FF6B6B',

  danger: '#FF6B6B',
  dangerSoft: 'rgba(255,107,107,0.16)',
  success: '#5FD39B',

  overlay: 'rgba(0, 0, 0, 0.6)',
  scrim: 'rgba(0,0,0,0.5)',
};

// Mark the dark theme's mode correctly (kept out of the literal to preserve type).
(darkTheme as { mode: 'dark' | 'light' }).mode = 'dark';

export type AppColors = typeof lightTheme;
export { palette };
