import { LayoutDashboard, Store, MessageSquare, ShoppingCart, Package, User as UserIcon, LogOut } from 'lucide-react';
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
    <aside className="w-64 bg-white border-r border-gray-100 flex flex-col h-screen sticky top-0">
      <div className="p-6 border-b border-gray-100 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-sky-500 to-emerald-500 bg-clip-text text-transparent">
            TexCycle AI
          </h1>
          <p className="text-[11px] text-gray-400 mt-0.5">Buyer Marketplace</p>
        </div>
        <NotificationBell />
      </div>

      <nav className="px-4 py-3 space-y-1 overflow-y-auto flex-1">
        <MenuItem icon={<LayoutDashboard size={18} />} label="Dashboard" onClick={() => navigate('/buyer-dashboard')} />
        <MenuItem icon={<Store size={18} />} label="Browse Marketplace" onClick={() => navigate('/marketplace')} />
        <MenuItem icon={<ShoppingCart size={18} />} label="Cart" onClick={() => navigate('/cart')} badge={totalItems} />
        <MenuItem icon={<Package size={18} />} label="My Orders" onClick={() => navigate('/my-orders')} />
        <MenuItem icon={<MessageSquare size={18} />} label="My Inquiries" onClick={() => navigate('/my-inquiries')} />

        <div className="pt-4 pb-1 px-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
          Account
        </div>
        <MenuItem icon={<UserIcon size={18} />} label="Profile" onClick={() => navigate('/buyer-profile')} />
        <MenuItem icon={<LogOut size={18} />} label="Logout" onClick={onLogout} />
      </nav>
    </aside>
  );
};

function MenuItem({
  icon, label, onClick, badge,
}: {
  icon: React.ReactNode; label: string; onClick?: () => void; badge?: number;
}) {
  return (
    <div
      className="flex items-center gap-3 p-2.5 rounded-lg cursor-pointer text-sm text-gray-700 transition-colors border-l-2 border-transparent hover:bg-teal-50 hover:border-teal-300"
      onClick={onClick}
    >
      <span className="text-teal-500">{icon}</span>
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
