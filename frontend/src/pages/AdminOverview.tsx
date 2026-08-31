import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Store, MessageSquare, ShieldCheck, ShieldAlert, ArrowRight } from 'lucide-react';
import AdminSidebar from '../components/dashboard/AdminSidebar';
import { getAdminOverview } from '../services/adminApi';
import type { AdminOverview as AdminOverviewData } from '../services/adminApi';
import type { User } from '../types';

interface AdminOverviewProps {
  user: User;
  onLogout: () => void;
}

const AdminOverviewPage = ({ user, onLogout }: AdminOverviewProps) => {
  const navigate = useNavigate();
  const isSuperAdmin = user.role === 'super_admin';
  const base = isSuperAdmin ? '/super-admin-dashboard' : '/admin-dashboard';

  const [stats, setStats] = useState<AdminOverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    getAdminOverview()
      .then(setStats)
      .catch((error) => {
        console.error('Failed to load admin overview', error);
        setLoadError('Could not load system statistics right now.');
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="flex min-h-screen bg-[#F8FAFC] font-sans">
      <AdminSidebar user={user} onLogout={onLogout} />

      <main className="flex-1 p-6 md:p-8">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="border-b border-gray-200 pb-5 flex items-start justify-between flex-wrap gap-3">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-rose-600 uppercase tracking-wide">
                {isSuperAdmin ? <ShieldAlert className="w-3.5 h-3.5" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                {isSuperAdmin ? 'Super Admin' : 'Admin'} Console
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mt-1">System Overview</h1>
              <p className="text-gray-500 text-sm mt-0.5">
                {isSuperAdmin
                  ? 'Full system access - users, listings, and marketplace activity.'
                  : 'User accounts and buyer activity oversight.'}
              </p>
            </div>
          </div>

          {loading ? (
            <div className="bg-white rounded-2xl p-16 border border-gray-200 shadow-sm text-center">
              <div className="animate-spin w-12 h-12 border-4 border-rose-500 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-gray-500">Loading statistics...</p>
            </div>
          ) : loadError || !stats ? (
            <div className="bg-red-50 border border-red-100 rounded-2xl p-16 text-center">
              <p className="text-red-600">{loadError}</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
                <StatCard label="Total Users" value={stats.totalUsers} icon={<Users className="w-5 h-5 text-rose-500" />} />
                <StatCard label="Buyers" value={stats.totalBuyers} icon={<Users className="w-5 h-5 text-teal-500" />} />
                <StatCard label="Sellers" value={stats.totalSellers} icon={<Users className="w-5 h-5 text-sky-500" />} />
                <StatCard label="Suspended" value={stats.suspendedUsers} icon={<ShieldAlert className="w-5 h-5 text-amber-500" />} />
                <StatCard label="Total Listings" value={stats.totalMaterials} icon={<Store className="w-5 h-5 text-emerald-500" />} />
                <StatCard label="Available" value={stats.availableMaterials} icon={<Store className="w-5 h-5 text-emerald-400" />} />
                <StatCard label="Sold" value={stats.soldMaterials} icon={<Store className="w-5 h-5 text-gray-400" />} />
                <StatCard label="Inquiries" value={stats.totalInquiries} icon={<MessageSquare className="w-5 h-5 text-purple-500" />} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div
                  onClick={() => navigate(`${base}/users`)}
                  className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                >
                  <Users className="w-6 h-6 text-rose-500 mb-2" />
                  <p className="font-semibold text-gray-900">Manage Users</p>
                  <p className="text-xs text-gray-500 mt-1">Search, suspend, or reactivate accounts.</p>
                  <div className="flex items-center gap-1 text-xs mt-3 font-medium text-rose-600">
                    Open <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </div>
                <div
                  onClick={() => navigate(`${base}/inquiries`)}
                  className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                >
                  <MessageSquare className="w-6 h-6 text-purple-500 mb-2" />
                  <p className="font-semibold text-gray-900">Buyer Activity</p>
                  <p className="text-xs text-gray-500 mt-1">Review every inquiry across the marketplace.</p>
                  <div className="flex items-center gap-1 text-xs mt-3 font-medium text-purple-600">
                    Open <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </div>
                {isSuperAdmin && (
                  <div
                    onClick={() => navigate(`${base}/listings`)}
                    className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm cursor-pointer hover:shadow-md transition-shadow md:col-span-2"
                  >
                    <Store className="w-6 h-6 text-emerald-500 mb-2" />
                    <p className="font-semibold text-gray-900">All Listings (system-wide)</p>
                    <p className="text-xs text-gray-500 mt-1">Edit or remove any listing on the marketplace, regardless of seller.</p>
                    <div className="flex items-center gap-1 text-xs mt-3 font-medium text-emerald-600">
                      Open <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
};

const StatCard = ({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) => (
  <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm">
    {icon}
    <p className="text-2xl font-bold text-gray-900 mt-2">{value}</p>
    <p className="text-gray-500 text-xs mt-0.5">{label}</p>
  </div>
);

export default AdminOverviewPage;
