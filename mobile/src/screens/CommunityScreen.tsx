import { useNavigation } from '@react-navigation/native';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { ActionButton } from '../components/ActionButton';
import { AppHeader } from '../components/AppHeader';
import { AppMenu } from '../components/AppMenu';
import { RedditThreadCard } from '../components/RedditThreadCard';
import { ScreenFrame } from '../components/ScreenFrame';
import { SurfaceCard } from '../components/SurfaceCard';
import { useAppState } from '../state/AppStateContext';
import { appTheme } from '../theme';
import { Field } from './shared/Field';

export function CommunityScreen() {
  const navigation = useNavigation<any>();
  const { state, addPost, votePost, voteComment } = useAppState();
  const [menuOpen, setMenuOpen] = useState(false);
  const [post, setPost] = useState({ title: '', body: '' });

  return (
    <View style={{ flex: 1 }}>
      <ScreenFrame
        header={
          <AppHeader
            title={state.profile.name}
            subtitle={`${state.profile.zone} forum`}
            onMenuPress={() => setMenuOpen(true)}
            onProfilePress={() => navigation.navigate('Profile')}
          />
        }
      >
        <SurfaceCard componentName="CommunityComposerPanel" title="Start a thread" subtitle="Post like a local subreddit, not a generic feed.">
          <Field label="Title" value={post.title} onChangeText={(value) => setPost({ ...post, title: value })} />
          <Field label="Body" value={post.body} onChangeText={(value) => setPost({ ...post, body: value })} multiline />
          <ActionButton
            label="Publish thread"
            onPress={() => {
              addPost(post);
              setPost({ title: '', body: '' });
            }}
          />
        </SurfaceCard>

        {state.posts.map((item) => (
          <RedditThreadCard
            key={item.id}
            post={item}
            onVotePost={(delta) => votePost(item.id, delta)}
            onVoteComment={(commentId, delta, replyId) => voteComment(item.id, commentId, delta, replyId)}
          />
        ))}
      </ScreenFrame>

      <AppMenu
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        onProfilePress={() => {
          setMenuOpen(false);
          navigation.navigate('Profile');
        }}
        onSettingsPress={() => {
          setMenuOpen(false);
          navigation.navigate('Settings');
        }}
      />
    </View>
  );
}
