import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { spacing } from '@/theme';
import { useTheme } from '@/theme/ThemeProvider';
import { AppText } from './AppText';

interface Props {
  value: number;
  /** When provided, the stars become tappable (form input). */
  onChange?: (value: number) => void;
  size?: number;
  showValue?: boolean;
  count?: number; // total stars
}

/** Read-only by default; interactive when `onChange` is supplied. */
export function StarRating({
  value,
  onChange,
  size = 16,
  showValue = false,
  count = 5,
}: Props) {
  const { colors } = useTheme();
  const interactive = typeof onChange === 'function';

  return (
    <View style={styles.row} accessibilityRole={interactive ? 'adjustable' : 'image'}>
      {Array.from({ length: count }).map((_, i) => {
        const index = i + 1;
        const filled = value >= index;
        const star = (
          <Ionicons
            name={filled ? 'star' : 'star-outline'}
            size={size}
            color={filled ? colors.star : colors.textFaint}
          />
        );
        if (!interactive) return <View key={index}>{star}</View>;
        return (
          <Pressable
            key={index}
            onPress={() => onChange?.(index)}
            hitSlop={6}
            accessibilityRole="button"
            accessibilityLabel={`Rate ${index} star${index > 1 ? 's' : ''}`}
            style={{ padding: 2 }}
          >
            {star}
          </Pressable>
        );
      })}
      {showValue && (
        <AppText variant="label" color="textMuted" style={{ marginLeft: 4 }}>
          {value.toFixed(1)}
        </AppText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.xxs },
});
