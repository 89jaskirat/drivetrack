import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { AdminProfile } from '../types';

interface MileageLog { id: string; date: string; distance_km: number; notes: string; created_at: string; }
interface FuelLog { id: string; date: string; litres: number; total_cost: number; station: string; created_at: string; }
interface ExpenseLog { id: string; date: string; category: string; amount: number; notes: string; created_at: string; }
interface EarningsLog { id: string; date: string; platform: string; gross: number; net: number; created_at: string; }
interface Post { id: string; title: string; body: string; zone: string; created_at: string; }
interface ActivityEvent { id: string; screen_name: string; action: string; created_at: string; }

async function fetchUserDetail(userId: string) {
  const [profileRes, mileageRes, fuelRes, expenseRes, earningsRes, postsRes, activityRes] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', userId).single(),
    supabase.from('mileage_logs').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(3),
    supabase.from('fuel_logs').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(3),
    supabase.from('expense_logs').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(3),
    supabase.from('earnings_logs').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(3),
    supabase.from('posts').select('id, title, body, zone, created_at').eq('user_id', userId).order('created_at', { ascending: false }).limit(3),
    supabase.from('activity_events').select('id, screen_name, action, created_at').eq('user_id', userId).order('created_at', { ascending: false }).limit(3),
  ]);
  return {
    profile: profileRes.data as AdminProfile | null,
    mileage: (mileageRes.data ?? []) as MileageLog[],
    fuel: (fuelRes.data ?? []) as FuelLog[],
    expenses: (expenseRes.data ?? []) as ExpenseLog[],
    earnings: (earningsRes.data ?? []) as EarningsLog[],
    posts: (postsRes.data ?? []) as Post[],
    activity: (activityRes.data ?? []) as ActivityEvent[],
  };
}

function fmt(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-CA', { month: 'short', day: 'numeric', year: 'numeric' });
}

function Section({ title, children, empty }: { title: string; children: React.ReactNode; empty: boolean }) {
  return (
    <div className="bg-surface-raised border border-surface-border rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-surface-border">
        <h3 className="text-white text-sm font-semibold">{title}</h3>
      </div>
      {empty
        ? <div className="px-4 py-4 text-gray-600 text-xs">No records</div>
        : <div>{children}</div>}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string | number | boolean | null | undefined }) {
  const display = value === null || value === undefined || value === '' ? '—'
    : typeof value === 'boolean' ? (value ? 'Yes' : 'No')
    : String(value);
  return (
    <div className="flex justify-between px-4 py-2.5 border-b border-surface-border last:border-0">
      <span className="text-gray-500 text-xs">{label}</span>
      <span className="text-gray-200 text-xs text-right max-w-[60%] truncate">{display}</span>
    </div>
  );
}

export default function UserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data, isLoading, error } = useQuery({
    queryKey: ['user-detail', id],
    queryFn: () => fetchUserDetail(id!),
    enabled: !!id,
  });

  if (isLoading) return <div className="text-gray-500 text-sm">Loading...</div>;
  if (error || !data?.profile) return <div className="text-red-400 text-sm">User not found.</div>;

  const { profile, mileage, fuel, expenses, earnings, posts, activity } = data;

  return (
    <div>
      {/* Back */}
      <button
        onClick={() => navigate('/users')}
        className="flex items-center gap-2 text-gray-400 hover:text-white text-sm mb-6 transition-colors"
      >
        ← Back to Users
      </button>

      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <div className="w-12 h-12 rounded-full bg-brand flex items-center justify-center text-white font-bold text-lg">
          {(profile.name || profile.email || '?')[0].toUpperCase()}
        </div>
        <div>
          <h1 className="text-white text-xl font-bold">{profile.name || '(no name)'}</h1>
          <div className="text-gray-400 text-sm">{profile.email}</div>
        </div>
        <div className="ml-auto">
          <span className={`text-xs px-2 py-0.5 rounded-full ${
            profile.role === 'superAdmin' ? 'bg-purple-500/20 text-purple-300' :
            profile.role === 'cityAdmin'  ? 'bg-blue-500/20 text-blue-300' :
                                           'bg-gray-500/20 text-gray-400'
          }`}>{profile.role}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {/* Profile attributes */}
        <Section title="Profile" empty={false}>
          <Row label="Zone" value={profile.zone} />
          <Row label="Phone" value={profile.phone} />
          <Row label="GPS Consent" value={profile.gps_consent} />
          <Row label="Joined" value={fmt(profile.created_at)} />
        </Section>

        {/* Mileage */}
        <Section title="Recent Mileage (last 3)" empty={mileage.length === 0}>
          {mileage.map((r) => (
            <div key={r.id} className="flex justify-between px-4 py-2.5 border-b border-surface-border last:border-0">
              <span className="text-gray-400 text-xs">{fmt(r.date)}</span>
              <span className="text-gray-200 text-xs">{r.distance_km} km{r.notes ? ` · ${r.notes}` : ''}</span>
            </div>
          ))}
        </Section>

        {/* Fuel */}
        <Section title="Recent Fuel (last 3)" empty={fuel.length === 0}>
          {fuel.map((r) => (
            <div key={r.id} className="flex justify-between px-4 py-2.5 border-b border-surface-border last:border-0">
              <span className="text-gray-400 text-xs">{fmt(r.date)}</span>
              <span className="text-gray-200 text-xs">{r.litres}L · ${r.total_cost}{r.station ? ` · ${r.station}` : ''}</span>
            </div>
          ))}
        </Section>

        {/* Expenses */}
        <Section title="Recent Expenses (last 3)" empty={expenses.length === 0}>
          {expenses.map((r) => (
            <div key={r.id} className="flex justify-between px-4 py-2.5 border-b border-surface-border last:border-0">
              <span className="text-gray-400 text-xs">{fmt(r.date)} · {r.category}</span>
              <span className="text-gray-200 text-xs">${r.amount}{r.notes ? ` · ${r.notes}` : ''}</span>
            </div>
          ))}
        </Section>

        {/* Earnings */}
        <Section title="Recent Earnings (last 3)" empty={earnings.length === 0}>
          {earnings.map((r) => (
            <div key={r.id} className="flex justify-between px-4 py-2.5 border-b border-surface-border last:border-0">
              <span className="text-gray-400 text-xs">{fmt(r.date)} · {r.platform}</span>
              <span className="text-gray-200 text-xs">Gross ${r.gross} · Net ${r.net}</span>
            </div>
          ))}
        </Section>

        {/* Posts */}
        <Section title="Recent Posts (last 3)" empty={posts.length === 0}>
          {posts.map((r) => (
            <div key={r.id} className="px-4 py-2.5 border-b border-surface-border last:border-0">
              <div className="text-gray-200 text-xs font-medium truncate">{r.title}</div>
              <div className="text-gray-500 text-xs mt-0.5">{fmt(r.created_at)} · {r.zone}</div>
            </div>
          ))}
        </Section>

        {/* Activity */}
        <Section title="Latest Activity (last 3)" empty={activity.length === 0}>
          {activity.map((r) => (
            <div key={r.id} className="flex justify-between px-4 py-2.5 border-b border-surface-border last:border-0">
              <span className="text-gray-400 text-xs">{r.screen_name} · {r.action}</span>
              <span className="text-gray-500 text-xs">{fmt(r.created_at)}</span>
            </div>
          ))}
        </Section>
      </div>
    </div>
  );
}
