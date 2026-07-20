import React from 'react';
import { Text, TextProps, TextStyle } from 'react-native';
import { typography } from '@/theme';
import { useTheme } from '@/theme/ThemeProvider';
import type { AppColors } from '@/theme';

type Variant = keyof typeof typography;
type ColorKey = keyof Pick<
  AppColors,
  | 'text'
  | 'textMuted'
  | 'textFaint'
  | 'textOnBrand'
  | 'textOnDark'
  | 'brand'
  | 'accent'
  | 'fresh'
  | 'danger'
  | 'success'
  | 'headerText'
>;

interface Props extends TextProps {
  variant?: Variant;
  color?: ColorKey;
  center?: boolean;
  style?: TextStyle | TextStyle[];
}

/** Themed, variant-based text primitive used across the app. */
export function AppText({
  variant = 'body',
  color = 'text',
  center,
  style,
  children,
  ...rest
}: Props) {
  const { colors } = useTheme();
  return (
    <Text
      style={[
        typography[variant],
        { color: colors[color] },
        center && { textAlign: 'center' },
        style as TextStyle,
      ]}
      {...rest}
    >
      {children}
    </Text>
  );
}
