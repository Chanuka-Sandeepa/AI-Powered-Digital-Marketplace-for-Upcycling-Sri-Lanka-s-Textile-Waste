import { LayoutDashboard, Users, MessageSquare, Store, User as UserIcon, LogOut, ShieldAlert } from 'lucide-react';
import type { User } from '../../types';
import { useNavigate } from 'react-router-dom';
import NotificationBell from './NotificationBell';

interface AdminSidebarProps {
  user: User;
  onLogout: () => void;
}

const AdminSidebar = ({ user, onLogout }: AdminSidebarProps) => {
  const navigate = useNavigate();
  const isSuperAdmin = user.role === 'super_admin';
  const base = isSuperAdmin ? '/super-admin-dashboard' : '/admin-dashboard';

  return (
    <aside className="w-64 bg-white border-r border-gray-100 flex flex-col h-screen sticky top-0">
      <div className="p-6 border-b border-gray-100 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-sky-500 to-emerald-500 bg-clip-text text-transparent">
            TexCycle AI
          </h1>
          <p className="text-[11px] text-gray-400 mt-0.5 flex items-center gap-1">
            <ShieldAlert className="w-3 h-3" />
            {isSuperAdmin ? 'Super Admin' : 'Admin'} Console
          </p>
        </div>
        <NotificationBell />
      </div>

      <nav className="px-4 py-3 space-y-1 overflow-y-auto flex-1">
        <MenuItem icon={<LayoutDashboard size={18} />} label="Overview" onClick={() => navigate(base)} />
        <MenuItem icon={<Users size={18} />} label="User Management" onClick={() => navigate(`${base}/users`)} />
        <MenuItem icon={<MessageSquare size={18} />} label="Buyer Activity" onClick={() => navigate(`${base}/inquiries`)} />

        {isSuperAdmin && (
          <>
            <div className="pt-4 pb-1 px-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
              System-wide (Super Admin)
            </div>
            <MenuItem icon={<Store size={18} />} label="All Listings" onClick={() => navigate(`${base}/listings`)} />
          </>
        )}

        <div className="pt-4 pb-1 px-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
          Account
        </div>
        <MenuItem icon={<UserIcon size={18} />} label="Profile" onClick={() => navigate('/admin-profile')} />
        <MenuItem icon={<LogOut size={18} />} label="Logout" onClick={onLogout} />
      </nav>
    </aside>
  );
};

function MenuItem({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick?: () => void }) {
  return (
    <div
      className="flex items-center gap-3 p-2.5 rounded-lg cursor-pointer text-sm text-gray-700 transition-colors border-l-2 border-transparent hover:bg-rose-50 hover:border-rose-300"
      onClick={onClick}
    >
      <span className="text-rose-500">{icon}</span>
      <span>{label}</span>
    </div>
  );
}

export default AdminSidebar;
