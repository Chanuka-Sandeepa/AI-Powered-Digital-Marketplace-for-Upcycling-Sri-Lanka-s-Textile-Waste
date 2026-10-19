import { LayoutDashboard, MessageSquare, ShoppingCart, Package, User as UserIcon, LogOut } from 'lucide-react';
import type { User } from '../../types';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import NotificationBell from './NotificationBell';

interface BuyerSidebarProps {
  user: User;
  onLogout: () => void;
}

const BuyerSidebar = ({ user: _user, onLogout }: BuyerSidebarProps) => {
  const navigate = useNavigate();
  const { totalItems } = useCart();

  return (
    <aside className="w-64 bg-white border-r border-sky-100 flex flex-col h-screen sticky top-0 shadow-[4px_0_24px_rgba(14,165,233,0.06)]">
      <div className="p-6 border-b border-sky-100 bg-gradient-to-br from-cyan-50 via-white to-emerald-50 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-sky-500 to-emerald-500 bg-clip-text text-transparent">
            TexCycle AI
          </h1>
          <p className="text-[11px] text-gray-400 mt-0.5">Buyer Marketplace</p>
        </div>
        <NotificationBell />
      </div>

      <nav className="px-4 py-3 space-y-1 overflow-y-auto flex-1">
        <MenuItem icon={<LayoutDashboard size={18} />} label="Dashboard" onClick={() => navigate('/buyer-dashboard')} tone="sky" />
        <MenuItem icon={<ShoppingCart size={18} />} label="Cart" onClick={() => navigate('/cart')} badge={totalItems} tone="violet" />
        <MenuItem icon={<Package size={18} />} label="My Orders" onClick={() => navigate('/my-orders')} tone="amber" />
        <MenuItem icon={<MessageSquare size={18} />} label="My Inquiries" onClick={() => navigate('/my-inquiries')} tone="emerald" />

        <div className="pt-4 pb-1 px-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
          Account
        </div>
        <MenuItem icon={<UserIcon size={18} />} label="Profile" onClick={() => navigate('/buyer-profile')} tone="indigo" />
        <MenuItem icon={<LogOut size={18} />} label="Logout" onClick={onLogout} tone="rose" />
      </nav>
    </aside>
  );
};

function MenuItem({
  icon, label, onClick, badge, tone = 'sky',
}: {
  icon: React.ReactNode; label: string; onClick?: () => void; badge?: number; tone?: 'sky' | 'violet' | 'amber' | 'emerald' | 'indigo' | 'rose';
}) {
  const tones = {
    sky: 'text-sky-600 group-hover:bg-sky-100',
    violet: 'text-violet-600 group-hover:bg-violet-100',
    amber: 'text-amber-600 group-hover:bg-amber-100',
    emerald: 'text-emerald-600 group-hover:bg-emerald-100',
    indigo: 'text-indigo-600 group-hover:bg-indigo-100',
    rose: 'text-rose-500 group-hover:bg-rose-100',
  };
  return (
    <div
      className="group flex items-center gap-3 rounded-xl p-2.5 cursor-pointer text-sm font-medium text-slate-700 transition-all hover:translate-x-0.5 hover:bg-slate-50"
      onClick={onClick}
    >
      <span className={`flex h-9 w-9 items-center justify-center rounded-xl bg-slate-50 transition-colors ${tones[tone]}`}>{icon}</span>
      <span className="flex-1">{label}</span>
      {!!badge && (
        <span className="bg-rose-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
          {badge}
        </span>
      )}
    </div>
  );
}

export default BuyerSidebar;
