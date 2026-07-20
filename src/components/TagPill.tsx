import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { radius, spacing } from '@/theme';
import { useTheme } from '@/theme/ThemeProvider';
import { getTag } from '@/data/tags';
import type { Tag } from '@/types';
import { AppText } from './AppText';

/** Small read-only chip that renders a recommendation tag with its icon. */
export function TagPill({ tag }: { tag: Tag }) {
  const { colors } = useTheme();
  const meta = getTag(tag);
  return (
    <View style={[styles.base, { backgroundColor: colors.surfaceAlt }]}>
      <Ionicons
        name={meta.icon as keyof typeof Ionicons.glyphMap}
        size={12}
        color={colors.textMuted}
      />
      <AppText variant="caption" color="textMuted" style={{ fontWeight: '600' }}>
        {meta.label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
  },
});
