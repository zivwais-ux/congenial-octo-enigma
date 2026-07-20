import React, { useEffect, useState } from 'react';
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  AppText,
  Avatar,
  Button,
  CategoryBadge,
  Loading,
  MapPanel,
  StarRating,
  TagPill,
} from '@/components';
import { layout, radius, shadow, spacing } from '@/theme';
import { useTheme } from '@/theme/ThemeProvider';
import { useAuth } from '@/context/AuthContext';
import { useRecommendations } from '@/context/RecommendationsContext';
import { getBackend } from '@/services';
import { getCity } from '@/data/cities';
import { compactNumber, costBand, formatCost, timeAgo } from '@/utils/format';
import type { Recommendation } from '@/types';

export default function RecommendationDetail() {
  const { colors } = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const { getCached, toggleLike, remove, flag } = useRecommendations();

  const cached = id ? getCached(id) : undefined;
  const [fetched, setFetched] = useState<Recommendation | null>(null);
  const [loading, setLoading] = useState(!cached);

  useEffect(() => {
    let active = true;
    if (cached || !id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    getBackend()
      .data.getById(id)
      .then((r) => {
        if (active) setFetched(r);
      })
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [id, cached]);

  const rec = cached ?? fetched;

  if (loading) {
    return (
      <SafeAreaView style={[styles.screen, { backgroundColor: colors.bg }]}>
        <Loading />
      </SafeAreaView>
    );
  }

  if (!rec) {
    return (
      <SafeAreaView style={[styles.screen, styles.center, { backgroundColor: colors.bg }]}>
        <Ionicons name="sad-outline" size={48} color={colors.textFaint} />
        <AppText variant="heading">Recommendation not found</AppText>
        <Button label="Go back" onPress={() => router.back()} fullWidth={false} />
      </SafeAreaView>
    );
  }

  const city = getCity(rec.cityId);
  const isOwner = user?.id === rec.author.id;
  const isFree = rec.costAmount <= 0;

  const onLike = () => {
    if (cached) {
      toggleLike(rec.id);
    } else if (fetched) {
      // Not in the feed cache — update locally + persist.
      setFetched((prev) =>
        prev
          ? {
              ...prev,
              likedByMe: !prev.likedByMe,
              likeCount: Math.max(0, prev.likeCount + (prev.likedByMe ? -1 : 1)),
            }
          : prev,
      );
      getBackend().data.toggleLike(rec.id).catch(() => {});
    }
  };

  const onShare = async () => {
    try {
      await Share.share({
        title: rec.title,
        message: `${rec.title} — found on Street Eats Asia\nstreeteats://recommendation/${rec.id}`,
      });
    } catch {
      /* user dismissed */
    }
  };

  const onDelete = () => {
    const doDelete = async () => {
      await remove(rec.id);
      router.back();
    };
    if (Platform.OS === 'web') return void doDelete();
    Alert.alert('Delete recommendation?', `"${rec.title}" will be removed.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: doDelete },
    ]);
  };

  const onReport = () => {
    const doFlag = async () => {
      await flag(rec.id, 'reported-from-detail');
      if (Platform.OS !== 'web') {
        Alert.alert('Thanks for flagging', 'Our team will review this post.');
      }
    };
    if (Platform.OS === 'web') return void doFlag();
    Alert.alert('Report this post?', 'Flag it for moderation review.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Report', style: 'destructive', onPress: doFlag },
    ]);
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.bg }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={styles.hero}>
          <Image source={{ uri: rec.imageUrl }} style={styles.heroImage} contentFit="cover" transition={200} />
          <CategoryBadge category={rec.category} style={styles.heroCategory} />
        </View>

        <View style={styles.body}>
          <View style={styles.metaRow}>
            <StarRating value={rec.rating} size={18} showValue />
            <View style={styles.dot} />
            <AppText variant="subtitle" color="brand">
              {isFree ? 'Free' : formatCost(rec.costAmount, rec.costCurrency)}
            </AppText>
            {!isFree && (
              <AppText variant="label" color="textFaint">
                {costBand(rec.costAmount, rec.costCurrency)}
              </AppText>
            )}
          </View>

          <AppText variant="title">{rec.title}</AppText>

          <View style={styles.locationRow}>
            <Ionicons name="location-sharp" size={16} color={colors.fresh} />
            <AppText variant="body" color="textMuted" style={{ flex: 1 }}>
              {rec.locationLabel}
              {city ? ` · ${city.name}, ${city.country}` : ''}
            </AppText>
          </View>

          <AppText variant="body" style={{ lineHeight: 25 }}>
            {rec.description}
          </AppText>

          {rec.tags.length > 0 && (
            <View style={styles.tagRow}>
              {rec.tags.map((t) => (
                <TagPill key={t} tag={t} />
              ))}
            </View>
          )}

          {/* Author */}
          <View style={[styles.author, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Avatar name={rec.author.displayName} uri={rec.author.avatarUrl} size={44} />
            <View style={{ flex: 1 }}>
              <AppText variant="bodyStrong">{rec.author.displayName}</AppText>
              <AppText variant="caption" color="textMuted">
                {rec.author.homeBase ? `${rec.author.homeBase} · ` : ''}
                shared {timeAgo(rec.createdAt)}
              </AppText>
            </View>
          </View>

          {/* Map */}
          <AppText variant="overline" color="textMuted">
            Where to find it
          </AppText>
          <View style={styles.mapWrap}>
            <MapPanel
              center={rec.location}
              markers={[
                {
                  id: rec.id,
                  coordinate: rec.location,
                  title: rec.title,
                  category: rec.category,
                },
              ]}
              selectedId={rec.id}
              style={{ flex: 1 }}
            />
          </View>

          {isOwner ? (
            <Button
              label="Delete recommendation"
              icon="trash-outline"
              variant="danger"
              onPress={onDelete}
              style={{ marginTop: spacing.sm }}
            />
          ) : (
            <Pressable onPress={onReport} style={styles.reportRow} accessibilityRole="button">
              <Ionicons name="flag-outline" size={16} color={colors.textFaint} />
              <AppText variant="label" color="textFaint">
                Report this post
              </AppText>
            </Pressable>
          )}
          <View style={{ height: spacing.huge }} />
        </View>
      </ScrollView>

      {/* Floating top controls */}
      <SafeAreaView style={styles.topBar} pointerEvents="box-none" edges={['top']}>
        <RoundControl icon="chevron-back" onPress={() => router.back()} label="Go back" />
        <View style={styles.topRight}>
          <RoundControl icon="share-outline" onPress={onShare} label="Share" />
          <RoundControl
            icon={rec.likedByMe ? 'heart' : 'heart-outline'}
            color={rec.likedByMe ? colors.like : '#fff'}
            onPress={onLike}
            label={rec.likedByMe ? 'Unlike' : 'Like'}
          />
        </View>
      </SafeAreaView>

      {/* Bottom like bar */}
      <SafeAreaView edges={['bottom']} style={[styles.likeBar, shadow.floating, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
        <View style={styles.likeInfo}>
          <Ionicons name="heart" size={20} color={colors.like} />
          <AppText variant="subtitle">{compactNumber(rec.likeCount)}</AppText>
          <AppText variant="caption" color="textMuted">
            travelers loved this
          </AppText>
        </View>
        <Button
          label={rec.likedByMe ? 'Liked' : 'Like this spot'}
          icon={rec.likedByMe ? 'heart' : 'heart-outline'}
          variant={rec.likedByMe ? 'secondary' : 'primary'}
          onPress={onLike}
          fullWidth={false}
        />
      </SafeAreaView>
    </View>
  );
}

function RoundControl({
  icon,
  onPress,
  color = '#fff',
  label,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  color?: string;
  label: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={styles.roundControl}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={6}
    >
      <Ionicons name={icon} size={22} color={color} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  center: { alignItems: 'center', justifyContent: 'center', gap: spacing.md },
  scroll: { paddingBottom: spacing.xl },
  hero: { position: 'relative' },
  heroImage: { width: '100%', height: 320, backgroundColor: '#ddd' },
  heroCategory: { position: 'absolute', bottom: spacing.lg, left: spacing.lg },
  body: {
    width: '100%',
    maxWidth: layout.maxContentWidth,
    alignSelf: 'center',
    padding: layout.screenPadding,
    gap: spacing.md,
  },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  dot: { width: 3, height: 3, borderRadius: 2, backgroundColor: '#bbb' },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  author: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    marginTop: spacing.sm,
  },
  mapWrap: { height: 220, marginBottom: spacing.sm },
  reportRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.md,
  },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: layout.screenPadding,
    paddingTop: spacing.sm,
  },
  topRight: { flexDirection: 'row', gap: spacing.sm },
  roundControl: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  likeBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: layout.screenPadding,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    gap: spacing.md,
  },
  likeInfo: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flex: 1 },
});
