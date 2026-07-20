import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { SafeAreaView, Edge } from 'react-native-safe-area-context';
import { layout } from '@/theme';
import { useTheme } from '@/theme/ThemeProvider';

interface Props {
  children: React.ReactNode;
  edges?: Edge[];
  /** Constrain content width and centre it (nice on tablets / web). */
  centered?: boolean;
  padded?: boolean;
  style?: ViewStyle;
  background?: string;
}

/** Safe-area screen container with an optional readable max-width column. */
export function Screen({
  children,
  edges = ['top', 'left', 'right'],
  centered = true,
  padded = false,
  style,
  background,
}: Props) {
  const { colors } = useTheme();
  return (
    <SafeAreaView
      edges={edges}
      style={[styles.safe, { backgroundColor: background ?? colors.bg }]}
    >
      <View
        style={[
          styles.inner,
          centered && {
            width: '100%',
            maxWidth: layout.maxContentWidth,
            alignSelf: 'center',
          },
          padded && { paddingHorizontal: layout.screenPadding },
          style,
        ]}
      >
        {children}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  inner: { flex: 1 },
});
