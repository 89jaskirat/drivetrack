import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { KnowledgeArticle } from '../types';

const CATEGORIES = ['Tax', 'Maintenance', 'Tips', 'Insurance', 'Finance', 'Safety', 'Other'];

async function fetchArticles(): Promise<KnowledgeArticle[]> {
  const { data, error } = await supabase
    .from('knowledge_articles')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data as KnowledgeArticle[];
}

const EMPTY_FORM = { title: '', body: '', category: 'Tips', author_name: '', published: false };

export default function ArticlesPage() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<KnowledgeArticle | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [err, setErr] = useState('');

  const { data: articles = [], isLoading } = useQuery({ queryKey: ['articles'], queryFn: fetchArticles });

  const save = useMutation({
    mutationFn: async () => {
      if (!form.title.trim() || !form.body.trim()) throw new Error('Title and body are required.');
      if (isNew) {
        const { error } = await supabase.from('knowledge_articles').insert({
          title: form.title.trim(),
          body: form.body.trim(),
          category: form.category,
          author_name: form.author_name.trim() || 'Admin',
          published: form.published,
        });
        if (error) throw error;
      } else if (editing) {
        const { error } = await supabase.from('knowledge_articles').update({
          title: form.title.trim(),
          body: form.body.trim(),
          category: form.category,
          author_name: form.author_name.trim() || 'Admin',
          published: form.published,
        }).eq('id', editing.id);
        if (error) throw error;
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['articles'] }); setEditing(null); setIsNew(false); setForm(EMPTY_FORM); setErr(''); },
    onError: (e: Error) => setErr(e.message),
  });

  const togglePublish = useMutation({
    mutationFn: async ({ id, published }: { id: string; published: boolean }) => {
      const { error } = await supabase.from('knowledge_articles').update({ published }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['articles'] }),
  });

  function openNew() {
    setForm(EMPTY_FORM);
    setIsNew(true);
    setEditing(null);
    setErr('');
  }

  function openEdit(a: KnowledgeArticle) {
    setForm({ title: a.title, body: a.body, category: a.category, author_name: a.author_name, published: a.published });
    setEditing(a);
    setIsNew(false);
    setErr('');
  }

  const showModal = isNew || editing != null;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-white text-xl font-bold">Articles</h1>
        <button onClick={openNew} className="bg-brand hover:bg-brand-dark text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
          + New Article
        </button>
      </div>

      {isLoading && <div className="text-gray-500 text-sm">Loading articles...</div>}

      <div className="space-y-3">
        {articles.map((a) => (
          <div key={a.id} className="bg-surface-raised border border-surface-border rounded-xl px-4 py-3 flex items-center justify-between gap-4">
            <div className="min-w-0">
              <div className="text-white text-sm font-medium truncate">{a.title}</div>
              <div className="text-xs text-gray-500 mt-0.5">{a.category} · {a.author_name} · {new Date(a.created_at).toLocaleDateString()}</div>
            </div>
            <div className="shrink-0 flex items-center gap-3">
              <span className={`text-xs px-2 py-0.5 rounded-full ${a.published ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-500'}`}>
                {a.published ? 'Published' : 'Draft'}
              </span>
              <button onClick={() => togglePublish.mutate({ id: a.id, published: !a.published })} className="text-xs text-brand hover:underline">
                {a.published ? 'Unpublish' : 'Publish'}
              </button>
              <button onClick={() => openEdit(a)} className="text-xs text-gray-400 hover:text-white">
                Edit
              </button>
            </div>
          </div>
        ))}
        {articles.length === 0 && !isLoading && (
          <div className="text-gray-500 text-sm text-center py-8">No articles yet.</div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-surface-raised border border-surface-border rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="text-white font-semibold mb-4">{isNew ? 'New Article' : 'Edit Article'}</div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">Title</label>
                <input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  className="w-full bg-surface border border-surface-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand" />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">Category</label>
                <select value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                  className="w-full bg-surface border border-surface-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand">
                  {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">Author</label>
                <input value={form.author_name} onChange={(e) => setForm((f) => ({ ...f, author_name: e.target.value }))}
                  placeholder="Admin"
                  className="w-full bg-surface border border-surface-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand" />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">Body</label>
                <textarea rows={8} value={form.body} onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
                  className="w-full bg-surface border border-surface-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand resize-none" />
              </div>
              <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                <input type="checkbox" checked={form.published} onChange={(e) => setForm((f) => ({ ...f, published: e.target.checked }))}
                  className="rounded" />
                Publish immediately
              </label>
              {err && <div className="text-red-400 text-xs">{err}</div>}
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => save.mutate()} disabled={save.isPending}
                className="flex-1 bg-brand hover:bg-brand-dark disabled:opacity-50 text-white text-sm font-medium rounded-lg py-2 transition-colors">
                {save.isPending ? 'Saving...' : 'Save'}
              </button>
              <button onClick={() => { setEditing(null); setIsNew(false); setErr(''); }}
                className="flex-1 bg-surface border border-surface-border text-gray-300 text-sm rounded-lg py-2 hover:bg-surface-border transition-colors">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
