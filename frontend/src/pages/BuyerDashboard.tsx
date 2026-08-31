import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Store, MessageSquare, PackageSearch, ArrowRight } from 'lucide-react';
import BuyerSidebar from '../components/dashboard/BuyerSidebar';
import { browseMarketplace, getMyInquiries } from '../services/buyerApi';
import type { MarketplaceListing, MyInquiryRecord } from '../services/buyerApi';
import type { User } from '../types';

interface BuyerDashboardProps {
  user: User;
  onLogout: () => void;
}

const BuyerDashboard = ({ user, onLogout }: BuyerDashboardProps) => {
  const navigate = useNavigate();
  const [recentListings, setRecentListings] = useState<MarketplaceListing[]>([]);
  const [recentInquiries, setRecentInquiries] = useState<MyInquiryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalInquiries, setTotalInquiries] = useState(0);

  useEffect(() => {
    Promise.all([
      browseMarketplace({ limit: 6 }),
      getMyInquiries(1, 5),
    ])
      .then(([listings, inquiriesResponse]) => {
        setRecentListings(listings);
        setRecentInquiries(inquiriesResponse.inquiries);
        setTotalInquiries(inquiriesResponse.total);
      })
      .catch((error) => console.error('Failed to load buyer dashboard', error))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="flex min-h-screen bg-[#F8FAFC] font-sans">
      <BuyerSidebar user={user} onLogout={onLogout} />

      <main className="flex-1 p-6 md:p-8">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="border-b border-gray-200 pb-5">
            <h1 className="text-3xl font-bold text-gray-900">Welcome back, {user.name.split(' ')[0]}</h1>
            <p className="text-gray-500 text-sm mt-0.5">Find and inquire about AI-verified textile waste listings.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div
              onClick={() => navigate('/marketplace')}
              className="bg-gradient-to-br from-teal-500 to-emerald-500 rounded-2xl p-6 text-white shadow-sm cursor-pointer hover:shadow-md transition-shadow"
            >
              <Store className="w-6 h-6 mb-3 opacity-90" />
              <p className="font-semibold">Browse Marketplace</p>
              <p className="text-teal-50 text-xs mt-1">Search AI-verified listings across Sri Lanka</p>
              <div className="flex items-center gap-1 text-xs mt-3 font-medium">
                Explore now <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
              <MessageSquare className="w-6 h-6 mb-3 text-amber-500" />
              <p className="text-2xl font-bold text-gray-900">{totalInquiries}</p>
              <p className="text-gray-500 text-xs mt-1">Inquiries sent</p>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
              <PackageSearch className="w-6 h-6 mb-3 text-sky-500" />
              <p className="text-2xl font-bold text-gray-900">{recentListings.length > 0 ? '60+' : '0'}</p>
              <p className="text-gray-500 text-xs mt-1">Listings available</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">Recently Listed</h2>
              <button onClick={() => navigate('/marketplace')} className="text-sm text-teal-600 hover:text-teal-700 font-medium">
                View all
              </button>
            </div>
            {loading ? (
              <p className="text-sm text-gray-400">Loading...</p>
            ) : recentListings.length === 0 ? (
              <p className="text-sm text-gray-400">No listings available right now.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {recentListings.map((item) => (
                  <div
                    key={item._id}
                    onClick={() => navigate(`/marketplace/${item._id}`)}
                    className="border border-gray-100 rounded-xl p-3 cursor-pointer hover:border-teal-200 hover:bg-teal-50/30 transition-colors"
                  >
                    <p className="font-medium text-gray-900 text-sm truncate">{item.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{item.district || item.location}</p>
                    <p className="text-sm font-bold text-teal-600 mt-1.5">LKR {item.price}/kg</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">Recent Inquiries</h2>
              <button onClick={() => navigate('/my-inquiries')} className="text-sm text-teal-600 hover:text-teal-700 font-medium">
                View all
              </button>
            </div>
            {loading ? (
              <p className="text-sm text-gray-400">Loading...</p>
            ) : recentInquiries.length === 0 ? (
              <p className="text-sm text-gray-400">No inquiries yet - browse the marketplace to get started.</p>
            ) : (
              <div className="space-y-2">
                {recentInquiries.map((inq) => (
                  <div key={inq._id} className="flex items-center justify-between text-sm py-2 border-b border-gray-50 last:border-0">
                    <span className="text-gray-700 truncate">{inq.material?.title || 'Listing removed'}</span>
                    <span className="text-xs text-gray-400 shrink-0 ml-2">{inq.status}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default BuyerDashboard;
