import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ForumComment, ForumPost } from '../types';
import { appTheme } from '../theme';

// ─── RedditThreadCard ──────────────────────────────────────────────────────────
export function RedditThreadCard({
  post,
  onVotePost,
  onVoteComment,
  onReplyToPost,
  onReplyToComment,
}: {
  post: ForumPost;
  onVotePost: (delta: number) => void;
  onVoteComment: (commentId: string, delta: number, replyId?: string) => void;
  onReplyToPost?: () => void;
  onReplyToComment?: (commentId: string) => void;
}) {
  return (
    <View style={styles.card}>
      {/* Post row */}
      <View style={styles.row}>
        <VoteCol votes={post.votes} onUp={() => onVotePost(1)} onDown={() => onVotePost(-1)} />
        <View style={styles.content}>
          <Text style={styles.meta}>u/{post.author}</Text>
          <Text style={styles.title}>{post.title}</Text>
          {!!post.body && <Text style={styles.body} numberOfLines={4}>{post.body}</Text>}
          {!!post.link && <Text style={styles.link}>🔗 {post.link}</Text>}
          {!!post.imageUri && (
            <View style={styles.imgPlaceholder}>
              <Text style={styles.imgText}>📷 {post.imageUri}</Text>
            </View>
          )}
          {post.tags.length > 0 && (
            <Text style={styles.tags}>{post.tags.map((t) => `#${t}`).join('  ')}</Text>
          )}
          <View style={styles.actionRow}>
            <Pressable onPress={onReplyToPost} style={styles.actionBtn}>
              <Text style={styles.actionText}>💬 {post.comments.length} comments</Text>
            </Pressable>
          </View>
        </View>
      </View>

      {/* Comment thread */}
      {post.comments.length > 0 && (
        <View style={styles.thread}>
          {post.comments.map((c) => (
            <CommentNode
              key={c.id}
              comment={c}
              depth={0}
              postId={post.id}
              onVoteComment={onVoteComment}
              onReplyToComment={onReplyToComment}
            />
          ))}
        </View>
      )}
    </View>
  );
}

// ─── CommentNode ───────────────────────────────────────────────────────────────
const MAX_DEPTH = 6;
const DEPTH_COLORS = [
  appTheme.colors.playstationBlue,
  '#e67e22',
  '#2ecc71',
  '#9b59b6',
  '#e74c3c',
  '#1abc9c',
];

function CommentNode({
  comment,
  depth,
  postId,
  onVoteComment,
  onReplyToComment,
}: {
  comment: ForumComment;
  depth: number;
  postId: string;
  onVoteComment: (commentId: string, delta: number, replyId?: string) => void;
  onReplyToComment?: (commentId: string) => void;
}) {
  const borderColor = DEPTH_COLORS[depth % DEPTH_COLORS.length];

  return (
    <View style={[styles.commentNode, { borderLeftColor: borderColor }]}>
      <View style={styles.row}>
        <VoteCol
          votes={comment.votes}
          compact
          onUp={() => onVoteComment(comment.id, 1)}
          onDown={() => onVoteComment(comment.id, -1)}
        />
        <View style={styles.content}>
          <Text style={styles.commentMeta}>u/{comment.author}</Text>
          <Text style={styles.commentBody}>{comment.body}</Text>
          <Pressable
            onPress={() => onReplyToComment?.(comment.id)}
            style={styles.replyBtn}
          >
            <Text style={styles.replyBtnText}>↩ Reply</Text>
          </Pressable>
        </View>
      </View>

      {/* Recursive replies */}
      {comment.replies && comment.replies.length > 0 && depth < MAX_DEPTH && (
        <View style={styles.replies}>
          {comment.replies.map((reply) => (
            <CommentNode
              key={reply.id}
              comment={reply}
              depth={depth + 1}
              postId={postId}
              onVoteComment={onVoteComment}
              onReplyToComment={onReplyToComment}
            />
          ))}
        </View>
      )}
    </View>
  );
}

// ─── VoteCol ───────────────────────────────────────────────────────────────────
function VoteCol({
  votes,
  onUp,
  onDown,
  compact,
}: {
  votes: number;
  onUp: () => void;
  onDown: () => void;
  compact?: boolean;
}) {
  return (
    <View style={[styles.voteCol, compact && styles.voteColCompact]}>
      <Pressable onPress={onUp} hitSlop={6}>
        <Text style={styles.voteArrow}>▲</Text>
      </Pressable>
      <Text style={[styles.voteCount, compact && styles.voteCountCompact]}>{votes}</Text>
      <Pressable onPress={onDown} hitSlop={6}>
        <Text style={styles.voteArrow}>▼</Text>
      </Pressable>
    </View>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  card: {
    backgroundColor: appTheme.surface.card,
    borderRadius: appTheme.radii.card,
    borderWidth: 1,
    borderColor: appTheme.surface.border,
    marginTop: appTheme.spacing.sm,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    padding: appTheme.spacing.sm,
    gap: appTheme.spacing.sm,
  },
  voteCol: {
    width: 28,
    alignItems: 'center',
    gap: 3,
    paddingTop: 2,
  },
  voteColCompact: {
    width: 22,
  },
  voteArrow: {
    color: appTheme.colors.bodyGray,
    fontSize: 10,
    lineHeight: 14,
  },
  voteCount: {
    color: appTheme.colors.playstationBlue,
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 14,
  },
  voteCountCompact: {
    fontSize: 11,
  },
  content: {
    flex: 1,
    gap: 4,
  },
  meta: {
    color: appTheme.colors.bodyGray,
    fontSize: 11,
    lineHeight: 14,
  },
  title: {
    color: appTheme.colors.inverseWhite,
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 19,
  },
  body: {
    color: appTheme.colors.secondaryText,
    fontSize: 13,
    lineHeight: 18,
  },
  tags: {
    color: appTheme.colors.playstationBlue,
    fontSize: 11,
    fontWeight: '600',
  },
  link: {
    color: appTheme.colors.darkLinkBlue,
    fontSize: 12,
    lineHeight: 16,
  },
  imgPlaceholder: {
    backgroundColor: appTheme.surface.input,
    borderRadius: 6,
    padding: 6,
    borderWidth: 1,
    borderColor: appTheme.surface.border,
  },
  imgText: {
    color: appTheme.colors.bodyGray,
    fontSize: 11,
  },
  actionRow: {
    flexDirection: 'row',
    gap: appTheme.spacing.sm,
    marginTop: 2,
  },
  actionBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
    backgroundColor: appTheme.surface.input,
  },
  actionText: {
    color: appTheme.colors.bodyGray,
    fontSize: 12,
    fontWeight: '500',
  },
  thread: {
    borderTopWidth: 1,
    borderTopColor: appTheme.surface.border,
  },
  commentNode: {
    borderLeftWidth: 2,
    marginLeft: appTheme.spacing.sm,
  },
  replies: {
    marginLeft: 4,
  },
  commentMeta: {
    color: appTheme.colors.bodyGray,
    fontSize: 11,
    lineHeight: 14,
  },
  commentBody: {
    color: appTheme.colors.secondaryText,
    fontSize: 13,
    lineHeight: 18,
  },
  replyBtn: {
    alignSelf: 'flex-start',
    paddingVertical: 2,
  },
  replyBtnText: {
    color: appTheme.colors.bodyGray,
    fontSize: 11,
    fontWeight: '600',
  },
});
