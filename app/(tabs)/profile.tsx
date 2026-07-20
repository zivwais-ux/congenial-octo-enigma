import React, { useCallback, useState } from 'react';
import {
  Alert,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import {
  AppText,
  Avatar,
  Button,
  EmptyState,
  Loading,
  Screen,
  StarRating,
} from '@/components';
import { layout, radius, spacing, typography } from '@/theme';
import { useTheme } from '@/theme/ThemeProvider';
import { useAuth } from '@/context/AuthContext';
import { useRecommendations } from '@/context/RecommendationsContext';
import { getBackend } from '@/services';
import { getCity } from '@/data/cities';
import { formatCost, timeAgo } from '@/utils/format';
import type { Recommendation } from '@/types';

export default function ProfileScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { user, session, signOut, updateProfile } = useAuth();
  const { remove } = useRecommendations();

  const [posts, setPosts] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const mine = await getBackend().data.listByAuthor(user.id);
      setPosts(mine);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const likesReceived = posts.reduce((sum, p) => sum + p.likeCount, 0);

  const confirmDelete = (rec: Recommendation) => {
    const doDelete = async () => {
      await remove(rec.id);
      setPosts((prev) => prev.filter((p) => p.id !== rec.id));
    };
    if (Platform.OS === 'web') {
      // Alert with buttons is limited on web; delete directly.
      doDelete();
      return;
    }
    Alert.alert('Delete recommendation?', `"${rec.title}" will be removed.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: doDelete },
    ]);
  };

  const onSignOut = () => {
    const doSignOut = async () => {
      await signOut();
      router.replace('/(auth)/sign-in');
    };
    if (Platform.OS === 'web') {
      doSignOut();
      return;
    }
    Alert.alert('Sign out?', 'You can sign back in any time.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: doSignOut },
    ]);
  };

  if (!user) return null;

  return (
    <Screen edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <Avatar name={user.displayName} uri={user.avatarUrl} size={72} />
          <View style={{ flex: 1, gap: 2 }}>
            <AppText variant="title" numberOfLines={1}>
              {user.displayName}
            </AppText>
            {user.homeBase && (
              <View style={styles.inline}>
                <Ionicons name="airplane" size={13} color={colors.textMuted} />
                <AppText variant="caption" color="textMuted">
                  {user.homeBase}
                </AppText>
              </View>
            )}
            {session?.provider === 'guest' && (
              <AppText variant="caption" color="accent" style={{ fontWeight: '700' }}>
                Browsing as guest
              </AppText>
            )}
          </View>
        </View>

        {user.bio && (
          <AppText variant="body" color="textMuted">
            {user.bio}
          </AppText>
        )}

        <View style={[styles.stats, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Stat label="Recommendations" value={posts.length} />
          <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
          <Stat label="Likes received" value={likesReceived} />
        </View>

        <View style={styles.actions}>
          <Button
            label="Edit profile"
            icon="create-outline"
            variant="secondary"
            onPress={() => setEditOpen(true)}
            style={{ flex: 1 }}
          />
          <Button
            label="Sign out"
            icon="log-out-outline"
            variant="ghost"
            onPress={onSignOut}
            style={{ flex: 1 }}
          />
        </View>

        <AppText variant="heading" style={{ marginTop: spacing.md }}>
          Your recommendations
        </AppText>

        {loading ? (
          <View style={{ paddingVertical: spacing.huge }}>
            <Loading />
          </View>
        ) : posts.length === 0 ? (
          <EmptyState
            icon="add-circle-outline"
            title="No posts yet"
            message="Share your first hidden gem and it will show up here."
            actionLabel="Add a recommendation"
            onAction={() => router.push('/(tabs)/add')}
          />
        ) : (
          <View style={{ gap: spacing.md }}>
            {posts.map((rec) => (
              <MyPostRow
                key={rec.id}
                rec={rec}
                onOpen={() => router.push(`/recommendation/${rec.id}`)}
                onDelete={() => confirmDelete(rec)}
              />
            ))}
          </View>
        )}
      </ScrollView>

      <EditProfileModal
        visible={editOpen}
        initial={{
          displayName: user.displayName,
          bio: user.bio ?? '',
          homeBase: user.homeBase ?? '',
        }}
        onClose={() => setEditOpen(false)}
        onSave={async (patch) => {
          await updateProfile(patch);
          setEditOpen(false);
        }}
      />
    </Screen>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.stat}>
      <AppText variant="title" color="brand">
        {value}
      </AppText>
      <AppText variant="caption" color="textMuted">
        {label}
      </AppText>
    </View>
  );
}

function MyPostRow({
  rec,
  onOpen,
  onDelete,
}: {
  rec: Recommendation;
  onOpen: () => void;
  onDelete: () => void;
}) {
  const { colors } = useTheme();
  const city = getCity(rec.cityId);
  return (
    <View style={[styles.postRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Pressable onPress={onOpen} style={styles.postMain} accessibilityRole="button">
        <Image source={{ uri: rec.imageUrl }} style={styles.postImage} contentFit="cover" />
        <View style={{ flex: 1, gap: 2 }}>
          <AppText variant="bodyStrong" numberOfLines={1}>
            {rec.title}
          </AppText>
          <View style={styles.inline}>
            <StarRating value={rec.rating} size={12} />
            <AppText variant="caption" color="textFaint">
              · {city?.name ?? ''} · {timeAgo(rec.createdAt)}
            </AppText>
          </View>
          <View style={styles.inline}>
            <Ionicons name="heart" size={12} color={colors.like} />
            <AppText variant="caption" color="textMuted">
              {rec.likeCount}
            </AppText>
            <AppText variant="caption" color="brand" style={{ marginLeft: spacing.sm, fontWeight: '700' }}>
              {rec.costAmount > 0 ? formatCost(rec.costAmount, rec.costCurrency) : 'Free'}
            </AppText>
          </View>
        </View>
      </Pressable>
      <Pressable
        onPress={onDelete}
        hitSlop={8}
        style={styles.deleteBtn}
        accessibilityRole="button"
        accessibilityLabel={`Delete ${rec.title}`}
      >
        <Ionicons name="trash-outline" size={20} color={colors.danger} />
      </Pressable>
    </View>
  );
}

function EditProfileModal({
  visible,
  initial,
  onClose,
  onSave,
}: {
  visible: boolean;
  initial: { displayName: string; bio: string; homeBase: string };
  onClose: () => void;
  onSave: (patch: { displayName: string; bio: string; homeBase: string }) => Promise<void>;
}) {
  const { colors } = useTheme();
  const [displayName, setDisplayName] = useState(initial.displayName);
  const [bio, setBio] = useState(initial.bio);
  const [homeBase, setHomeBase] = useState(initial.homeBase);
  const [saving, setSaving] = useState(false);

  React.useEffect(() => {
    if (visible) {
      setDisplayName(initial.displayName);
      setBio(initial.bio);
      setHomeBase(initial.homeBase);
    }
  }, [visible, initial]);

  const save = async () => {
    setSaving(true);
    try {
      await onSave({ displayName: displayName.trim() || initial.displayName, bio, homeBase });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={[styles.backdrop, { backgroundColor: colors.scrim }]} onPress={onClose} />
      <View style={[styles.sheet, { backgroundColor: colors.bg }]}>
        <View style={styles.sheetHeader}>
          <AppText variant="heading">Edit profile</AppText>
          <Pressable onPress={onClose} hitSlop={8} accessibilityLabel="Close">
            <Ionicons name="close" size={24} color={colors.textMuted} />
          </Pressable>
        </View>
        <View style={{ gap: spacing.lg }}>
          <EditField label="Display name" value={displayName} onChangeText={setDisplayName} />
          <EditField label="Home base" value={homeBase} onChangeText={setHomeBase} placeholder="e.g. Lisbon, PT" />
          <EditField
            label="Bio"
            value={bio}
            onChangeText={setBio}
            placeholder="A line about you"
            multiline
          />
          <Button label="Save changes" onPress={save} loading={saving} disabled={saving} />
        </View>
      </View>
    </Modal>
  );
}

function EditField({
  label,
  multiline,
  ...props
}: React.ComponentProps<typeof TextInput> & { label: string }) {
  const { colors } = useTheme();
  return (
    <View style={{ gap: spacing.sm }}>
      <AppText variant="label" color="textMuted">
        {label}
      </AppText>
      <TextInput
        placeholderTextColor={colors.textFaint}
        multiline={multiline}
        style={[
          typography.body,
          styles.editInput,
          {
            color: colors.text,
            backgroundColor: colors.surface,
            borderColor: colors.border,
            height: multiline ? 90 : 52,
            textAlignVertical: multiline ? 'top' : 'center',
          },
        ]}
        {...props}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: layout.screenPadding,
    paddingTop: spacing.md,
    paddingBottom: spacing.huge,
    gap: spacing.lg,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  inline: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  stats: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.lg,
    borderWidth: 1,
    paddingVertical: spacing.lg,
  },
  stat: { flex: 1, alignItems: 'center', gap: 2 },
  statDivider: { width: 1, height: 36 },
  actions: { flexDirection: 'row', gap: spacing.md },
  postRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.sm,
  },
  postMain: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  postImage: { width: 64, height: 64, borderRadius: radius.md, backgroundColor: '#ddd' },
  deleteBtn: { padding: spacing.md },
  backdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.xl,
    paddingBottom: spacing.huge,
    gap: spacing.lg,
  },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  editInput: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
});
