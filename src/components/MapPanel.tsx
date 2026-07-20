import React, { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { radius, spacing } from '@/theme';
import { useTheme } from '@/theme/ThemeProvider';
import { getCategory } from '@/data/categories';
import { AppText } from './AppText';
import type { MapMarker, MapPanelProps } from './mapPanelTypes';

/**
 * Web / fallback map.
 *
 * `react-native-maps` is native-only, so on web (and anywhere the native module
 * is unavailable) Metro resolves this file instead of `MapPanel.native.tsx`.
 * Rather than an empty box, it lays the pins out spatially inside a normalised
 * bounding box — you still get a real sense of where things cluster, tappable,
 * with no map SDK or API key required.
 */
export function MapPanel({
  markers,
  selectedId,
  onSelectMarker,
  style,
}: MapPanelProps) {
  const { colors } = useTheme();

  const bounds = useMemo(() => {
    if (markers.length === 0) {
      return { minLat: 0, maxLat: 1, minLng: 0, maxLng: 1 };
    }
    const lats = markers.map((m) => m.coordinate.latitude);
    const lngs = markers.map((m) => m.coordinate.longitude);
    const pad = 0.02;
    return {
      minLat: Math.min(...lats) - pad,
      maxLat: Math.max(...lats) + pad,
      minLng: Math.min(...lngs) - pad,
      maxLng: Math.max(...lngs) + pad,
    };
  }, [markers]);

  const positionFor = (m: MapMarker) => {
    const latSpan = bounds.maxLat - bounds.minLat || 1;
    const lngSpan = bounds.maxLng - bounds.minLng || 1;
    const left = ((m.coordinate.longitude - bounds.minLng) / lngSpan) * 100;
    // Latitude increases upward, so invert for top-based positioning.
    const top = ((bounds.maxLat - m.coordinate.latitude) / latSpan) * 100;
    return { left: `${clamp(left)}%` as const, top: `${clamp(top)}%` as const };
  };

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.surfaceAlt, borderColor: colors.border },
        style,
      ]}
    >
      <View style={[styles.grid, { borderColor: colors.border }]} pointerEvents="none">
        {Array.from({ length: 3 }).map((_, i) => (
          <View
            key={`h${i}`}
            style={[styles.gridLineH, { top: `${(i + 1) * 25}%`, backgroundColor: colors.border }]}
          />
        ))}
        {Array.from({ length: 3 }).map((_, i) => (
          <View
            key={`v${i}`}
            style={[styles.gridLineV, { left: `${(i + 1) * 25}%`, backgroundColor: colors.border }]}
          />
        ))}
      </View>

      {markers.map((m) => {
        const pos = positionFor(m);
        const selected = m.id === selectedId;
        const meta = getCategory(m.category);
        return (
          <Pressable
            key={m.id}
            onPress={() => onSelectMarker?.(m.id)}
            accessibilityRole="button"
            accessibilityLabel={m.title}
            style={[styles.pin, pos, selected && styles.pinSelected]}
          >
            <View
              style={[
                styles.pinDot,
                {
                  backgroundColor: selected ? colors.brand : colors.surface,
                  borderColor: colors.brand,
                },
                selected && { transform: [{ scale: 1.15 }] },
              ]}
            >
              <Ionicons
                name={meta.icon as keyof typeof Ionicons.glyphMap}
                size={14}
                color={selected ? colors.textOnBrand : colors.brand}
              />
            </View>
          </Pressable>
        );
      })}

      <View style={[styles.badge, { backgroundColor: colors.overlay }]} pointerEvents="none">
        <Ionicons name="map" size={13} color="#fff" />
        <AppText variant="caption" style={{ color: '#fff', fontWeight: '600' }}>
          {markers.length} nearby · full map in the app
        </AppText>
      </View>
    </View>
  );
}

function clamp(pct: number): number {
  return Math.max(4, Math.min(96, pct));
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    borderRadius: radius.lg,
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
    minHeight: 220,
  },
  grid: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  gridLineH: { position: 'absolute', left: 0, right: 0, height: StyleSheet.hairlineWidth, opacity: 0.6 },
  gridLineV: { position: 'absolute', top: 0, bottom: 0, width: StyleSheet.hairlineWidth, opacity: 0.6 },
  pin: {
    position: 'absolute',
    marginLeft: -18,
    marginTop: -18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinSelected: { zIndex: 5 },
  pinDot: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    left: spacing.md,
    bottom: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
    borderRadius: radius.pill,
  },
});
