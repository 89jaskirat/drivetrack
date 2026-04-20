import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase, writeAuditLog } from '../lib/supabase';
import type { ForumPost, ForumComment } from '../types';

type Tab = 'posts' | 'comments';

async function fetchPosts(): Promise<ForumPost[]> {
  const { data, error } = await supabase
    .from('posts')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100);
  if (error) throw error;
  return data as ForumPost[];
}

async function fetchComments(): Promise<ForumComment[]> {
  const { data, error } = await supabase
    .from('comments')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100);
  if (error) throw error;
  return data as ForumComment[];
}

export default function ModerationPage() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<Tab>('posts');
  const [reasonModal, setReasonModal] = useState<{ table: 'posts' | 'comments'; id: string } | null>(null);
  const [reason, setReason] = useState('');

  const { data: posts = [], isLoading: postsLoading } = useQuery({ queryKey: ['mod-posts'], queryFn: fetchPosts });
  const { data: comments = [], isLoading: commentsLoading } = useQuery({ queryKey: ['mod-comments'], queryFn: fetchComments });

  const softDelete = useMutation({
    mutationFn: async ({ table, id, reason: r }: { table: 'posts' | 'comments'; id: string; reason: string }) => {
      const { data: { session } } = await supabase.auth.getSession();
      const adminId = session?.user.id ?? '';
      const { error } = await supabase
        .from(table)
        .update({ is_deleted: true, moderated_by: adminId, moderation_reason: r })
        .eq('id', id);
      if (error) throw error;
      await writeAuditLog(adminId, `delete_${table.slice(0, -1)}`, table, id, { reason: r });
    },
    onSuccess: (_, { table }) => {
      qc.invalidateQueries({ queryKey: table === 'posts' ? ['mod-posts'] : ['mod-comments'] });
      setReasonModal(null);
      setReason('');
    },
  });

  const restore = useMutation({
    mutationFn: async ({ table, id }: { table: 'posts' | 'comments'; id: string }) => {
      const { data: { session } } = await supabase.auth.getSession();
      const { error } = await supabase
        .from(table)
        .update({ is_deleted: false, moderated_by: null, moderation_reason: null })
        .eq('id', id);
      if (error) throw error;
      await writeAuditLog(session?.user.id ?? '', `restore_${table.slice(0, -1)}`, table, id);
    },
    onSuccess: (_, { table }) => {
      qc.invalidateQueries({ queryKey: table === 'posts' ? ['mod-posts'] : ['mod-comments'] });
    },
  });

  const isLoading = tab === 'posts' ? postsLoading : commentsLoading;
  const items = tab === 'posts' ? posts : comments;

  return (
    <div>
      <h1 className="text-white text-xl font-bold mb-6">Moderation</h1>

      <div className="flex gap-2 mb-4">
        {(['posts', 'comments'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${tab === t ? 'bg-brand text-white' : 'bg-surface-raised border border-surface-border text-gray-400 hover:text-white'}`}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {isLoading && <div className="text-gray-500 text-sm">Loading...</div>}

      <div className="space-y-3">
        {items.map((item) => {
          const post = item as ForumPost;
          const comment = item as ForumComment;
          const isPost = tab === 'posts';

          return (
            <div
              key={item.id}
              className={`bg-surface-raised border rounded-xl px-4 py-3 ${item.is_deleted ? 'border-red-500/20 opacity-60' : 'border-surface-border'}`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  {isPost && (
                    <div className="text-white text-sm font-medium mb-1 truncate">{post.title}</div>
                  )}
                  <div className="text-gray-400 text-xs line-clamp-2">{isPost ? post.body : comment.body}</div>
                  <div className="flex gap-3 mt-2 text-xs text-gray-600">
                    <span>{item.author_name}</span>
                    {isPost && <span>{post.zone}</span>}
                    <span>{new Date(item.created_at).toLocaleDateString()}</span>
                    {item.is_deleted && (
                      <span className="text-red-400">Removed — {item.moderation_reason}</span>
                    )}
                  </div>
                </div>
                <div className="shrink-0 flex gap-2">
                  {item.is_deleted ? (
                    <button
                      onClick={() => restore.mutate({ table: tab, id: item.id })}
                      className="text-xs text-green-400 hover:underline"
                    >
                      Restore
                    </button>
                  ) : (
                    <button
                      onClick={() => { setReasonModal({ table: tab, id: item.id }); setReason(''); }}
                      className="text-xs text-red-400 hover:underline"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {items.length === 0 && !isLoading && (
        <div className="text-gray-500 text-sm text-center py-8">No {tab} found.</div>
      )}

      {reasonModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-surface-raised border border-surface-border rounded-xl p-6 w-full max-w-sm">
            <div className="text-white font-semibold mb-4">Remove {tab.slice(0, -1)}</div>
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Reason (shown in audit log)</label>
              <input
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full bg-surface border border-surface-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand"
                placeholder="e.g. Spam, harassment, off-topic..."
              />
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => softDelete.mutate({ ...reasonModal, reason })}
                disabled={softDelete.isPending}
                className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg py-2 transition-colors"
              >
                {softDelete.isPending ? 'Removing...' : 'Remove'}
              </button>
              <button
                onClick={() => setReasonModal(null)}
                className="flex-1 bg-surface border border-surface-border text-gray-300 text-sm rounded-lg py-2 hover:bg-surface-border transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
