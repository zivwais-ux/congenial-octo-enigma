import React, { createContext, useContext, useMemo } from 'react';
import { useColorScheme } from 'react-native';
import { darkTheme, lightTheme } from './colors';
import type { AppColors } from './colors';

type ThemeValue = {
  colors: AppColors;
  isDark: boolean;
};

const ThemeContext = createContext<ThemeValue>({
  colors: lightTheme,
  isDark: false,
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const value = useMemo<ThemeValue>(
    () => ({ colors: isDark ? darkTheme : lightTheme, isDark }),
    [isDark],
  );
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

/** Access the active colour palette (light/dark follows the system setting). */
export function useTheme(): ThemeValue {
  return useContext(ThemeContext);
}
