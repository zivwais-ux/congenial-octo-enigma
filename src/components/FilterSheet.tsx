import React, { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { radius, spacing } from '@/theme';
import { useTheme } from '@/theme/ThemeProvider';
import type { Category, CostBand, Filters, SortOption, Tag } from '@/types';
import { CATEGORIES } from '@/data/categories';
import { TAGS } from '@/data/tags';
import { AppText } from './AppText';
import { Button } from './Button';
import { Chip } from './Chip';
import { StarRating } from './StarRating';

interface Props {
  visible: boolean;
  filters: Filters;
  onClose: () => void;
  onApply: (next: Partial<Filters>) => void;
  onReset: () => void;
}

const SORTS: { id: SortOption; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { id: 'recent', label: 'Most recent', icon: 'time' },
  { id: 'most-liked', label: 'Most liked', icon: 'heart' },
  { id: 'highest-rated', label: 'Highest rated', icon: 'star' },
];

const BANDS: CostBand[] = ['$', '$$', '$$$'];

function toggle<T>(list: T[], value: T): T[] {
  return list.includes(value)
    ? list.filter((v) => v !== value)
    : [...list, value];
}

export function FilterSheet({ visible, filters, onClose, onApply, onReset }: Props) {
  const { colors } = useTheme();
  const [draft, setDraft] = useState<Filters>(filters);

  useEffect(() => {
    if (visible) setDraft(filters);
  }, [visible, filters]);

  const apply = () => {
    onApply(draft);
    onClose();
  };

  const reset = () => {
    onReset();
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <Pressable style={[styles.backdrop, { backgroundColor: colors.scrim }]} onPress={onClose} />
      <View style={[styles.sheet, { backgroundColor: colors.bg }]}>
        <View style={styles.handleRow}>
          <View style={[styles.handle, { backgroundColor: colors.borderStrong }]} />
        </View>
        <View style={styles.header}>
          <AppText variant="heading">Filters & sorting</AppText>
          <Pressable onPress={onClose} hitSlop={8} accessibilityLabel="Close filters">
            <Ionicons name="close" size={24} color={colors.textMuted} />
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <Section title="Sort by">
            <View style={styles.wrap}>
              {SORTS.map((s) => (
                <Chip
                  key={s.id}
                  label={s.label}
                  icon={s.icon}
                  selected={draft.sort === s.id}
                  onPress={() => setDraft((d) => ({ ...d, sort: s.id }))}
                />
              ))}
            </View>
          </Section>

          <Section title="Category">
            <View style={styles.wrap}>
              {CATEGORIES.map((c) => (
                <Chip
                  key={c.id}
                  label={c.label}
                  icon={c.icon as keyof typeof Ionicons.glyphMap}
                  selected={draft.categories.includes(c.id)}
                  onPress={() =>
                    setDraft((d) => ({
                      ...d,
                      categories: toggle<Category>(d.categories, c.id),
                    }))
                  }
                />
              ))}
            </View>
          </Section>

          <Section title="Tags">
            <View style={styles.wrap}>
              {TAGS.map((t) => (
                <Chip
                  key={t.id}
                  label={t.label}
                  icon={t.icon as keyof typeof Ionicons.glyphMap}
                  selected={draft.tags.includes(t.id)}
                  onPress={() =>
                    setDraft((d) => ({ ...d, tags: toggle<Tag>(d.tags, t.id) }))
                  }
                />
              ))}
            </View>
          </Section>

          <Section title="Minimum rating">
            <View style={styles.wrap}>
              <Chip
                label="Any"
                selected={draft.minRating === 0}
                onPress={() => setDraft((d) => ({ ...d, minRating: 0 }))}
              />
              {[3, 4, 5].map((r) => (
                <Pressable
                  key={r}
                  onPress={() => setDraft((d) => ({ ...d, minRating: r }))}
                  style={[
                    styles.ratingChip,
                    {
                      backgroundColor:
                        draft.minRating === r ? colors.brandSoft : colors.surface,
                      borderColor:
                        draft.minRating === r ? colors.brand : colors.border,
                    },
                  ]}
                >
                  <StarRating value={r} size={15} />
                  <AppText variant="caption" color="textMuted">
                    {r === 5 ? '' : '& up'}
                  </AppText>
                </Pressable>
              ))}
            </View>
          </Section>

          <Section title="Price">
            <View style={styles.wrap}>
              <Chip
                label="Any"
                selected={draft.maxBand === null}
                onPress={() => setDraft((d) => ({ ...d, maxBand: null }))}
              />
              {BANDS.map((b) => (
                <Chip
                  key={b}
                  label={`${b} or less`}
                  selected={draft.maxBand === b}
                  onPress={() => setDraft((d) => ({ ...d, maxBand: b }))}
                />
              ))}
            </View>
          </Section>
        </ScrollView>

        <View style={[styles.footer, { borderTopColor: colors.border }]}>
          <Button label="Reset" variant="secondary" onPress={reset} fullWidth={false} />
          <Button label="Show results" onPress={apply} style={{ flex: 1 }} />
        </View>
      </View>
    </Modal>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={{ gap: spacing.md }}>
      <AppText variant="overline" color="textMuted">
        {title}
      </AppText>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    maxHeight: '88%',
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingBottom: spacing.xl,
  },
  handleRow: { alignItems: 'center', paddingTop: spacing.sm },
  handle: { width: 44, height: 5, borderRadius: 3 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  content: { paddingHorizontal: spacing.xl, gap: spacing.xl, paddingBottom: spacing.xl },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  ratingChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    height: 40,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    borderWidth: 1.5,
  },
  footer: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    borderTopWidth: 1,
  },
});
