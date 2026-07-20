import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import {
  AppText,
  CityPicker,
  EmptyState,
  Loading,
  MapPanel,
  Screen,
  StarRating,
} from '@/components';
import type { MapMarker } from '@/components';
import { layout, radius, shadow, spacing } from '@/theme';
import { useTheme } from '@/theme/ThemeProvider';
import { useRecommendations } from '@/context/RecommendationsContext';
import { getCity } from '@/data/cities';
import { formatCost } from '@/utils/format';

const ASIA_CENTER = { latitude: 15.5, longitude: 103.5 };

export default function MapScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { all, filters, loading, setFilters } = useRecommendations();

  const [cityOpen, setCityOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const city = getCity(filters.cityId);
  const center = city ? city.center : ASIA_CENTER;

  const markers = useMemo<MapMarker[]>(
    () =>
      all.map((r) => ({
        id: r.id,
        coordinate: r.location,
        title: r.title,
        category: r.category,
      })),
    [all],
  );

  const selected = all.find((r) => r.id === selectedId) ?? null;

  return (
    <Screen edges={['top']}>
      <View style={styles.header}>
        <Pressable
          onPress={() => setCityOpen(true)}
          style={styles.cityBtn}
          accessibilityRole="button"
          accessibilityLabel="Change city"
        >
          <Ionicons name="location-sharp" size={18} color={colors.brand} />
          <AppText variant="heading" numberOfLines={1}>
            {city ? city.name : 'All of Asia'}
          </AppText>
          <Ionicons name="chevron-down" size={18} color={colors.textMuted} />
        </Pressable>
        <AppText variant="caption" color="textMuted">
          {markers.length} pins
        </AppText>
      </View>

      <View style={styles.mapWrap}>
        {loading ? (
          <Loading />
        ) : markers.length === 0 ? (
          <EmptyState
            icon="map-outline"
            title="Nothing to map here yet"
            message="Switch cities or clear your filters to see recommendations on the map."
          />
        ) : (
          <MapPanel
            center={center}
            markers={markers}
            selectedId={selectedId}
            onSelectMarker={setSelectedId}
            style={styles.map}
          />
        )}

        {selected && (
          <Pressable
            onPress={() => router.push(`/recommendation/${selected.id}`)}
            style={[styles.preview, shadow.floating, { backgroundColor: colors.surface }]}
            accessibilityRole="button"
            accessibilityLabel={`Open ${selected.title}`}
          >
            <Image
              source={{ uri: selected.imageUrl }}
              style={styles.previewImage}
              contentFit="cover"
              transition={150}
            />
            <View style={styles.previewBody}>
              <AppText variant="bodyStrong" numberOfLines={1}>
                {selected.title}
              </AppText>
              <View style={styles.previewMeta}>
                <StarRating value={selected.rating} size={13} />
                <AppText variant="caption" color="brand" style={{ fontWeight: '700' }}>
                  {selected.costAmount > 0
                    ? formatCost(selected.costAmount, selected.costCurrency)
                    : 'Free'}
                </AppText>
              </View>
              <AppText variant="caption" color="textMuted" numberOfLines={1}>
                {selected.locationLabel}
              </AppText>
            </View>
            <Ionicons name="chevron-forward" size={22} color={colors.textFaint} />
          </Pressable>
        )}
      </View>

      <CityPicker
        visible={cityOpen}
        selectedCityId={filters.cityId}
        onSelect={(cityId) => {
          setFilters({ cityId });
          setSelectedId(null);
        }}
        onClose={() => setCityOpen(false)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: layout.screenPadding,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  cityBtn: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, flex: 1 },
  mapWrap: { flex: 1, paddingHorizontal: layout.screenPadding, paddingBottom: spacing.md },
  map: { flex: 1 },
  preview: {
    position: 'absolute',
    left: layout.screenPadding + spacing.md,
    right: layout.screenPadding + spacing.md,
    bottom: spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.sm,
    paddingRight: spacing.md,
    borderRadius: radius.lg,
  },
  previewImage: { width: 64, height: 64, borderRadius: radius.md, backgroundColor: '#ddd' },
  previewBody: { flex: 1, gap: 2 },
  previewMeta: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
});
