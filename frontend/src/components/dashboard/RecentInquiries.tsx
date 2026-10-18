import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, MessageSquare } from 'lucide-react';
import { getSellerInquiries } from '../../services/sellerApi';
import type { SellerInquiryRecord } from '../../services/sellerApi';

const RecentInquiries = () => {
  const navigate = useNavigate();
  const [inquiries, setInquiries] = useState<SellerInquiryRecord[]>([]);

  useEffect(() => {
    getSellerInquiries(1, 3)
      .then((response) => setInquiries(response.inquiries))
      .catch((error) => console.error('Failed to load dashboard inquiries:', error));
  }, []);

  return (
    <section className="mt-6 rounded-2xl border border-white bg-white/90 p-5 shadow-md shadow-slate-200/50 ring-1 ring-slate-100 sm:p-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-100 to-violet-100 text-cyan-700"><MessageSquare size={19} /></span>
          <div><h2 className="font-bold text-slate-900">Recent buyer inquiries</h2><p className="text-xs text-slate-500">Messages about your listings</p></div>
        </div>
        <button type="button" onClick={() => navigate('/seller-inquiries')} className="inline-flex items-center gap-1 text-xs font-bold text-cyan-700 hover:text-cyan-900">View all <ArrowRight size={14} /></button>
      </div>
      {inquiries.length === 0 ? (
        <p className="rounded-xl bg-slate-50 px-4 py-5 text-center text-sm text-slate-500">No buyer inquiries yet. Messages sent from your listings will appear here.</p>
      ) : (
        <div className="divide-y divide-slate-100">
          {inquiries.map((inquiry) => (
            <button key={inquiry._id} type="button" onClick={() => navigate('/seller-inquiries')} className="flex w-full items-start gap-3 py-3 text-left first:pt-0 last:pb-0">
              <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-cyan-50 text-cyan-700"><MessageSquare size={15} /></span>
              <span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold text-slate-800">{inquiry.material?.title || 'Listing inquiry'}</span><span className="mt-0.5 block truncate text-xs text-slate-500">{inquiry.buyer?.name || 'Buyer'}: {inquiry.message}</span></span>
              <span className={`mt-1 rounded-full px-2 py-0.5 text-[10px] font-bold capitalize ${inquiry.status === 'open' ? 'bg-amber-100 text-amber-800' : inquiry.status === 'responded' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'}`}>{inquiry.status}</span>
            </button>
          ))}
        </div>
      )}
    </section>
  );
};

export default RecentInquiries;
