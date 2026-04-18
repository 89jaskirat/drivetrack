import { useNavigation } from '@react-navigation/native';
import { AppHeader } from '../components/AppHeader';
import { FAB } from '../components/FAB';
import { RedditThreadCard } from '../components/RedditThreadCard';
import { ScreenFrame } from '../components/ScreenFrame';
import { useAppState } from '../state/AppStateContext';
import { View } from 'react-native';

export function CommunityScreen() {
  const navigation = useNavigation<any>();
  const { state, votePost, voteComment } = useAppState();

  return (
    <View style={{ flex: 1 }}>
      <ScreenFrame
        header={
          <AppHeader
            title={state.profile.name}
            subtitle={`${state.profile.zone} forum`}
          />
        }
      >
        {state.posts.map((item) => (
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

      {/* FAB — new post */}
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
