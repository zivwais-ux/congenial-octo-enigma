import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { radius, shadow, spacing } from '@/theme';
import { useTheme } from '@/theme/ThemeProvider';
import type { Recommendation } from '@/types';
import { getCity } from '@/data/cities';
import { compactNumber, costBand, formatCost, timeAgo } from '@/utils/format';
import { AppText } from './AppText';
import { Avatar } from './Avatar';
import { CategoryBadge } from './CategoryBadge';
import { StarRating } from './StarRating';
import { TagPill } from './TagPill';

interface Props {
  recommendation: Recommendation;
  onPress: () => void;
  onToggleLike: () => void;
}

export function RecommendationCard({
  recommendation: rec,
  onPress,
  onToggleLike,
}: Props) {
  const { colors } = useTheme();
  const city = getCity(rec.cityId);
  const isFree = rec.costAmount <= 0;

  return (
    <View style={styles.cardWrap}>
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`${rec.title}, ${rec.rating} stars`}
        style={({ pressed }) => [
          styles.card,
          shadow.card,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
            transform: [{ scale: pressed ? 0.99 : 1 }],
          },
        ]}
      >
        <View style={styles.imageWrap}>
          <Image
            source={{ uri: rec.imageUrl }}
            style={styles.image}
            contentFit="cover"
            transition={200}
            accessibilityLabel={rec.title}
          />
          <CategoryBadge category={rec.category} style={styles.categoryBadge} />
        </View>

        <View style={styles.body}>
          <View style={styles.metaRow}>
            <StarRating value={rec.rating} size={14} showValue />
            <View style={styles.dot} />
            <AppText variant="label" color="brand">
              {isFree ? 'Free' : formatCost(rec.costAmount, rec.costCurrency)}
            </AppText>
            {!isFree && (
              <AppText variant="caption" color="textFaint">
                {costBand(rec.costAmount, rec.costCurrency)}
              </AppText>
            )}
          </View>

          <AppText variant="subtitle" numberOfLines={2}>
            {rec.title}
          </AppText>

          <AppText variant="body" color="textMuted" numberOfLines={2}>
            {rec.description}
          </AppText>

          <View style={styles.locationRow}>
            <Ionicons name="location-sharp" size={13} color={colors.fresh} />
            <AppText variant="caption" color="textMuted" numberOfLines={1} style={{ flex: 1 }}>
              {rec.locationLabel}
              {city ? ` · ${city.name}` : ''}
            </AppText>
          </View>

          {rec.tags.length > 0 && (
            <View style={styles.tagRow}>
              {rec.tags.slice(0, 3).map((t) => (
                <TagPill key={t} tag={t} />
              ))}
            </View>
          )}

          <View style={[styles.footer, { borderTopColor: colors.border }]}>
            <Avatar name={rec.author.displayName} uri={rec.author.avatarUrl} size={28} />
            <AppText variant="caption" style={{ flex: 1, fontWeight: '600' }} numberOfLines={1}>
              {rec.author.displayName}
            </AppText>
            <AppText variant="caption" color="textFaint">
              {timeAgo(rec.createdAt)}
            </AppText>
          </View>
        </View>
      </Pressable>

      {/* Sibling of the card's Pressable, not a descendant — a <button> nested inside
          another <button> is invalid HTML and RN Web renders accessibilityRole="button"
          as a real <button>, which broke click handling on web. */}
      <Pressable
        onPress={onToggleLike}
        hitSlop={10}
        accessibilityRole="button"
        accessibilityLabel={rec.likedByMe ? 'Unlike' : 'Like'}
        style={[styles.likeButton, { backgroundColor: colors.overlay }]}
      >
        <Ionicons
          name={rec.likedByMe ? 'heart' : 'heart-outline'}
          size={18}
          color={rec.likedByMe ? colors.like : '#fff'}
        />
        <AppText variant="caption" style={{ color: '#fff', fontWeight: '700' }}>
          {compactNumber(rec.likeCount)}
        </AppText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  cardWrap: { position: 'relative' },
  card: {
    borderRadius: radius.xl,
    borderWidth: 1,
    overflow: 'hidden',
  },
  imageWrap: { position: 'relative' },
  image: { width: '100%', aspectRatio: 4 / 3, backgroundColor: '#ddd' },
  categoryBadge: { position: 'absolute', top: spacing.md, left: spacing.md },
  likeButton: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radius.pill,
  },
  body: { padding: spacing.lg, gap: spacing.sm },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  dot: { width: 3, height: 3, borderRadius: 2, backgroundColor: '#bbb' },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.xs,
    paddingTop: spacing.md,
    borderTopWidth: 1,
  },
});
