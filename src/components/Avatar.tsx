import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { radius } from '@/theme';
import { useTheme } from '@/theme/ThemeProvider';
import { AppText } from './AppText';

interface Props {
  name: string;
  uri?: string | null;
  size?: number;
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() ?? '').join('') || '?';
}

/** Circular avatar with graceful initials fallback (no image / load error). */
export function Avatar({ name, uri, size = 40 }: Props) {
  const { colors } = useTheme();
  const [failed, setFailed] = useState(false);
  const showImage = !!uri && !failed;

  return (
    <View
      style={[
        styles.base,
        {
          width: size,
          height: size,
          borderRadius: radius.pill,
          backgroundColor: colors.brandSoft,
        },
      ]}
    >
      {showImage ? (
        <Image
          source={{ uri: uri as string }}
          style={{ width: size, height: size, borderRadius: radius.pill }}
          contentFit="cover"
          transition={150}
          onError={() => setFailed(true)}
          accessibilityLabel={`${name} avatar`}
        />
      ) : (
        <AppText
          style={{ color: colors.brand, fontSize: size * 0.4, fontWeight: '800' }}
        >
          {initials(name)}
        </AppText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  base: { alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
});
