import React from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { radius, spacing } from '@/theme';
import { useTheme } from '@/theme/ThemeProvider';
import { citiesByCountry } from '@/data/cities';
import { AppText } from './AppText';

interface Props {
  visible: boolean;
  selectedCityId: string | null;
  onSelect: (cityId: string | null) => void;
  onClose: () => void;
  /** Show the "All cities" option (feed/map). Hidden when a city is required. */
  allowAll?: boolean;
  title?: string;
}

export function CityPicker({
  visible,
  selectedCityId,
  onSelect,
  onClose,
  allowAll = true,
  title = 'Choose a city',
}: Props) {
  const { colors } = useTheme();
  const groups = citiesByCountry();

  const choose = (id: string | null) => {
    onSelect(id);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={[styles.backdrop, { backgroundColor: colors.scrim }]} onPress={onClose} />
      <View style={[styles.sheet, { backgroundColor: colors.bg }]}>
        <View style={styles.header}>
          <AppText variant="heading">{title}</AppText>
          <Pressable onPress={onClose} hitSlop={8} accessibilityLabel="Close city picker">
            <Ionicons name="close" size={24} color={colors.textMuted} />
          </Pressable>
        </View>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {allowAll && (
            <Row
              label="All cities"
              sub="Explore everything nearby"
              selected={selectedCityId === null}
              onPress={() => choose(null)}
              icon="globe-outline"
            />
          )}
          {groups.map((group) => (
            <View key={group.country} style={{ gap: spacing.xs }}>
              <AppText variant="overline" color="textMuted" style={{ marginTop: spacing.md }}>
                {group.country}
              </AppText>
              {group.cities.map((city) => (
                <Row
                  key={city.id}
                  label={city.name}
                  sub={`${city.currency}`}
                  selected={selectedCityId === city.id}
                  onPress={() => choose(city.id)}
                  icon="location-outline"
                />
              ))}
            </View>
          ))}
        </ScrollView>
      </View>
    </Modal>
  );
}

function Row({
  label,
  sub,
  selected,
  onPress,
  icon,
}: {
  label: string;
  sub?: string;
  selected: boolean;
  onPress: () => void;
  icon: keyof typeof Ionicons.glyphMap;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      style={({ pressed }) => [
        styles.row,
        {
          backgroundColor: selected ? colors.brandSoft : colors.surface,
          borderColor: selected ? colors.brand : colors.border,
          opacity: pressed ? 0.85 : 1,
        },
      ]}
    >
      <Ionicons name={icon} size={20} color={selected ? colors.brand : colors.textMuted} />
      <View style={{ flex: 1 }}>
        <AppText variant="bodyStrong">{label}</AppText>
        {sub && (
          <AppText variant="caption" color="textFaint">
            {sub}
          </AppText>
        )}
      </View>
      {selected && <Ionicons name="checkmark-circle" size={22} color={colors.brand} />}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  backdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    maxHeight: '80%',
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
  },
  content: { paddingHorizontal: spacing.xl, paddingBottom: spacing.huge, gap: spacing.xs },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1.5,
  },
});
