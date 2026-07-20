import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { useFocusEffect, useRouter } from 'expo-router';
import {
  AppText,
  Button,
  Chip,
  CityPicker,
  Screen,
  StarRating,
} from '@/components';
import { layout, radius, spacing, typography } from '@/theme';
import { useTheme } from '@/theme/ThemeProvider';
import { useRecommendations } from '@/context/RecommendationsContext';
import { CATEGORIES } from '@/data/categories';
import { TAGS } from '@/data/tags';
import { getCity } from '@/data/cities';
import { currencySymbol } from '@/utils/format';
import type { Category, GeoPoint, Tag } from '@/types';

const FALLBACK_PHOTO = 'https://picsum.photos/seed/newpost/900/675';

export default function AddScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { create, filters } = useRecommendations();

  const [image, setImage] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<Category | null>(null);
  const [rating, setRating] = useState(0);
  const [cost, setCost] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState<Tag[]>([]);
  const [cityId, setCityId] = useState<string | null>(filters.cityId);
  const [locationLabel, setLocationLabel] = useState('');
  const [coords, setCoords] = useState<GeoPoint | null>(null);
  const [locating, setLocating] = useState(false);

  const [cityOpen, setCityOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const city = getCity(cityId);

  // Reset the whole form when leaving the tab, so it is fresh next time.
  useFocusEffect(
    React.useCallback(() => {
      return () => resetForm();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []),
  );

  const resetForm = () => {
    setImage(null);
    setTitle('');
    setCategory(null);
    setRating(0);
    setCost('');
    setDescription('');
    setTags([]);
    setCityId(filters.cityId);
    setLocationLabel('');
    setCoords(null);
    setError(null);
  };

  const pickImage = async (from: 'camera' | 'library') => {
    setError(null);
    try {
      if (from === 'camera') {
        const perm = await ImagePicker.requestCameraPermissionsAsync();
        if (!perm.granted) {
          setError('Camera permission is needed to take a photo.');
          return;
        }
        const res = await ImagePicker.launchCameraAsync({
          quality: 0.7,
          allowsEditing: true,
          aspect: [4, 3],
        });
        if (!res.canceled) setImage(res.assets[0].uri);
      } else {
        const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!perm.granted) {
          setError('Photo library permission is needed to choose a photo.');
          return;
        }
        const res = await ImagePicker.launchImageLibraryAsync({
          quality: 0.7,
          allowsEditing: true,
          aspect: [4, 3],
          mediaTypes: ['images'],
        });
        if (!res.canceled) setImage(res.assets[0].uri);
      }
    } catch {
      setError('Could not open the picker on this device.');
    }
  };

  const useMyLocation = async () => {
    setError(null);
    setLocating(true);
    try {
      const perm = await Location.requestForegroundPermissionsAsync();
      if (!perm.granted) {
        setError('Location permission denied. You can still pin by choosing a city.');
        return;
      }
      const pos = await Location.getCurrentPositionAsync({});
      setCoords({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
    } catch {
      setError('Could not read your location right now.');
    } finally {
      setLocating(false);
    }
  };

  const toggleTag = (t: Tag) =>
    setTags((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));

  const validate = (): string | null => {
    if (!title.trim()) return 'Give your recommendation a title.';
    if (!category) return 'Pick a category.';
    if (rating < 1) return 'Add a star rating.';
    if (!description.trim()) return 'Add a short description.';
    if (!cityId || !city) return 'Choose a city.';
    return null;
  };

  const onSubmit = async () => {
    const problem = validate();
    if (problem) {
      setError(problem);
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const location = coords ?? city!.center;
      const rec = await create({
        title: title.trim(),
        description: description.trim(),
        category: category!,
        rating,
        costAmount: cost ? Math.max(0, Number(cost)) || 0 : 0,
        costCurrency: city!.currency,
        tags,
        imageUrl: image ?? FALLBACK_PHOTO,
        location,
        locationLabel: locationLabel.trim() || city!.name,
        cityId: cityId!,
      });
      resetForm();
      router.replace(`/recommendation/${rec.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not publish. Try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Screen edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <View style={styles.header}>
          <AppText variant="title">Share a spot</AppText>
          <AppText variant="caption" color="textMuted">
            Help a fellow traveler eat like a local
          </AppText>
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Photo */}
          {image ? (
            <View style={styles.photoWrap}>
              <Image source={{ uri: image }} style={styles.photo} contentFit="cover" />
              <Pressable
                onPress={() => setImage(null)}
                style={[styles.photoRemove, { backgroundColor: colors.overlay }]}
                accessibilityLabel="Remove photo"
              >
                <Ionicons name="close" size={18} color="#fff" />
              </Pressable>
            </View>
          ) : (
            <View style={styles.photoPickerRow}>
              <PhotoButton icon="camera" label="Take photo" onPress={() => pickImage('camera')} />
              <PhotoButton icon="images" label="Upload" onPress={() => pickImage('library')} />
            </View>
          )}

          <Field label="Title">
            <Input
              value={title}
              onChangeText={setTitle}
              placeholder='e.g. "Boat noodles at Victory Monument"'
              maxLength={80}
            />
          </Field>

          <Field label="Category">
            <View style={styles.wrap}>
              {CATEGORIES.map((c) => (
                <Chip
                  key={c.id}
                  label={c.label}
                  icon={c.icon as keyof typeof Ionicons.glyphMap}
                  selected={category === c.id}
                  onPress={() => setCategory(c.id)}
                />
              ))}
            </View>
          </Field>

          <Field label="Your rating">
            <StarRating value={rating} onChange={setRating} size={34} />
          </Field>

          <Field label="City">
            <Pressable
              onPress={() => setCityOpen(true)}
              style={[styles.select, { backgroundColor: colors.surface, borderColor: colors.border }]}
            >
              <Ionicons name="location-outline" size={20} color={colors.textMuted} />
              <AppText variant="body" style={{ flex: 1 }} color={city ? 'text' : 'textFaint'}>
                {city ? `${city.name}, ${city.country}` : 'Choose a city'}
              </AppText>
              <Ionicons name="chevron-down" size={18} color={colors.textMuted} />
            </Pressable>
          </Field>

          <Field label="Estimated cost (optional)">
            <View style={[styles.costRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <AppText variant="subtitle" color="textMuted">
                {city ? currencySymbol(city.currency) : '$'}
              </AppText>
              <TextInput
                value={cost}
                onChangeText={(t) => setCost(t.replace(/[^0-9.]/g, ''))}
                placeholder="0 = free"
                placeholderTextColor={colors.textFaint}
                keyboardType="numeric"
                style={[typography.body, styles.costInput, { color: colors.text }]}
              />
              {city && (
                <AppText variant="caption" color="textFaint">
                  {city.currency}
                </AppText>
              )}
            </View>
          </Field>

          <Field label="Street-level location (optional)">
            <Input
              value={locationLabel}
              onChangeText={setLocationLabel}
              placeholder='e.g. "Soi 38, Thong Lo"'
              maxLength={80}
            />
            <Pressable onPress={useMyLocation} style={styles.gpsRow} disabled={locating}>
              <Ionicons
                name={coords ? 'checkmark-circle' : 'navigate-circle-outline'}
                size={20}
                color={coords ? colors.success : colors.brand}
              />
              <AppText variant="label" color={coords ? 'success' : 'brand'}>
                {locating
                  ? 'Getting your GPS pin…'
                  : coords
                    ? 'GPS pin attached'
                    : 'Use my current location'}
              </AppText>
            </Pressable>
          </Field>

          <Field label="Description">
            <Input
              value={description}
              onChangeText={setDescription}
              placeholder="What makes it special? 1–3 honest sentences."
              multiline
              numberOfLines={4}
              maxLength={280}
              style={{ height: 110, textAlignVertical: 'top', paddingTop: spacing.md }}
            />
            <AppText variant="caption" color="textFaint" style={{ alignSelf: 'flex-end' }}>
              {description.length}/280
            </AppText>
          </Field>

          <Field label="Tags (optional)">
            <View style={styles.wrap}>
              {TAGS.map((t) => (
                <Chip
                  key={t.id}
                  label={t.label}
                  icon={t.icon as keyof typeof Ionicons.glyphMap}
                  size="sm"
                  selected={tags.includes(t.id)}
                  onPress={() => toggleTag(t.id)}
                />
              ))}
            </View>
          </Field>

          {error && (
            <AppText variant="label" color="danger">
              {error}
            </AppText>
          )}

          <Button
            label="Publish recommendation"
            icon="send"
            onPress={onSubmit}
            loading={submitting}
            disabled={submitting}
            style={{ marginTop: spacing.sm }}
          />
          <View style={{ height: spacing.xxl }} />
        </ScrollView>
      </KeyboardAvoidingView>

      <CityPicker
        visible={cityOpen}
        selectedCityId={cityId}
        allowAll={false}
        title="Where is this spot?"
        onSelect={(id) => setCityId(id)}
        onClose={() => setCityOpen(false)}
      />
    </Screen>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={{ gap: spacing.sm }}>
      <AppText variant="label" color="textMuted">
        {label}
      </AppText>
      {children}
    </View>
  );
}

function Input({
  style,
  ...props
}: React.ComponentProps<typeof TextInput>) {
  const { colors } = useTheme();
  return (
    <TextInput
      placeholderTextColor={colors.textFaint}
      style={[
        styles.input,
        typography.body,
        { color: colors.text, backgroundColor: colors.surface, borderColor: colors.border },
        style,
      ]}
      {...props}
    />
  );
}

function PhotoButton({
  icon,
  label,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={[styles.photoButton, { backgroundColor: colors.brandSoft, borderColor: colors.brand }]}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Ionicons name={icon} size={26} color={colors.brand} />
      <AppText variant="label" color="brand">
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: layout.screenPadding,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    gap: 2,
  },
  content: { paddingHorizontal: layout.screenPadding, gap: spacing.xl, paddingBottom: spacing.xl },
  photoPickerRow: { flexDirection: 'row', gap: spacing.md },
  photoButton: {
    flex: 1,
    height: 120,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  photoWrap: { position: 'relative' },
  photo: { width: '100%', aspectRatio: 4 / 3, borderRadius: radius.lg, backgroundColor: '#ddd' },
  photoRemove: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    minHeight: 52,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  select: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    height: 52,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  costRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    height: 52,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  costInput: { flex: 1, paddingVertical: 0 },
  gpsRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, paddingVertical: spacing.xs },
});
