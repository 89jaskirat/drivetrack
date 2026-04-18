import { useNavigation, useRoute } from '@react-navigation/native';
import { Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useAppState } from '../state/AppStateContext';
import { appTheme } from '../theme';
import { useState } from 'react';

type PostType = 'text' | 'link' | 'image';

export function ComposeScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { mode, postId, commentId, contextTitle } = route.params ?? {};

  const { state, addPost, addComment, addReply } = useAppState();

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [link, setLink] = useState('');
  const [imageUri, setImageUri] = useState('');
  const [postType, setPostType] = useState<PostType>('text');

  const isPost = mode === 'post';
  const canSubmit = isPost ? title.trim().length > 0 : body.trim().length > 0;

  // Author initials for avatar
  const initials = state.profile.name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  function handleSubmit() {
    if (!canSubmit) return;
    if (isPost) {
      addPost({
        title: title.trim(),
        body: body.trim(),
        link: postType === 'link' ? link.trim() || undefined : undefined,
        imageUri: postType === 'image' && imageUri ? imageUri : undefined,
      });
    } else if (commentId) {
      addReply(postId, commentId, body.trim());
    } else {
      addComment(postId, body.trim());
    }
    navigation.goBack();
  }

  function handlePickImage() {
    if (Platform.OS === 'web') {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*,video/*';
      input.onchange = (e: any) => {
        const file = e.target?.files?.[0];
        if (file) setImageUri(file.name);
      };
      input.click();
    }
  }

  return (
    <View style={styles.screen}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={10} style={styles.closeBtn}>
          <Text style={styles.closeIcon}>✕</Text>
        </Pressable>

        <View style={styles.communityPill}>
          <Text style={styles.communityIcon}>◉</Text>
          <Text style={styles.communityName} numberOfLines={1}>
            {isPost ? `${state.profile.zone} · drivers` : contextTitle ?? 'Reply'}
          </Text>
        </View>

        <Pressable
          onPress={handleSubmit}
          style={[styles.postBtn, !canSubmit && styles.postBtnDisabled]}
          disabled={!canSubmit}
        >
          <Text style={[styles.postBtnText, !canSubmit && styles.postBtnTextDisabled]}>
            {isPost ? 'Post' : 'Reply'}
          </Text>
        </Pressable>
      </View>

      {/* Post type tabs — only for new posts */}
      {isPost && (
        <View style={styles.typeTabs}>
          {(['text', 'link', 'image'] as PostType[]).map((t) => (
            <Pressable
              key={t}
              style={[styles.typeTab, postType === t && styles.typeTabActive]}
              onPress={() => setPostType(t)}
            >
              <Text style={styles.typeTabIcon}>
                {t === 'text' ? '≡' : t === 'link' ? '🔗' : '🖼'}
              </Text>
              <Text style={[styles.typeTabText, postType === t && styles.typeTabTextActive]}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </Text>
            </Pressable>
          ))}
        </View>
      )}

      {/* Reply context bar */}
      {!isPost && contextTitle && (
        <View style={styles.replyContext}>
          <View style={styles.replyLine} />
          <Text style={styles.replyingTo} numberOfLines={1}>
            Replying to: {contextTitle}
          </Text>
        </View>
      )}

      <ScrollView style={styles.body} keyboardShouldPersistTaps="handled" contentContainerStyle={styles.bodyContent}>
        {/* Author row */}
        <View style={styles.authorRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarInitials}>{initials}</Text>
          </View>
          <View>
            <Text style={styles.authorName}>{state.profile.name}</Text>
            <Text style={styles.authorMeta}>{state.profile.zone} · driver</Text>
          </View>
        </View>

        {/* Title — posts only */}
        {isPost && (
          <View style={styles.titleWrap}>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="An interesting title"
              placeholderTextColor={appTheme.colors.bodyGray}
              style={styles.titleInput}
              maxLength={300}
              multiline
              autoFocus
            />
            <Text style={styles.charCount}>{title.length}/300</Text>
          </View>
        )}

        {/* Body or link depending on post type */}
        {(!isPost || postType === 'text') && (
          <TextInput
            value={body}
            onChangeText={setBody}
            placeholder={isPost ? 'Add text (optional)' : 'Write your comment…'}
            placeholderTextColor={appTheme.colors.bodyGray}
            style={styles.bodyInput}
            multiline
            autoFocus={!isPost}
            textAlignVertical="top"
          />
        )}

        {isPost && postType === 'link' && (
          <View style={styles.linkBox}>
            <Text style={styles.linkBoxLabel}>URL</Text>
            <TextInput
              value={link}
              onChangeText={setLink}
              placeholder="https://..."
              placeholderTextColor={appTheme.colors.bodyGray}
              style={styles.linkInput}
              autoCapitalize="none"
              keyboardType="url"
              autoFocus
            />
          </View>
        )}

        {isPost && postType === 'image' && (
          <Pressable style={styles.imagePickerArea} onPress={handlePickImage}>
            {imageUri ? (
              <View style={styles.imagePreview}>
                <Text style={styles.imagePreviewIcon}>📷</Text>
                <Text style={styles.imagePreviewName} numberOfLines={1}>{imageUri}</Text>
                <Pressable onPress={() => setImageUri('')} hitSlop={8} style={styles.imageRemove}>
                  <Text style={styles.imageRemoveText}>✕</Text>
                </Pressable>
              </View>
            ) : (
              <View style={styles.imagePickerEmpty}>
                <Text style={styles.imagePickerIcon}>📷</Text>
                <Text style={styles.imagePickerLabel}>Tap to add photo or video</Text>
              </View>
            )}
          </Pressable>
        )}
      </ScrollView>

      {/* Toolbar */}
      <View style={styles.toolbar}>
        <Pressable style={styles.toolBtn} onPress={handlePickImage}>
          <Text style={styles.toolIcon}>📷</Text>
        </Pressable>
        <Pressable style={styles.toolBtn} onPress={() => setPostType('link')}>
          <Text style={styles.toolIcon}>🔗</Text>
        </Pressable>
        <View style={styles.toolSpacer} />
        <Pressable
          style={[styles.submitFab, !canSubmit && styles.submitFabDisabled]}
          onPress={handleSubmit}
          disabled={!canSubmit}
        >
          <Text style={styles.submitFabText}>{isPost ? '✦ Post' : '↩ Reply'}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: appTheme.surface.screen,
  },

  // ── Top bar ──────────────────────────────────────────────────────────────────
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 52,
    paddingHorizontal: appTheme.spacing.base,
    paddingBottom: appTheme.spacing.md,
    gap: appTheme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: appTheme.surface.border,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: appTheme.surface.input,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeIcon: {
    color: appTheme.colors.secondaryText,
    fontSize: 14,
    fontWeight: '600',
  },
  communityPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: appTheme.spacing.sm,
    backgroundColor: appTheme.surface.input,
    borderRadius: appTheme.radii.button,
    paddingHorizontal: appTheme.spacing.md,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: appTheme.surface.border,
  },
  communityIcon: {
    color: appTheme.colors.playstationBlue,
    fontSize: 14,
  },
  communityName: {
    color: appTheme.colors.inverseWhite,
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  postBtn: {
    backgroundColor: appTheme.colors.playstationBlue,
    paddingHorizontal: appTheme.spacing.lg,
    paddingVertical: 9,
    borderRadius: appTheme.radii.button,
  },
  postBtnDisabled: {
    backgroundColor: appTheme.surface.border,
  },
  postBtnText: {
    color: appTheme.colors.inverseWhite,
    fontSize: 14,
    fontWeight: '700',
  },
  postBtnTextDisabled: {
    color: appTheme.colors.bodyGray,
  },

  // ── Post type tabs ────────────────────────────────────────────────────────────
  typeTabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: appTheme.surface.border,
  },
  typeTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: appTheme.spacing.md,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  typeTabActive: {
    borderBottomColor: appTheme.colors.playstationBlue,
  },
  typeTabIcon: {
    fontSize: 14,
  },
  typeTabText: {
    color: appTheme.colors.bodyGray,
    fontSize: 13,
    fontWeight: '600',
  },
  typeTabTextActive: {
    color: appTheme.colors.inverseWhite,
  },

  // ── Reply context ─────────────────────────────────────────────────────────────
  replyContext: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: appTheme.spacing.sm,
    paddingHorizontal: appTheme.spacing.base,
    paddingVertical: appTheme.spacing.sm,
    backgroundColor: appTheme.surface.card,
    borderBottomWidth: 1,
    borderBottomColor: appTheme.surface.border,
  },
  replyLine: {
    width: 3,
    height: 24,
    backgroundColor: appTheme.colors.playstationBlue,
    borderRadius: 2,
  },
  replyingTo: {
    flex: 1,
    color: appTheme.colors.bodyGray,
    fontSize: 12,
    fontStyle: 'italic',
  },

  // ── Scrollable body ───────────────────────────────────────────────────────────
  body: {
    flex: 1,
  },
  bodyContent: {
    padding: appTheme.spacing.base,
    gap: appTheme.spacing.lg,
    paddingBottom: 40,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: appTheme.spacing.md,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: appTheme.colors.playstationBlue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    color: appTheme.colors.inverseWhite,
    fontSize: 15,
    fontWeight: '700',
  },
  authorName: {
    color: appTheme.colors.inverseWhite,
    fontSize: 14,
    fontWeight: '600',
  },
  authorMeta: {
    color: appTheme.colors.bodyGray,
    fontSize: 12,
    marginTop: 2,
  },
  titleWrap: {
    gap: appTheme.spacing.xs,
  },
  titleInput: {
    color: appTheme.colors.inverseWhite,
    fontSize: 22,
    fontWeight: '300',
    lineHeight: 30,
    letterSpacing: 0.1,
    minHeight: 64,
    textAlignVertical: 'top',
  },
  charCount: {
    color: appTheme.colors.bodyGray,
    fontSize: 11,
    textAlign: 'right',
  },
  bodyInput: {
    color: appTheme.colors.secondaryText,
    fontSize: 15,
    lineHeight: 24,
    minHeight: 160,
    textAlignVertical: 'top',
  },
  linkBox: {
    backgroundColor: appTheme.surface.card,
    borderRadius: appTheme.radii.card,
    padding: appTheme.spacing.base,
    gap: appTheme.spacing.sm,
    borderWidth: 1,
    borderColor: appTheme.surface.border,
  },
  linkBoxLabel: {
    color: appTheme.colors.bodyGray,
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  linkInput: {
    color: appTheme.colors.darkLinkBlue,
    fontSize: 14,
    lineHeight: 20,
  },
  imagePickerArea: {
    borderRadius: appTheme.radii.card,
    borderWidth: 2,
    borderColor: appTheme.surface.border,
    borderStyle: 'dashed',
    overflow: 'hidden',
  },
  imagePickerEmpty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    gap: appTheme.spacing.md,
  },
  imagePickerIcon: {
    fontSize: 36,
  },
  imagePickerLabel: {
    color: appTheme.colors.bodyGray,
    fontSize: 14,
  },
  imagePreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: appTheme.spacing.md,
    padding: appTheme.spacing.base,
    backgroundColor: appTheme.surface.input,
  },
  imagePreviewIcon: { fontSize: 20 },
  imagePreviewName: {
    flex: 1,
    color: appTheme.colors.secondaryText,
    fontSize: 13,
  },
  imageRemove: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: appTheme.surface.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageRemoveText: {
    color: appTheme.colors.secondaryText,
    fontSize: 12,
    fontWeight: '600',
  },

  // ── Bottom toolbar ────────────────────────────────────────────────────────────
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: appTheme.spacing.sm,
    paddingHorizontal: appTheme.spacing.base,
    paddingVertical: appTheme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: appTheme.surface.border,
    backgroundColor: appTheme.surface.card,
  },
  toolBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: appTheme.surface.input,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: appTheme.surface.border,
  },
  toolIcon: { fontSize: 16 },
  toolSpacer: { flex: 1 },
  submitFab: {
    backgroundColor: appTheme.colors.playstationBlue,
    paddingHorizontal: appTheme.spacing.xl,
    paddingVertical: 12,
    borderRadius: appTheme.radii.button,
  },
  submitFabDisabled: {
    backgroundColor: appTheme.surface.border,
  },
  submitFabText: {
    color: appTheme.colors.inverseWhite,
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});
