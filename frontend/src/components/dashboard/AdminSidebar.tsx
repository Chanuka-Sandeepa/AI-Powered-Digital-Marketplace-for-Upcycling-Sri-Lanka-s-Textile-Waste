import { LayoutDashboard, Users, MessageSquare, Store, User as UserIcon, LogOut, ShieldCheck } from 'lucide-react';
import type { ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import type { User } from '../../types';
import NotificationBell from './NotificationBell';

interface AdminSidebarProps {
  user: User;
  onLogout: () => void;
}

const AdminSidebar = ({ user, onLogout }: AdminSidebarProps) => {
  const isSuperAdmin = user.role === 'super_admin';
  const base = isSuperAdmin ? '/super-admin-dashboard' : '/admin-dashboard';
  const tone = isSuperAdmin ? 'violet' : 'teal';

  return (
    <aside className="sticky top-0 flex h-dvh w-64 shrink-0 flex-col border-r border-slate-200 bg-white shadow-[4px_0_24px_rgba(15,23,42,0.04)] xl:w-72">
      <div className="border-b border-slate-100 bg-gradient-to-br from-slate-50 to-white px-5 py-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2.5">
              <span className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${isSuperAdmin ? 'from-violet-600 to-indigo-600 shadow-violet-200' : 'from-teal-500 to-cyan-600 shadow-teal-200'} text-white shadow-lg`}><ShieldCheck size={19} /></span>
              <h1 className={`bg-gradient-to-r ${isSuperAdmin ? 'from-violet-700 to-indigo-600' : 'from-teal-700 to-cyan-600'} bg-clip-text text-xl font-extrabold tracking-tight text-transparent`}>TexCycle AI</h1>
            </div>
            <p className="ml-12 mt-1 text-[11px] font-semibold capitalize text-slate-500">{user.role.replace('_', ' ')} console</p>
          </div>
          <NotificationBell />
        </div>
      </div>

      <nav aria-label={`${user.role.replace('_', ' ')} dashboard`} className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        <MenuItem to={base} end icon={<LayoutDashboard size={18} />} label="Overview" tone={tone} />
        <MenuItem to={`${base}/users`} icon={<Users size={18} />} label={isSuperAdmin ? 'People & Roles' : 'Buyers & Sellers'} tone={tone} />
        <MenuItem to={`${base}/inquiries`} icon={<MessageSquare size={18} />} label="Inquiry Oversight" tone={tone} />

        {isSuperAdmin && <>
          <div className="mb-1 mt-5 flex items-center gap-2 px-2 pt-1">
            <span className="h-2 w-2 rounded-full bg-violet-500" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Platform controls</span>
          </div>
          <MenuItem to={`${base}/listings`} icon={<Store size={18} />} label="All Listings" tone={tone} />
        </>}

        <div className="px-3 pb-1 pt-5 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">Account</div>
        <MenuItem to="/admin-profile" icon={<UserIcon size={18} />} label="Profile" tone={tone} />
        <button type="button" onClick={onLogout} className="mt-1 flex w-full items-center gap-3 rounded-xl border-l-[3px] border-transparent px-3 py-2.5 text-left text-[13px] font-medium text-slate-600 transition hover:border-rose-300 hover:bg-rose-50 hover:text-rose-700">
          <LogOut size={18} className="text-rose-500" /><span>Logout</span>
        </button>
      </nav>

      <div className="border-t border-slate-100 px-4 py-3">
        <div className={`rounded-xl ${isSuperAdmin ? 'bg-violet-50 text-violet-700' : 'bg-teal-50 text-teal-700'} px-3 py-2`}>
          <p className="truncate text-xs font-bold">{user.name}</p>
          <p className="truncate text-[10px] opacity-70">{user.email}</p>
        </div>
      </div>
    </aside>
  );
};

function MenuItem({ to, icon, label, tone, end = false }: { to: string; icon: ReactNode; label: string; tone: 'teal' | 'violet'; end?: boolean }) {
  const colors = tone === 'violet'
    ? { active: 'border-violet-500 bg-gradient-to-r from-violet-50 to-indigo-50 text-violet-900 shadow-violet-100', icon: 'text-violet-600', dot: 'bg-violet-500' }
    : { active: 'border-teal-500 bg-gradient-to-r from-teal-50 to-cyan-50 text-teal-900 shadow-teal-100', icon: 'text-teal-600', dot: 'bg-teal-500' };

  return (
    <NavLink to={to} end={end} className={({ isActive }) => `group flex items-center gap-3 rounded-xl border-l-[3px] px-3 py-2.5 text-[13px] transition-all ${isActive ? `${colors.active} font-semibold shadow-sm` : 'border-transparent font-medium text-slate-600 hover:border-slate-200 hover:bg-slate-50 hover:text-slate-900'}`}>
      {({ isActive }) => <>
        <span className={`shrink-0 ${isActive ? colors.icon : 'text-slate-400'}`}>{icon}</span>
        <span className="min-w-0 flex-1">{label}</span>
        <span className={`h-1.5 w-1.5 rounded-full ${colors.dot} ${isActive ? 'opacity-100' : 'opacity-0'}`} />
      </>}
    </NavLink>
  );
}

export default AdminSidebar;
