import type { ReactNode } from 'react';
import {
  LayoutDashboard,
  Upload,
  Package,
  Truck,
  MessageSquare,
  History,
  Leaf,
  TrendingUp,
  User as UserIcon,
  LogOut,
  DollarSign,
  Users,
  BarChart3,
  Sparkles,
  Clock,
  Recycle,
} from 'lucide-react';
import { NavLink } from 'react-router-dom';
import type { User } from '../../types';
import NotificationBell from './NotificationBell';

interface SidebarProps {
  user: User;
  onLogout: () => void;
}

type Member = 1 | 2 | 3 | 4;

const MODULE_STYLES: Record<Member, { dot: string; badge: string; icon: string }> = {
  1: { dot: 'bg-sky-500', badge: 'bg-sky-50 text-sky-700', icon: 'text-sky-600' },
  2: { dot: 'bg-emerald-500', badge: 'bg-emerald-50 text-emerald-700', icon: 'text-emerald-600' },
  3: { dot: 'bg-amber-500', badge: 'bg-amber-50 text-amber-700', icon: 'text-amber-600' },
  4: { dot: 'bg-violet-500', badge: 'bg-violet-50 text-violet-700', icon: 'text-violet-600' },
};

const Sidebar = ({ onLogout }: SidebarProps) => (
  <aside className="sticky top-0 flex h-dvh w-64 shrink-0 flex-col border-r border-slate-200 bg-white shadow-[4px_0_24px_rgba(15,23,42,0.03)] xl:w-72">
    <div className="flex items-center justify-between border-b border-slate-100 px-5 py-5">
      <div>
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 via-teal-500 to-emerald-500 text-white shadow-md shadow-teal-100">
            <Recycle size={19} />
          </span>
          <h1 className="bg-gradient-to-r from-sky-600 via-teal-600 to-emerald-600 bg-clip-text text-xl font-extrabold tracking-tight text-transparent">
            TexCycle AI
          </h1>
        </div>
        <p className="ml-11 mt-1 text-[11px] font-medium text-slate-400">Seller workspace</p>
      </div>
      <NotificationBell />
    </div>

    <nav aria-label="Seller dashboard" className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
      <MenuItem icon={<LayoutDashboard size={18} />} label="Dashboard" to="/seller-dashboard" />
      <MenuItem icon={<Upload size={18} />} label="Upload Textile Waste" to="/upload-textile-waste" />
      <MenuItem icon={<Package size={18} />} label="My Listings" to="/my-listings" />
      <MenuItem icon={<MessageSquare size={18} />} label="Buyer Inquiries" to="/seller-inquiries" />
      <MenuItem icon={<Truck size={18} />} label="Orders Received" to="/seller-orders" />

      <SectionLabel member={1} label="Fabric Intelligence" />
      <MenuItem icon={<History size={18} />} label="Analysis History" to="/analysis-history" member={1} />

      <SectionLabel member={2} label="Sustainability" />
      <MenuItem icon={<TrendingUp size={18} />} label="Sustainability Analysis" to="/sustainability-analysis" member={2} />
      <MenuItem icon={<Leaf size={18} />} label="Sustainability History" to="/sustainability-history" member={2} />

      <SectionLabel member={3} label="Pricing & Recommendations" />
      <MenuItem icon={<DollarSign size={18} />} label="Price Prediction" to="/price-prediction" member={3} />
      <MenuItem icon={<Users size={18} />} label="Buyer Recommendation" to="/buyer-recommendation" member={3} />
      <MenuItem icon={<BarChart3 size={18} />} label="Demand Prediction" to="/demand-prediction" member={3} />

      <SectionLabel member={4} label="Marketplace Analytics" />
      <MenuItem icon={<Sparkles size={18} />} label="AI Marketplace Analysis" to="/marketplace-analysis" member={4} />
      <MenuItem icon={<Clock size={18} />} label="Prediction History" to="/prediction-history" member={4} />

      <div className="px-3 pb-1 pt-5 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">Account</div>
      <MenuItem icon={<UserIcon size={18} />} label="Profile" to="/seller-profile" />
      <button type="button" onClick={onLogout} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[13px] font-medium text-slate-600 transition-colors hover:bg-rose-50 hover:text-rose-700">
        <LogOut size={18} className="text-rose-400" />
        <span>Logout</span>
      </button>
    </nav>

    <div className="border-t border-slate-100 px-4 py-3">
      <div className="flex items-center gap-1.5" aria-label="Four AI modules">
        {[1, 2, 3, 4].map((member) => <span key={member} className={`h-2 w-2 rounded-full ${MODULE_STYLES[member as Member].dot}`} />)}
        <span className="ml-1 text-[10px] font-medium text-slate-400">4 AI modules</span>
      </div>
    </div>
  </aside>
);

function SectionLabel({ member, label }: { member: Member; label: string }) {
  const style = MODULE_STYLES[member];
  return (
    <div className="mb-1 mt-4 flex items-center gap-2 px-2 pt-1">
      <span className={`h-2 w-2 shrink-0 rounded-full ${style.dot}`} />
      <span className="min-w-0 flex-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">{label}</span>
      <span className={`rounded-md px-1.5 py-0.5 text-[9px] font-bold ${style.badge}`}>0{member}</span>
    </div>
  );
}

function MenuItem({ icon, label, to, member }: { icon: ReactNode; label: string; to: string; member?: Member }) {
  const inactiveIcon = member ? MODULE_STYLES[member].icon : 'text-slate-400';
  return (
    <NavLink
      to={to}
      end={to === '/seller-dashboard'}
      className={({ isActive }) => `group flex items-center gap-3 rounded-xl border-l-[3px] px-3 py-2.5 text-[13px] transition-all ${isActive ? 'border-sky-500 bg-gradient-to-r from-sky-50 to-cyan-50 font-semibold text-sky-800 shadow-sm shadow-sky-100' : 'border-transparent font-medium text-slate-600 hover:border-slate-200 hover:bg-slate-50 hover:text-slate-900'}`}
    >
      {({ isActive }) => (
        <>
          <span className={`shrink-0 transition-colors ${isActive ? 'text-sky-600' : inactiveIcon}`}>{icon}</span>
          <span className="min-w-0 flex-1 leading-5">{label}</span>
          <span className={`h-1.5 w-1.5 shrink-0 rounded-full bg-sky-500 transition-opacity ${isActive ? 'opacity-100' : 'opacity-0'}`} />
        </>
      )}
    </NavLink>
  );
}

export default Sidebar;
