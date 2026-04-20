import { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import type { Role } from '../types';

interface Props {
  children: React.ReactNode;
  allowedRoles?: Role[];
}

type AuthState = 'loading' | 'allowed' | 'denied' | 'unauthenticated';

export default function ProtectedRoute({ children, allowedRoles = ['cityAdmin', 'superAdmin'] }: Props) {
  const [state, setState] = useState<AuthState>('loading');
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;

    async function check() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        if (mounted) setState('unauthenticated');
        return;
      }

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single();

      if (!mounted) return;

      if (error || !profile) {
        setState('denied');
        return;
      }

      const role = profile.role as Role;
      if (allowedRoles.includes(role)) {
        setState('allowed');
      } else {
        setState('denied');
      }
    }

    check();
    return () => { mounted = false; };
  }, [allowedRoles]);

  if (state === 'loading') {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-surface-border text-sm">Checking access...</div>
      </div>
    );
  }

  if (state === 'unauthenticated') return <Navigate to="/login" replace />;

  if (state === 'denied') {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-3">
        <div className="text-red-400 text-lg font-semibold">Access Denied</div>
        <div className="text-surface-border text-sm">This panel requires City Admin or Super Admin access.</div>
        <button
          className="mt-4 text-brand text-sm underline"
          onClick={async () => { await supabase.auth.signOut(); navigate('/login'); }}
        >
          Sign out
        </button>
      </div>
    );
  }

  return <>{children}</>;
}
