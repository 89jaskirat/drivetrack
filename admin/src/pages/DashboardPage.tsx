import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

interface StatCard {
  label: string;
  value: number | string;
  sub?: string;
}

function Card({ label, value, sub }: StatCard) {
  return (
    <div className="bg-surface-raised border border-surface-border rounded-xl px-5 py-4">
      <div className="text-xs text-gray-500 mb-1">{label}</div>
      <div className="text-2xl font-bold text-white">{value}</div>
      {sub && <div className="text-xs text-gray-600 mt-0.5">{sub}</div>}
    </div>
  );
}

async function fetchStats() {
  const [users, zones, posts, posts24h] = await Promise.all([
    supabase.from('profiles').select('id', { count: 'exact', head: true }),
    supabase.from('zones').select('id', { count: 'exact', head: true }).eq('active', true),
    supabase.from('posts').select('id', { count: 'exact', head: true }).eq('is_deleted', false),
    supabase
      .from('posts')
      .select('id', { count: 'exact', head: true })
      .eq('is_deleted', false)
      .gte('created_at', new Date(Date.now() - 86_400_000).toISOString()),
  ]);

  return {
    users: users.count ?? 0,
    zones: zones.count ?? 0,
    posts: posts.count ?? 0,
    posts24h: posts24h.count ?? 0,
  };
}

export default function DashboardPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: fetchStats,
    refetchInterval: 60_000,
  });

  return (
    <div>
      <h1 className="text-white text-xl font-bold mb-6">Dashboard</h1>

      {isLoading && (
        <div className="text-gray-500 text-sm">Loading stats...</div>
      )}

      {error && (
        <div className="text-red-400 text-sm bg-red-400/10 rounded-lg px-4 py-3">
          Failed to load stats. Check your Supabase credentials.
        </div>
      )}

      {data && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card label="Total Drivers" value={data.users} sub="All registered accounts" />
          <Card label="Active Zones" value={data.zones} sub="Zones with traffic" />
          <Card label="Forum Posts" value={data.posts} sub="Non-deleted posts" />
          <Card label="Posts (24h)" value={data.posts24h} sub="New in last 24 hours" />
        </div>
      )}

      <div className="mt-8 bg-surface-raised border border-surface-border rounded-xl px-5 py-4">
        <div className="text-xs text-gray-500 mb-3">Quick Actions</div>
        <div className="flex flex-wrap gap-3">
          <a href="/users"      className="text-sm text-brand hover:underline">Manage Users →</a>
          <a href="/gas-prices" className="text-sm text-brand hover:underline">Update Gas Prices →</a>
          <a href="/moderation" className="text-sm text-brand hover:underline">Review Moderation Queue →</a>
        </div>
      </div>
    </div>
  );
}
