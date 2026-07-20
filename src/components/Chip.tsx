import React from 'react';
import { Pressable, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { radius, spacing } from '@/theme';
import { useTheme } from '@/theme/ThemeProvider';
import { AppText } from './AppText';

interface Props {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
  size?: 'sm' | 'md';
  style?: ViewStyle;
}

/** Selectable pill used for categories, tags, sort and city filters. */
export function Chip({
  label,
  selected,
  onPress,
  icon,
  size = 'md',
  style,
}: Props) {
  const { colors } = useTheme();
  const height = size === 'sm' ? 32 : 40;
  const fg = selected ? colors.textOnBrand : colors.text;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: !!selected }}
      style={({ pressed }) => [
        styles.base,
        {
          height,
          paddingHorizontal: size === 'sm' ? spacing.md : spacing.lg,
          backgroundColor: selected ? colors.brand : colors.surface,
          borderColor: selected ? colors.brand : colors.border,
          opacity: pressed ? 0.85 : 1,
        },
        style,
      ]}
    >
      {icon && <Ionicons name={icon} size={size === 'sm' ? 14 : 16} color={fg} />}
      <AppText
        variant={size === 'sm' ? 'caption' : 'label'}
        style={{ color: fg, fontWeight: '600' }}
      >
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    borderRadius: radius.pill,
    borderWidth: 1.5,
  },
});
