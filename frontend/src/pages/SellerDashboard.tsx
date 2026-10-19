import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/dashboard/Sidebar';
import StatCards from '../components/dashboard/StatCards';
import QuickActions from '../components/dashboard/QuickActions';
import PerformanceChart from '../components/dashboard/PerformanceChart';
import RecentListings from '../components/dashboard/RecentListings';
import ActivityPanel from '../components/dashboard/ActivityPanel';
import AIIntelligenceCards from '../components/dashboard/AIIntelligenceCards';
import RecentInquiries from '../components/dashboard/RecentInquiries';
import type { User } from '../types';

interface SellerDashboardProps {
  user: User;
  onLogout: () => void;
}

const SellerDashboard = ({ user, onLogout }: SellerDashboardProps) => {
  const navigate = useNavigate();

  useEffect(() => {
    if (!user || user.role !== 'seller') {
      navigate('/login', { replace: true });
    }
  }, [user, navigate]);

  if (!user || user.role !== 'seller') {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-sky-50/40 to-violet-50/40">
      <Sidebar user={user} onLogout={onLogout} />

      <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8">
        <div className="max-w-[1600px] mx-auto">
          <header className="mb-6 rounded-2xl border border-white/80 bg-white/75 px-6 py-5 shadow-sm backdrop-blur-sm">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-sky-700">
              Seller workspace
            </p>

            <h1 className="mt-1 text-2xl font-bold text-slate-900 sm:text-3xl">
              Welcome back 👋
            </h1>

            <p className="mt-1 text-slate-600">
              Manage your textile waste, sustainability insights and marketplace predictions.
            </p>
          </header>

          <StatCards />

          <AIIntelligenceCards />

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mt-6">
            <div className="xl:col-span-2">
              <PerformanceChart />
            </div>

            <QuickActions />
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 mt-6">
            <div className="xl:col-span-3">
              <RecentListings />
            </div>

            <ActivityPanel />
          </div>

          <RecentInquiries />
        </div>
      </main>
    </div>
  );
};

export default SellerDashboard;
