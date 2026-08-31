import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/dashboard/Sidebar';
import StatCards from '../components/dashboard/StatCards';
import QuickActions from '../components/dashboard/QuickActions';
import PerformanceChart from '../components/dashboard/PerformanceChart';
import RecentListings from '../components/dashboard/RecentListings';
import ActivityPanel from '../components/dashboard/ActivityPanel';
import AIIntelligenceCards from '../components/dashboard/AIIntelligenceCards';
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
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar user={user} onLogout={onLogout} />

      <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8">
        <div className="max-w-[1600px] mx-auto">
          <header className="mb-6">
            <p className="text-sm font-medium text-sky-600">
              Seller Workspace
            </p>

            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mt-1">
              Welcome back 👋
            </h1>

            <p className="text-gray-500 mt-1">
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
        </div>
      </main>
    </div>
  );
};

export default SellerDashboard;
