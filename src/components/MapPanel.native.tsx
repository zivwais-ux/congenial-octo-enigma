import React, { useMemo } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, Region } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { radius } from '@/theme';
import { useTheme } from '@/theme/ThemeProvider';
import { getCategory } from '@/data/categories';
import type { MapPanelProps } from './mapPanelTypes';

/** Native interactive map backed by react-native-maps (Google Maps). */
export function MapPanel({
  center,
  markers,
  selectedId,
  onSelectMarker,
  style,
}: MapPanelProps) {
  const { colors } = useTheme();

  const region = useMemo<Region>(() => {
    if (markers.length === 0) {
      return {
        latitude: center.latitude,
        longitude: center.longitude,
        latitudeDelta: 0.08,
        longitudeDelta: 0.08,
      };
    }
    const lats = markers.map((m) => m.coordinate.latitude);
    const lngs = markers.map((m) => m.coordinate.longitude);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);
    return {
      latitude: (minLat + maxLat) / 2,
      longitude: (minLng + maxLng) / 2,
      latitudeDelta: Math.max(0.03, (maxLat - minLat) * 1.6),
      longitudeDelta: Math.max(0.03, (maxLng - minLng) * 1.6),
    };
  }, [markers, center]);

  return (
    <View style={[styles.container, style]}>
      <MapView
        // Google provider on Android; default (Apple) on iOS unless keyed.
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
        style={StyleSheet.absoluteFill}
        initialRegion={region}
        showsUserLocation
        showsMyLocationButton={false}
        toolbarEnabled={false}
      >
        {markers.map((m) => {
          const selected = m.id === selectedId;
          const meta = getCategory(m.category);
          return (
            <Marker
              key={m.id}
              coordinate={m.coordinate}
              title={m.title}
              onPress={() => onSelectMarker?.(m.id)}
              tracksViewChanges={false}
            >
              <View
                style={[
                  styles.pin,
                  {
                    backgroundColor: selected ? colors.brand : colors.surface,
                    borderColor: colors.brand,
                    transform: [{ scale: selected ? 1.15 : 1 }],
                  },
                ]}
              >
                <Ionicons
                  name={meta.icon as keyof typeof Ionicons.glyphMap}
                  size={16}
                  color={selected ? colors.textOnBrand : colors.brand}
                />
              </View>
            </Marker>
          );
        })}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    borderRadius: radius.lg,
    overflow: 'hidden',
    minHeight: 220,
  },
  pin: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
