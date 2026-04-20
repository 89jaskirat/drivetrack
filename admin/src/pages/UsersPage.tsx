import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase, writeAuditLog } from '../lib/supabase';
import { useOutletContext } from 'react-router-dom';
import type { AdminProfile, Role } from '../types';
import RoleGuard from '../components/RoleGuard';

const ROLES: Role[] = ['driver', 'cityAdmin', 'superAdmin'];
const ZONES = ['Calgary', 'Edmonton', 'Red Deer'];

async function fetchUsers(): Promise<AdminProfile[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, name, email, phone, role, zone, gps_consent, created_at')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data as AdminProfile[];
}

export default function UsersPage() {
  const { role: adminRole } = useOutletContext<{ role: Role }>();
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [filterZone, setFilterZone] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [editing, setEditing] = useState<AdminProfile | null>(null);

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: fetchUsers,
  });

  const updateUser = useMutation({
    mutationFn: async (updates: { id: string; role: Role; zone: string }) => {
      const { error } = await supabase
        .from('profiles')
        .update({ role: updates.role, zone: updates.zone })
        .eq('id', updates.id);
      if (error) throw error;

      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        await writeAuditLog(session.user.id, 'update_user_role_zone', 'profiles', updates.id, {
          role: updates.role, zone: updates.zone,
        });
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['users'] }); setEditing(null); },
  });

  const filtered = users.filter((u) => {
    const matchSearch = !search || u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase());
    const matchZone = !filterZone || u.zone === filterZone;
    const matchRole = !filterRole || u.role === filterRole;
    return matchSearch && matchZone && matchRole;
  });

  return (
    <div>
      <h1 className="text-white text-xl font-bold mb-6">Users</h1>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search name or email..."
          className="bg-surface-raised border border-surface-border rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-brand w-56"
        />
        <select
          value={filterZone}
          onChange={(e) => setFilterZone(e.target.value)}
          className="bg-surface-raised border border-surface-border rounded-lg px-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-brand"
        >
          <option value="">All zones</option>
          {ZONES.map((z) => <option key={z}>{z}</option>)}
        </select>
        <select
          value={filterRole}
          onChange={(e) => setFilterRole(e.target.value)}
          className="bg-surface-raised border border-surface-border rounded-lg px-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-brand"
        >
          <option value="">All roles</option>
          {ROLES.map((r) => <option key={r}>{r}</option>)}
        </select>
      </div>

      {isLoading && <div className="text-gray-500 text-sm">Loading users...</div>}

      {/* Table */}
      <div className="bg-surface-raised border border-surface-border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-surface-border">
              <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium">Name</th>
              <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium">Email</th>
              <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium">Role</th>
              <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium">Zone</th>
              <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium">GPS</th>
              <RoleGuard role={adminRole} require="superAdmin">
                <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium">Actions</th>
              </RoleGuard>
            </tr>
          </thead>
          <tbody>
            {filtered.map((u) => (
              <tr key={u.id} className="border-b border-surface-border last:border-0 hover:bg-surface/50">
                <td className="px-4 py-3 text-white">{u.name || '—'}</td>
                <td className="px-4 py-3 text-gray-400 text-xs">{u.email}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    u.role === 'superAdmin' ? 'bg-purple-500/20 text-purple-300' :
                    u.role === 'cityAdmin'  ? 'bg-blue-500/20 text-blue-300' :
                                             'bg-gray-500/20 text-gray-400'
                  }`}>{u.role}</span>
                </td>
                <td className="px-4 py-3 text-gray-400">{u.zone}</td>
                <td className="px-4 py-3 text-xs">{u.gps_consent ? '✓' : '—'}</td>
                <RoleGuard role={adminRole} require="superAdmin">
                  <td className="px-4 py-3">
                    <button
                      onClick={() => setEditing(u)}
                      className="text-xs text-brand hover:underline"
                    >
                      Edit
                    </button>
                  </td>
                </RoleGuard>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && !isLoading && (
          <div className="text-gray-500 text-sm px-4 py-6 text-center">No users found.</div>
        )}
      </div>

      {/* Edit modal */}
      {editing && (
        <EditModal
          user={editing}
          onClose={() => setEditing(null)}
          onSave={(role, zone) => updateUser.mutate({ id: editing.id, role, zone })}
          saving={updateUser.isPending}
        />
      )}
    </div>
  );
}

function EditModal({
  user, onClose, onSave, saving,
}: {
  user: AdminProfile;
  onClose: () => void;
  onSave: (role: Role, zone: string) => void;
  saving: boolean;
}) {
  const [role, setRole] = useState<Role>(user.role);
  const [zone, setZone] = useState(user.zone);

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-surface-raised border border-surface-border rounded-xl p-6 w-full max-w-sm">
        <div className="text-white font-semibold mb-4">Edit {user.name || user.email}</div>
        <div className="space-y-4">
          <div>
            <label className="block text-xs text-gray-400 mb-1.5">Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as Role)}
              className="w-full bg-surface border border-surface-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand"
            >
              {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1.5">Zone</label>
            <select
              value={zone}
              onChange={(e) => setZone(e.target.value)}
              className="w-full bg-surface border border-surface-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand"
            >
              {ZONES.map((z) => <option key={z} value={z}>{z}</option>)}
            </select>
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button
            onClick={() => onSave(role, zone)}
            disabled={saving}
            className="flex-1 bg-brand hover:bg-brand-dark disabled:opacity-50 text-white text-sm font-medium rounded-lg py-2 transition-colors"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-surface border border-surface-border text-gray-300 text-sm rounded-lg py-2 hover:bg-surface-border transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
