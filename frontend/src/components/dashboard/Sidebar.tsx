import {
  LayoutDashboard,
  Upload,
  Package,
  Truck,
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
} from 'lucide-react';
import type { User } from '../../types';
import { useNavigate } from 'react-router-dom';
import NotificationBell from './NotificationBell';

interface SidebarProps {
  user: User;
  onLogout: () => void;
}

type Member = 1 | 2 | 3 | 4;

// One consistent color per project-report "member module", used across the
// sidebar and every analysis page (SustainabilityAnalysis.tsx,
// MarketplaceAnalysis.tsx) so a seller/examiner can visually trace which
// module produced which result - the report's four-member structure made
// visible in the UI, not just described in prose.
//
// IMPORTANT: every class string below is written out in full (no template-
// literal concatenation of variant + color at render time) because
// Tailwind's build-time scanner only picks up classes it can find as
// literal substrings in the source - `` `hover:${dynamicValue}` `` would
// silently produce no hover style at all.
const MEMBER_STYLES: Record<Member, { text: string; dot: string; menuHover: string }> = {
  1: { text: 'text-sky-600', dot: 'bg-sky-400', menuHover: 'hover:bg-sky-50 hover:border-sky-300' },
  2: { text: 'text-emerald-600', dot: 'bg-emerald-400', menuHover: 'hover:bg-emerald-50 hover:border-emerald-300' },
  3: { text: 'text-amber-600', dot: 'bg-amber-400', menuHover: 'hover:bg-amber-50 hover:border-amber-300' },
  4: { text: 'text-purple-600', dot: 'bg-purple-400', menuHover: 'hover:bg-purple-50 hover:border-purple-300' },
};

const Sidebar = ({ user: _user, onLogout }: SidebarProps) => {
  const navigate = useNavigate();

  return (
    <aside className="w-64 bg-white border-r border-gray-100 flex flex-col h-screen sticky top-0">
      <div className="p-6 border-b border-gray-100 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-sky-500 to-emerald-500 bg-clip-text text-transparent">
            TexCycle AI
          </h1>
          <p className="text-[11px] text-gray-400 mt-0.5">Circular Textile Intelligence</p>
        </div>
        <NotificationBell />
      </div>

      <nav className="px-4 py-3 space-y-1 overflow-y-auto flex-1">
        <MenuItem icon={<LayoutDashboard size={18} />} label="Dashboard" onClick={() => navigate('/seller-dashboard')} />
        <MenuItem icon={<Upload size={18} />} label="Upload Textile Waste" onClick={() => navigate('/upload-textile-waste')} />
        <MenuItem icon={<Package size={18} />} label="My Listings" onClick={() => navigate('/my-listings')} />
        <MenuItem icon={<Truck size={18} />} label="Orders Received" onClick={() => navigate('/seller-orders')} />

        <SectionLabel member={1} label="Fabric Intelligence" />
        <MenuItem icon={<History size={18} />} label="Analysis History" onClick={() => navigate('/analysis-history')} accent={1} />

        <SectionLabel member={2} label="Sustainability Intelligence" />
        <MenuItem icon={<TrendingUp size={18} />} label="Sustainability Analysis" onClick={() => navigate('/sustainability-analysis')} accent={2} />
        <MenuItem icon={<Leaf size={18} />} label="Sustainability History" onClick={() => navigate('/sustainability-history')} accent={2} />

        <SectionLabel member={3} label="Traceability, Recommendation & AI Pricing" />
        <MenuItem icon={<DollarSign size={18} />} label="Price Prediction" onClick={() => navigate('/price-prediction')} accent={3} />
        <MenuItem icon={<Users size={18} />} label="Buyer Recommendation" onClick={() => navigate('/buyer-recommendation')} accent={3} />
        <MenuItem icon={<BarChart3 size={18} />} label="Demand Prediction" onClick={() => navigate('/demand-prediction')} accent={3} />

        <SectionLabel member={4} label="Marketplace & Predictive Analytics" />
        <MenuItem icon={<Sparkles size={18} />} label="AI Marketplace Analysis" onClick={() => navigate('/marketplace-analysis')} accent={4} />
        <MenuItem icon={<Clock size={18} />} label="Prediction History" onClick={() => navigate('/prediction-history')} accent={4} />

        <div className="pt-4 pb-1 px-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
          Account
        </div>
        <MenuItem icon={<UserIcon size={18} />} label="Profile" onClick={() => navigate('/seller-profile')} />
        <MenuItem icon={<LogOut size={18} />} label="Logout" onClick={onLogout} />
      </nav>

      <div className="p-4 border-t border-gray-100 flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full bg-sky-400" title="Member 1" />
        <span className="w-2 h-2 rounded-full bg-emerald-400" title="Member 2" />
        <span className="w-2 h-2 rounded-full bg-amber-400" title="Member 3" />
        <span className="w-2 h-2 rounded-full bg-purple-400" title="Member 4" />
        <span className="text-[10px] text-gray-400 ml-1">4-module AI pipeline</span>
      </div>
    </aside>
  );
};

function SectionLabel({ member, label }: { member: Member; label: string }) {
  const s = MEMBER_STYLES[member];
  return (
    <div className="flex items-center gap-2 pt-4 pb-1.5 px-3">
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      <span className={`text-[11px] font-bold uppercase tracking-wider ${s.text}`}>
        Member {member} · {label}
      </span>
    </div>
  );
}

function MenuItem({
  icon,
  label,
  onClick,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
  accent?: Member;
}) {
  const s = accent ? MEMBER_STYLES[accent] : null;
  return (
    <div
      className={`flex items-center gap-3 p-2.5 rounded-lg cursor-pointer text-sm text-gray-700 transition-colors border-l-2 border-transparent ${
        s ? s.menuHover : 'hover:bg-gray-50'
      }`}
      onClick={onClick}
    >
      <span className={s ? s.text : 'text-gray-400'}>{icon}</span>
      <span>{label}</span>
    </div>
  );
}

export default Sidebar;
