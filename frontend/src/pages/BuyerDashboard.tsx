import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, PackageSearch } from 'lucide-react';
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
    <div className="flex min-h-screen bg-gradient-to-br from-sky-50 via-slate-50 to-emerald-50 font-sans">
      <BuyerSidebar user={user} onLogout={onLogout} />

      <main className="flex-1 bg-[radial-gradient(ellipse_at_top_right,_rgba(56,189,248,0.14),_transparent_36%),radial-gradient(ellipse_at_bottom_left,_rgba(52,211,153,0.12),_transparent_34%)] p-6 md:p-8">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-700 via-sky-500 to-teal-400 px-7 py-8 text-white shadow-xl shadow-sky-300/40">
            <div className="absolute -right-10 -top-16 h-56 w-56 rounded-full bg-white/10" />
            <div className="absolute right-32 -bottom-28 h-48 w-48 rounded-full border-[24px] border-white/10" />
            <div className="relative">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-100">Buyer workspace</p>
              <h1 className="mt-2 text-3xl font-extrabold">Welcome back, {user.name.split(' ')[0]}</h1>
              <p className="mt-1 text-sm text-white/85">Find and inquire about AI-verified textile waste listings.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <div className="group relative overflow-hidden rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-100 via-orange-50 to-white p-6 shadow-md shadow-amber-100 transition-all hover:-translate-y-1 hover:shadow-lg">
              <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-amber-200/40 transition-transform group-hover:scale-110" />
              <span className="relative mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-md shadow-orange-200"><MessageSquare className="w-5 h-5" /></span>
              <p className="relative text-3xl font-extrabold text-amber-950">{totalInquiries}</p>
              <p className="relative mt-1 text-xs font-semibold uppercase tracking-wide text-amber-800">Inquiries sent</p>
            </div>

            <div className="group relative overflow-hidden rounded-2xl border border-cyan-200 bg-gradient-to-br from-cyan-100 via-sky-50 to-white p-6 shadow-md shadow-cyan-100 transition-all hover:-translate-y-1 hover:shadow-lg">
              <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-cyan-200/40 transition-transform group-hover:scale-110" />
              <span className="relative mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-200"><PackageSearch className="w-5 h-5" /></span>
              <p className="relative text-3xl font-extrabold text-cyan-950">{recentListings.length > 0 ? '60+' : '0'}</p>
              <p className="relative mt-1 text-xs font-semibold uppercase tracking-wide text-cyan-800">Listings available</p>
            </div>
          </div>

          <div className="rounded-2xl border border-sky-200 bg-gradient-to-br from-white via-white to-sky-50/80 p-6 shadow-md shadow-sky-100/70">
            <div className="flex items-center justify-between mb-4">
              <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900"><span className="h-2.5 w-2.5 rounded-full bg-gradient-to-br from-sky-400 to-blue-600 shadow-sm" />Recently Listed</h2>
              <button onClick={() => navigate('/marketplace')} className="rounded-full bg-gradient-to-r from-sky-100 to-cyan-100 px-3 py-1.5 text-sm font-semibold text-sky-800 hover:from-sky-200 hover:to-cyan-200">
                View all
              </button>
            </div>
            {loading ? (
              <p className="text-sm text-gray-400">Loading...</p>
            ) : recentListings.length === 0 ? (
              <p className="text-sm text-gray-400">No listings available right now.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {recentListings.map((item, index) => {
                  const cardTones = [
                    'border-sky-200 from-sky-50 to-white hover:border-sky-300',
                    'border-emerald-200 from-emerald-50 to-white hover:border-emerald-300',
                    'border-violet-200 from-violet-50 to-white hover:border-violet-300',
                    'border-amber-200 from-amber-50 to-white hover:border-amber-300',
                    'border-rose-200 from-rose-50 to-white hover:border-rose-300',
                    'border-cyan-200 from-cyan-50 to-white hover:border-cyan-300',
                  ];
                  const priceTones = ['text-sky-700', 'text-emerald-700', 'text-violet-700', 'text-amber-700', 'text-rose-700', 'text-cyan-700'];
                  return (
                  <div
                    key={item._id}
                    onClick={() => navigate(`/marketplace/${item._id}`)}
                    className={`cursor-pointer rounded-xl border bg-gradient-to-br p-4 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md ${cardTones[index % cardTones.length]}`}
                  >
                    <span className="rounded-full bg-white/80 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-500">{item.category}</span>
                    <p className="mt-2 truncate text-sm font-bold text-slate-900">{item.title}</p>
                    <p className="mt-0.5 text-xs text-slate-500">{item.district || item.location}</p>
                    <p className={`mt-2 text-sm font-extrabold ${priceTones[index % priceTones.length]}`}>LKR {item.price}/kg</p>
                  </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-violet-200 bg-gradient-to-br from-white via-white to-violet-50/70 p-6 shadow-md shadow-violet-100/70">
            <div className="flex items-center justify-between mb-4">
              <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900"><span className="h-2.5 w-2.5 rounded-full bg-gradient-to-br from-violet-400 to-fuchsia-600 shadow-sm" />Recent Inquiries</h2>
              <button onClick={() => navigate('/my-inquiries')} className="rounded-full bg-gradient-to-r from-violet-100 to-fuchsia-100 px-3 py-1.5 text-sm font-semibold text-violet-800 hover:from-violet-200 hover:to-fuchsia-200">
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
                  <div key={inq._id} className="flex items-center justify-between rounded-xl border border-violet-100 bg-gradient-to-r from-violet-50/80 to-white px-4 py-3 text-sm shadow-sm">
                    <span className="truncate font-medium text-slate-700">{inq.material?.title || 'Listing removed'}</span>
                    <span className="ml-2 shrink-0 rounded-full bg-violet-100 px-2.5 py-1 text-[11px] font-bold capitalize text-violet-700">{inq.status}</span>
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
