import type { Role } from '../types';

interface Props {
  role: Role | null;
  require: Role | Role[];
  children: React.ReactNode;
}

/**
 * Renders children only if the current admin's role satisfies the requirement.
 * Use to hide Super Admin-only controls from City Admins.
 */
export default function RoleGuard({ role, require, children }: Props) {
  const allowed = Array.isArray(require) ? require : [require];
  if (!role || !allowed.includes(role)) return null;
  return <>{children}</>;
}
