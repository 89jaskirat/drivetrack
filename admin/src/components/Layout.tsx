import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Role } from '../types';

const nav = [
  { to: '/',            label: 'Dashboard',   icon: '◈' },
  { to: '/users',       label: 'Users',        icon: '◉' },
  { to: '/zones',       label: 'Zones',        icon: '⬡' },
  { to: '/gas-prices',  label: 'Gas Prices',   icon: '⛽' },
  { to: '/promotions',  label: 'Promotions',   icon: '🏷' },
  { to: '/moderation',  label: 'Moderation',   icon: '🛡' },
  { to: '/articles',    label: 'Articles',     icon: '📄' },
];

export default function Layout() {
  const navigate = useNavigate();
  const [adminName, setAdminName] = useState('');
  const [role, setRole] = useState<Role | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) return;
      const { data } = await supabase
        .from('profiles')
        .select('name, role')
        .eq('id', session.user.id)
        .single();
      if (data) {
        setAdminName(data.name);
        setRole(data.role as Role);
      }
    });
  }, []);

  async function handleSignOut() {
    await supabase.auth.signOut();
    navigate('/login');
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside className="w-56 bg-surface-raised border-r border-surface-border flex flex-col shrink-0">
        <div className="px-5 py-5 border-b border-surface-border">
          <div className="text-white font-bold text-base">DriveTrack</div>
          <div className="text-xs text-gray-500 mt-0.5">Admin Panel</div>
        </div>

        <nav className="flex-1 py-4 px-3 space-y-0.5 overflow-y-auto">
          {nav.map(({ to, label, icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                  isActive
                    ? 'bg-brand text-white'
                    : 'text-gray-400 hover:bg-surface-border hover:text-white'
                }`
              }
            >
              <span className="w-4 text-center">{icon}</span>
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="px-4 py-4 border-t border-surface-border">
          <div className="text-xs text-gray-500 truncate">{adminName}</div>
          <div className="text-xs text-gray-600 mb-2">{role}</div>
          <button
            onClick={handleSignOut}
            className="w-full text-left text-xs text-red-400 hover:text-red-300 transition-colors"
          >
            Sign out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto bg-surface p-6">
        <Outlet context={{ role }} />
      </main>
    </div>
  );
}
