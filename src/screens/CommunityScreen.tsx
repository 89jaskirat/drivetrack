import { useNavigation } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { AppHeader } from '../components/AppHeader';
import { FAB } from '../components/FAB';
import { RedditThreadCard } from '../components/RedditThreadCard';
import { ScreenFrame } from '../components/ScreenFrame';
import { useAppState } from '../state/AppStateContext';
import { appTheme } from '../theme';

export function CommunityScreen() {
  const navigation = useNavigation<any>();
  const { state, votePost, voteComment, refreshFromCloud } = useAppState();
  const [refreshing, setRefreshing] = useState(false);
  const [query, setQuery] = useState('');

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshFromCloud();
    setRefreshing(false);
  }, [refreshFromCloud]);

  const q = query.trim().toLowerCase();
  const filtered = q
    ? state.posts.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.body.toLowerCase().includes(q) ||
          p.tags?.some((t) => t.toLowerCase().includes(q)),
      )
    : state.posts;

  return (
    <View style={styles.root}>
      <ScreenFrame
        header={
          <>
            <AppHeader
              title={state.profile.name}
              subtitle={`${state.profile.zone} forum`}
            />
            <TextInput
              style={styles.search}
              placeholder="Search posts…"
              placeholderTextColor={appTheme.colors.muted}
              value={query}
              onChangeText={setQuery}
              returnKeyType="search"
              clearButtonMode="while-editing"
            />
          </>
        }
        onRefresh={handleRefresh}
        refreshing={refreshing}
      >
        {filtered.map((item) => (
          <RedditThreadCard
            key={item.id}
            post={item}
            onVotePost={(delta) => votePost(item.id, delta)}
            onVoteComment={(commentId, delta) => voteComment(item.id, commentId, delta)}
            onReplyToPost={() =>
              navigation.navigate('Compose', {
                mode: 'comment',
                postId: item.id,
                contextTitle: item.title,
              })
            }
            onReplyToComment={(commentId) =>
              navigation.navigate('Compose', {
                mode: 'comment',
                postId: item.id,
                commentId,
                contextTitle: item.title,
              })
            }
          />
        ))}
      </ScreenFrame>

      <FAB
        items={[
          {
            label: 'New post',
            onPress: () => navigation.navigate('Compose', { mode: 'post' }),
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  search: {
    marginTop: appTheme.spacing.sm,
    marginBottom: appTheme.spacing.xs,
    paddingHorizontal: appTheme.spacing.sm,
    paddingVertical: appTheme.spacing.xs,
    backgroundColor: appTheme.surface.card,
    borderRadius: appTheme.radius.md,
    color: appTheme.colors.inverseWhite,
    fontSize: 14,
  },
});
