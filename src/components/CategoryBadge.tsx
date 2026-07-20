import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { radius, spacing } from '@/theme';
import { useTheme } from '@/theme/ThemeProvider';
import { getCategory } from '@/data/categories';
import type { Category } from '@/types';
import { AppText } from './AppText';

/** Category label with icon, shown as an overlay badge on cards. */
export function CategoryBadge({
  category,
  style,
}: {
  category: Category;
  style?: ViewStyle;
}) {
  const { colors } = useTheme();
  const meta = getCategory(category);
  return (
    <View style={[styles.base, { backgroundColor: colors.overlay }, style]}>
      <Ionicons
        name={meta.icon as keyof typeof Ionicons.glyphMap}
        size={13}
        color="#fff"
      />
      <AppText variant="overline" style={{ color: '#fff' }}>
        {meta.label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
    borderRadius: radius.pill,
  },
});
