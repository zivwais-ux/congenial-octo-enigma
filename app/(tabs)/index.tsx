import React, { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import {
  AppText,
  CityPicker,
  EmptyState,
  FilterSheet,
  Loading,
  RecommendationCard,
  Screen,
  SearchBar,
} from '@/components';
import { layout, radius, spacing } from '@/theme';
import { useTheme } from '@/theme/ThemeProvider';
import { useAuth } from '@/context/AuthContext';
import { useRecommendations } from '@/context/RecommendationsContext';
import { countActiveFilters } from '@/services/filters';
import { getCity } from '@/data/cities';

export default function FeedScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { user } = useAuth();
  const {
    items,
    totalCount,
    filters,
    loading,
    refreshing,
    loadingMore,
    hasMore,
    setFilters,
    resetFilters,
    refresh,
    loadMore,
    toggleLike,
  } = useRecommendations();

  const [cityOpen, setCityOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);

  const city = getCity(filters.cityId);
  const activeCount = countActiveFilters(filters);
  const firstName = (user?.displayName ?? 'traveler').split(' ')[0];

  return (
    <Screen edges={['top']}>
      <View style={styles.headerWrap}>
        <View style={styles.headerTop}>
          <View style={{ flex: 1 }}>
            <AppText variant="caption" color="textMuted">
              Hungry, {firstName}?
            </AppText>
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
          </View>
          <Pressable
            onPress={() => setFilterOpen(true)}
            style={[styles.filterBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
            accessibilityRole="button"
            accessibilityLabel="Open filters"
          >
            <Ionicons name="options" size={22} color={colors.text} />
            {activeCount > 0 && (
              <View style={[styles.badge, { backgroundColor: colors.brand }]}>
                <AppText variant="caption" style={{ color: '#fff', fontWeight: '800', fontSize: 11 }}>
                  {activeCount}
                </AppText>
              </View>
            )}
          </Pressable>
        </View>

        <SearchBar
          value={filters.query}
          onChangeText={(query) => setFilters({ query })}
        />
      </View>

      {loading ? (
        <Loading label="Finding the good stuff…" />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <RecommendationCard
              recommendation={item}
              onPress={() => router.push(`/recommendation/${item.id}`)}
              onToggleLike={() => toggleLike(item.id)}
            />
          )}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={{ height: layout.cardGap }} />}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={refresh}
              tintColor={colors.brand}
              colors={[colors.brand]}
            />
          }
          onEndReached={loadMore}
          onEndReachedThreshold={0.4}
          ListHeaderComponent={
            <View style={styles.countRow}>
              <AppText variant="label" color="textMuted">
                {totalCount} {totalCount === 1 ? 'spot' : 'spots'}
                {activeCount > 0 ? ' match your filters' : ' to explore'}
              </AppText>
              {activeCount > 0 && (
                <Pressable onPress={resetFilters} hitSlop={8}>
                  <AppText variant="label" color="brand">
                    Clear
                  </AppText>
                </Pressable>
              )}
            </View>
          }
          ListFooterComponent={
            hasMore ? (
              <View style={styles.footer}>
                {loadingMore && <ActivityIndicator color={colors.brand} />}
              </View>
            ) : items.length > 0 ? (
              <AppText variant="caption" color="textFaint" center style={styles.footer}>
                You have reached the end of the trail 🥢
              </AppText>
            ) : null
          }
          ListEmptyComponent={
            <EmptyState
              icon="search"
              title="No spots yet"
              message="Try a different city, loosen your filters, or be the first to add a recommendation here."
              actionLabel="Clear filters"
              onAction={resetFilters}
            />
          }
        />
      )}

      <CityPicker
        visible={cityOpen}
        selectedCityId={filters.cityId}
        onSelect={(cityId) => setFilters({ cityId })}
        onClose={() => setCityOpen(false)}
      />
      <FilterSheet
        visible={filterOpen}
        filters={filters}
        onClose={() => setFilterOpen(false)}
        onApply={(next) => setFilters(next)}
        onReset={resetFilters}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  headerWrap: {
    paddingHorizontal: layout.screenPadding,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    gap: spacing.md,
  },
  headerTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  cityBtn: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  filterBtn: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  list: { paddingHorizontal: layout.screenPadding, paddingBottom: spacing.xxl },
  countRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: spacing.md,
  },
  footer: { paddingVertical: spacing.xl },
});
