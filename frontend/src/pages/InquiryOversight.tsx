import { useState, useEffect } from 'react';
import { MessageSquare, PackageSearch } from 'lucide-react';
import AdminSidebar from '../components/dashboard/AdminSidebar';
import { getAllInquiries } from '../services/adminApi';
import type { AdminInquiryRecord } from '../services/adminApi';
import type { User } from '../types';

interface InquiryOversightProps {
  user: User;
  onLogout: () => void;
}

const statusColor: Record<string, string> = {
  open: 'text-amber-600 bg-amber-50',
  responded: 'text-emerald-600 bg-emerald-50',
  closed: 'text-gray-500 bg-gray-100',
};

const InquiryOversight = ({ user, onLogout }: InquiryOversightProps) => {
  const [inquiries, setInquiries] = useState<AdminInquiryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);

  const fetchInquiries = async (p: number) => {
    try {
      setLoading(true);
      setLoadError('');
      const response = await getAllInquiries(p, 20);
      setInquiries(response.inquiries);
      setPage(response.page);
      setPages(response.pages);
    } catch (error) {
      console.error('Failed to load inquiries', error);
      setInquiries([]);
      setLoadError('Could not load buyer activity right now. Please try again shortly.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInquiries(1);
  }, []);

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

  return (
    <div className="flex min-h-screen bg-[#F8FAFC] font-sans">
      <AdminSidebar user={user} onLogout={onLogout} />

      <main className="flex-1 p-6 md:p-8">
        <div className="max-w-5xl mx-auto space-y-6">
          <div className="border-b border-gray-200 pb-5">
            <h1 className="text-3xl font-bold text-gray-900">Buyer Activity</h1>
            <p className="text-gray-500 text-sm mt-0.5">Every inquiry sent across the marketplace, most recent first.</p>
          </div>

          {loading ? (
            <div className="bg-white rounded-2xl p-16 border border-gray-200 shadow-sm text-center">
              <div className="animate-spin w-12 h-12 border-4 border-rose-500 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-gray-500">Loading buyer activity...</p>
            </div>
          ) : loadError ? (
            <div className="bg-red-50 border border-red-100 rounded-2xl p-16 text-center">
              <p className="text-red-600 mb-4">{loadError}</p>
              <button onClick={() => fetchInquiries(1)} className="text-rose-600 hover:text-rose-700 font-medium">Try again</button>
            </div>
          ) : inquiries.length === 0 ? (
            <div className="bg-white rounded-2xl p-16 border border-gray-200 shadow-sm text-center">
              <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 font-medium">No inquiries yet</p>
            </div>
          ) : (
            <>
              <div className="space-y-3">
                {inquiries.map((inq) => (
                  <div key={inq._id} className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm flex items-start gap-4">
                    <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center shrink-0 overflow-hidden">
                      {inq.material?.imageUrl ? (
                        <img src={inq.material.imageUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <PackageSearch className="w-5 h-5 text-gray-300" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 flex-wrap">
                        <p className="font-semibold text-gray-900 text-sm">{inq.material?.title || 'Listing removed'}</p>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${statusColor[inq.status] || 'text-gray-500 bg-gray-100'}`}>
                          {inq.status}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {formatDate(inq.createdAt)} · {inq.buyer?.name || 'buyer'} ({inq.buyer?.email}) → {inq.seller?.name || 'seller'}
                      </p>
                      <p className="text-sm text-gray-600 mt-1.5 line-clamp-2">{inq.message}</p>
                    </div>
                  </div>
                ))}
              </div>

              {pages > 1 && (
                <div className="flex items-center justify-center gap-3 pt-2">
                  <button onClick={() => fetchInquiries(page - 1)} disabled={page <= 1} className="px-4 py-2 border border-gray-300 rounded-lg text-sm disabled:opacity-50">
                    Previous
                  </button>
                  <span className="text-sm text-gray-500">Page {page} of {pages}</span>
                  <button onClick={() => fetchInquiries(page + 1)} disabled={page >= pages} className="px-4 py-2 border border-gray-300 rounded-lg text-sm disabled:opacity-50">
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default InquiryOversight;
