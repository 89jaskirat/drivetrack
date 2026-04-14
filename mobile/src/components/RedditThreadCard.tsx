import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ForumComment, ForumPost } from '../types';
import { appTheme } from '../theme';
import { ComponentLabel } from './ComponentLabel';

export function RedditThreadCard({
  post,
  onVotePost,
  onVoteComment,
}: {
  post: ForumPost;
  onVotePost: (delta: number) => void;
  onVoteComment: (commentId: string, delta: number, replyId?: string) => void;
}) {
  return (
    <View style={styles.card}>
      <ComponentLabel name="RedditThreadCard" tone="light" />
      <View style={styles.row}>
        <VoteColumn votes={post.votes} onUpvote={() => onVotePost(1)} onDownvote={() => onVotePost(-1)} />
        <View style={styles.content}>
          <Text style={styles.meta}>u/{post.author}</Text>
          <Text style={styles.title}>{post.title}</Text>
          <Text style={styles.body}>{post.body}</Text>
          <Text style={styles.tags}>{post.tags.map((tag) => `#${tag}`).join('  ')}</Text>
          <View style={styles.commentStack}>
            {post.comments.map((comment) => (
              <CommentNode key={comment.id} comment={comment} depth={0} onVoteComment={onVoteComment} />
            ))}
          </View>
        </View>
      </View>
    </View>
  );
}

function CommentNode({
  comment,
  depth,
  onVoteComment,
}: {
  comment: ForumComment;
  depth: number;
  onVoteComment: (commentId: string, delta: number, replyId?: string) => void;
}) {
  return (
    <View style={[styles.commentNode, depth > 0 && styles.replyNode]}>
      <View style={styles.row}>
        <VoteColumn
          votes={comment.votes}
          compact
          onUpvote={() => onVoteComment(comment.id, 1)}
          onDownvote={() => onVoteComment(comment.id, -1)}
        />
        <View style={styles.content}>
          <Text style={styles.meta}>u/{comment.author}</Text>
          <Text style={styles.commentBody}>{comment.body}</Text>
          {comment.replies?.map((reply) => (
            <View key={reply.id} style={styles.replyWrap}>
              <View style={styles.row}>
                <VoteColumn
                  votes={reply.votes}
                  compact
                  onUpvote={() => onVoteComment(comment.id, 1, reply.id)}
                  onDownvote={() => onVoteComment(comment.id, -1, reply.id)}
                />
                <View style={styles.content}>
                  <Text style={styles.meta}>u/{reply.author}</Text>
                  <Text style={styles.commentBody}>{reply.body}</Text>
                </View>
              </View>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

function VoteColumn({
  votes,
  onUpvote,
  onDownvote,
  compact,
}: {
  votes: number;
  onUpvote: () => void;
  onDownvote: () => void;
  compact?: boolean;
}) {
  return (
    <View style={[styles.voteColumn, compact && styles.voteColumnCompact]}>
      <Pressable onPress={onUpvote} style={styles.voteButton}>
        <Text style={styles.voteText}>+</Text>
      </Pressable>
      <Text style={styles.voteCount}>{votes}</Text>
      <Pressable onPress={onDownvote} style={styles.voteButton}>
        <Text style={styles.voteText}>-</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: appTheme.colors.paperWhite,
    borderRadius: appTheme.radii.card,
    padding: 18,
    marginTop: 16,
    ...appTheme.shadows.light,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  voteColumn: {
    width: 42,
    alignItems: 'center',
    gap: 6,
  },
  voteColumnCompact: {
    width: 34,
  },
  voteButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: appTheme.colors.playstationBlue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  voteText: {
    color: appTheme.colors.inverseWhite,
    fontSize: 18,
    fontWeight: '700',
  },
  voteCount: {
    color: appTheme.colors.playstationBlue,
    fontWeight: '700',
  },
  content: {
    flex: 1,
    gap: 6,
  },
  meta: {
    color: appTheme.colors.bodyGray,
    fontSize: 12,
  },
  title: {
    color: appTheme.colors.displayInk,
    fontSize: 24,
    fontWeight: '300',
  },
  body: {
    color: appTheme.colors.deepCharcoal,
    lineHeight: 21,
  },
  tags: {
    color: appTheme.colors.playstationBlue,
    fontWeight: '600',
    marginTop: 2,
  },
  commentStack: {
    gap: 12,
    marginTop: 8,
  },
  commentNode: {
    borderLeftWidth: 2,
    borderLeftColor: appTheme.colors.playstationBlue,
    paddingLeft: 12,
  },
  replyNode: {
    marginLeft: 8,
  },
  commentBody: {
    color: appTheme.colors.deepCharcoal,
    lineHeight: 20,
  },
  replyWrap: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: appTheme.colors.muteGray,
  },
});
