import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase, writeAuditLog } from '../lib/supabase';
import type { Zone } from '../types';

async function fetchZones(): Promise<Zone[]> {
  const { data, error } = await supabase.from('zones').select('*').order('name');
  if (error) throw error;
  return data as Zone[];
}

export default function ZonesPage() {
  const qc = useQueryClient();
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newCity, setNewCity] = useState('');
  const [err, setErr] = useState('');

  const { data: zones = [], isLoading } = useQuery({ queryKey: ['zones'], queryFn: fetchZones });

  const addZone = useMutation({
    mutationFn: async () => {
      if (!newName.trim() || !newCity.trim()) throw new Error('Name and city are required.');
      const { error } = await supabase.from('zones').insert({ name: newName.trim(), city: newCity.trim() });
      if (error) throw error;
      const { data: { session } } = await supabase.auth.getSession();
      if (session) await writeAuditLog(session.user.id, 'create_zone', 'zones', undefined, { name: newName, city: newCity });
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['zones'] }); setAdding(false); setNewName(''); setNewCity(''); setErr(''); },
    onError: (e: Error) => setErr(e.message),
  });

  const toggleZone = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await supabase.from('zones').update({ active }).eq('id', id);
      if (error) throw error;
      const { data: { session } } = await supabase.auth.getSession();
      if (session) await writeAuditLog(session.user.id, active ? 'activate_zone' : 'deactivate_zone', 'zones', id);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['zones'] }),
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-white text-xl font-bold">Zones</h1>
        <button
          onClick={() => setAdding(true)}
          className="bg-brand hover:bg-brand-dark text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          + Add Zone
        </button>
      </div>

      {isLoading && <div className="text-gray-500 text-sm">Loading zones...</div>}

      <div className="bg-surface-raised border border-surface-border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-surface-border">
              <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium">Zone Name</th>
              <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium">City</th>
              <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium">Status</th>
              <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {zones.map((z) => (
              <tr key={z.id} className="border-b border-surface-border last:border-0 hover:bg-surface/50">
                <td className="px-4 py-3 text-white font-medium">{z.name}</td>
                <td className="px-4 py-3 text-gray-400">{z.city}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${z.active ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-500'}`}>
                    {z.active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => toggleZone.mutate({ id: z.id, active: !z.active })}
                    className="text-xs text-brand hover:underline"
                  >
                    {z.active ? 'Deactivate' : 'Activate'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {zones.length === 0 && !isLoading && (
          <div className="text-gray-500 text-sm px-4 py-6 text-center">No zones yet.</div>
        )}
      </div>

      {adding && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-surface-raised border border-surface-border rounded-xl p-6 w-full max-w-sm">
            <div className="text-white font-semibold mb-4">Add Zone</div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">Zone Name</label>
                <input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full bg-surface border border-surface-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand"
                  placeholder="e.g. Red Deer"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">City</label>
                <input
                  value={newCity}
                  onChange={(e) => setNewCity(e.target.value)}
                  className="w-full bg-surface border border-surface-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand"
                  placeholder="e.g. Red Deer"
                />
              </div>
              {err && <div className="text-red-400 text-xs">{err}</div>}
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => addZone.mutate()}
                disabled={addZone.isPending}
                className="flex-1 bg-brand hover:bg-brand-dark disabled:opacity-50 text-white text-sm font-medium rounded-lg py-2 transition-colors"
              >
                {addZone.isPending ? 'Adding...' : 'Add'}
              </button>
              <button
                onClick={() => { setAdding(false); setErr(''); }}
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
