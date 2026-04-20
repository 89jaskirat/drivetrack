import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

const CATEGORIES = ['Mechanics', 'Gas', 'Insurance', 'Restaurants', 'Other'];
const ZONES = ['Calgary', 'Edmonton', 'Red Deer'];

interface Deal {
  id: string;
  sponsor: string;
  category: string;
  headline: string;
  detail: string;
  cta: string;
  zone: string;
  start_date: string;
  end_date: string | null;
  active: boolean;
  created_at: string;
}

const TODAY = new Date().toISOString().split('T')[0];

const EMPTY: Omit<Deal, 'id' | 'created_at'> = {
  sponsor: '', category: 'Other', headline: '', detail: '',
  cta: 'Learn more', zone: 'Calgary', start_date: TODAY, end_date: null, active: true,
};

async function fetchDeals(): Promise<Deal[]> {
  const { data, error } = await supabase
    .from('deals')
    .select('*')
    .order('start_date', { ascending: false });
  if (error) throw error;
  return data as Deal[];
}

function statusLabel(deal: Deal): { label: string; cls: string } {
  if (!deal.active) return { label: 'Inactive', cls: 'bg-gray-500/20 text-gray-500' };
  const today = TODAY;
  if (deal.start_date > today) return { label: 'Scheduled', cls: 'bg-yellow-500/20 text-yellow-400' };
  if (deal.end_date && deal.end_date < today) return { label: 'Expired', cls: 'bg-red-500/20 text-red-400' };
  return { label: 'Live', cls: 'bg-green-500/20 text-green-400' };
}

export default function PromotionsPage() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Deal | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [form, setForm] = useState<Omit<Deal, 'id' | 'created_at'>>(EMPTY);
  const [err, setErr] = useState('');

  const { data: deals = [], isLoading } = useQuery({ queryKey: ['deals'], queryFn: fetchDeals });

  const save = useMutation({
    mutationFn: async () => {
      if (!form.sponsor.trim() || !form.headline.trim()) throw new Error('Sponsor and headline are required.');
      if (form.end_date && form.end_date < form.start_date) throw new Error('End date must be after start date.');
      if (isNew) {
        const { error } = await supabase.from('deals').insert(form);
        if (error) throw error;
      } else if (editing) {
        const { error } = await supabase.from('deals').update(form).eq('id', editing.id);
        if (error) throw error;
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['deals'] }); closeModal(); },
    onError: (e: Error) => setErr(e.message),
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await supabase.from('deals').update({ active }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['deals'] }),
  });

  function openNew() {
    setForm({ ...EMPTY });
    setIsNew(true);
    setEditing(null);
    setErr('');
  }

  function openEdit(d: Deal) {
    setForm({ sponsor: d.sponsor, category: d.category, headline: d.headline, detail: d.detail,
      cta: d.cta, zone: d.zone, start_date: d.start_date, end_date: d.end_date, active: d.active });
    setEditing(d);
    setIsNew(false);
    setErr('');
  }

  function closeModal() { setEditing(null); setIsNew(false); setErr(''); }

  const showModal = isNew || editing != null;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-white text-xl font-bold">Promotions</h1>
        <button onClick={openNew} className="bg-brand hover:bg-brand-dark text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
          + New Deal
        </button>
      </div>

      {isLoading && <div className="text-gray-500 text-sm">Loading deals...</div>}

      <div className="space-y-3">
        {deals.map((d) => {
          const { label, cls } = statusLabel(d);
          return (
            <div key={d.id} className="bg-surface-raised border border-surface-border rounded-xl px-4 py-3">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${cls}`}>{label}</span>
                    <span className="text-xs text-gray-600 px-2 py-0.5 bg-surface rounded-full">{d.category}</span>
                    <span className="text-xs text-gray-600">{d.zone}</span>
                  </div>
                  <div className="text-white text-sm font-medium">{d.headline}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{d.sponsor}</div>
                  <div className="flex gap-3 text-xs text-gray-600 mt-1.5">
                    <span>From: {d.start_date}</span>
                    {d.end_date
                      ? <span>To: {d.end_date}</span>
                      : <span className="text-gray-700">No expiry</span>}
                  </div>
                </div>
                <div className="shrink-0 flex items-center gap-3">
                  <button onClick={() => toggleActive.mutate({ id: d.id, active: !d.active })}
                    className={`text-xs hover:underline ${d.active ? 'text-red-400' : 'text-green-400'}`}>
                    {d.active ? 'Deactivate' : 'Activate'}
                  </button>
                  <button onClick={() => openEdit(d)} className="text-xs text-brand hover:underline">
                    Edit
                  </button>
                </div>
              </div>
            </div>
          );
        })}
        {deals.length === 0 && !isLoading && (
          <div className="text-gray-500 text-sm text-center py-8">No promotions yet.</div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-surface-raised border border-surface-border rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="text-white font-semibold mb-4">{isNew ? 'New Promotion' : 'Edit Promotion'}</div>
            <div className="space-y-4">
              {/* Sponsor + Category */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-400 mb-1.5">Sponsor / Business</label>
                  <input value={form.sponsor} onChange={(e) => setForm((f) => ({ ...f, sponsor: e.target.value }))}
                    className="w-full bg-surface border border-surface-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand"
                    placeholder="e.g. Jiffy Lube" />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1.5">Category</label>
                  <select value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                    className="w-full bg-surface border border-surface-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand">
                    {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              {/* Headline */}
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">Headline</label>
                <input value={form.headline} onChange={(e) => setForm((f) => ({ ...f, headline: e.target.value }))}
                  className="w-full bg-surface border border-surface-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand"
                  placeholder="e.g. 20% off oil changes this week" />
              </div>

              {/* Detail */}
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">Detail</label>
                <textarea rows={3} value={form.detail} onChange={(e) => setForm((f) => ({ ...f, detail: e.target.value }))}
                  className="w-full bg-surface border border-surface-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand resize-none"
                  placeholder="Additional description or terms..." />
              </div>

              {/* CTA + Zone */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-400 mb-1.5">Call to Action</label>
                  <input value={form.cta} onChange={(e) => setForm((f) => ({ ...f, cta: e.target.value }))}
                    className="w-full bg-surface border border-surface-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand"
                    placeholder="e.g. Book now" />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1.5">Zone</label>
                  <select value={form.zone} onChange={(e) => setForm((f) => ({ ...f, zone: e.target.value }))}
                    className="w-full bg-surface border border-surface-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand">
                    {ZONES.map((z) => <option key={z}>{z}</option>)}
                  </select>
                </div>
              </div>

              {/* Date range */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-400 mb-1.5">Start Date</label>
                  <input type="date" value={form.start_date} onChange={(e) => setForm((f) => ({ ...f, start_date: e.target.value }))}
                    className="w-full bg-surface border border-surface-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand" />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1.5">End Date <span className="text-gray-600">(optional)</span></label>
                  <input type="date" value={form.end_date ?? ''} onChange={(e) => setForm((f) => ({ ...f, end_date: e.target.value || null }))}
                    className="w-full bg-surface border border-surface-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand" />
                </div>
              </div>

              {/* Active toggle */}
              <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                <input type="checkbox" checked={form.active} onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))}
                  className="rounded" />
                Active (visible to drivers)
              </label>

              {err && <div className="text-red-400 text-xs bg-red-400/10 rounded-lg px-3 py-2">{err}</div>}
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => save.mutate()} disabled={save.isPending}
                className="flex-1 bg-brand hover:bg-brand-dark disabled:opacity-50 text-white text-sm font-medium rounded-lg py-2 transition-colors">
                {save.isPending ? 'Saving...' : 'Save'}
              </button>
              <button onClick={closeModal}
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
