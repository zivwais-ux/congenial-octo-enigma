import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { spacing } from '@/theme';
import { useTheme } from '@/theme/ThemeProvider';
import { AppText } from './AppText';

export function Loading({ label }: { label?: string }) {
  const { colors } = useTheme();
  return (
    <View style={styles.container}>
      <ActivityIndicator color={colors.brand} size="large" />
      {label && (
        <AppText variant="body" color="textMuted">
          {label}
        </AppText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
});
