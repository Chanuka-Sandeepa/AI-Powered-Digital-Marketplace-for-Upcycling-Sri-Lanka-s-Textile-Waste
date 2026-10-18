import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Mail, MessageSquare, PackageSearch, Send } from 'lucide-react';
import Sidebar from '../components/dashboard/Sidebar';
import { getSellerInquiries, replyToSellerInquiry } from '../services/sellerApi';
import type { SellerInquiryRecord } from '../services/sellerApi';
import type { User } from '../types';

interface SellerInquiriesProps {
  user: User;
  onLogout: () => void;
}

const statusStyles: Record<string, string> = {
  open: 'bg-amber-100 text-amber-800',
  responded: 'bg-emerald-100 text-emerald-800',
  closed: 'bg-slate-100 text-slate-600',
};

const SellerInquiries = ({ user, onLogout }: SellerInquiriesProps) => {
  const navigate = useNavigate();
  const [inquiries, setInquiries] = useState<SellerInquiryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [openCount, setOpenCount] = useState(0);
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const [sendingId, setSendingId] = useState('');
  const [replyError, setReplyError] = useState<Record<string, string>>({});

  const loadInquiries = useCallback(async (requestedPage: number) => {
    setLoading(true);
    setError('');
    try {
      const response = await getSellerInquiries(requestedPage, 20);
      setInquiries(Array.isArray(response?.inquiries) ? response.inquiries : []);
      setPage(response.page);
      setPages(response.pages);
      setTotal(Number(response.total) || 0);
      setOpenCount(Number(response.openCount) || 0);
    } catch (loadFailure) {
      console.error('Failed to load seller inquiries:', loadFailure);
      setInquiries([]);
      setTotal(0);
      setOpenCount(0);
      setError('Could not load buyer inquiries right now. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadInquiries(1);
  }, [loadInquiries]);

  const formatDate = (date: string) => new Date(date).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  const sendReply = async (inquiry: SellerInquiryRecord) => {
    const reply = replyDrafts[inquiry._id]?.trim();
    if (!reply) return;
    setSendingId(inquiry._id);
    setReplyError((current) => ({ ...current, [inquiry._id]: '' }));
    try {
      await replyToSellerInquiry(inquiry._id, reply);
      setInquiries((current) => current.map((item) => item._id === inquiry._id
        ? { ...item, sellerReply: reply, repliedAt: new Date().toISOString(), status: 'responded' }
        : item));
      setReplyDrafts((current) => ({ ...current, [inquiry._id]: '' }));
      setOpenCount((count) => Math.max(0, count - (inquiry.status === 'open' ? 1 : 0)));
    } catch (sendFailure: any) {
      setReplyError((current) => ({ ...current, [inquiry._id]: sendFailure?.response?.data?.message || 'Could not send your reply. Please try again.' }));
    } finally {
      setSendingId('');
    }
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-cyan-50/40 to-violet-50/40">
      <Sidebar user={user} onLogout={onLogout} />
      <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-5xl space-y-5">
          <header className="rounded-3xl bg-gradient-to-r from-cyan-600 via-teal-500 to-emerald-500 p-5 text-white shadow-lg shadow-cyan-200/60 sm:p-6">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-50">Seller workspace</p>
            <h1 className="mt-1 text-2xl font-bold sm:text-3xl">Buyer Inquiries</h1>
            <p className="mt-2 text-sm text-white/85">Messages buyers sent about your textile listings.</p>
          </header>

          <section className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-white bg-gradient-to-br from-sky-50 to-white p-4 shadow-sm ring-1 ring-sky-100">
              <p className="text-xs font-semibold text-sky-700">All inquiries</p>
              <p className="mt-1 text-2xl font-extrabold text-slate-900">{total}</p>
            </div>
            <div className="rounded-2xl border border-white bg-gradient-to-br from-amber-50 to-white p-4 shadow-sm ring-1 ring-amber-100">
              <p className="text-xs font-semibold text-amber-700">Awaiting response</p>
              <p className="mt-1 text-2xl font-extrabold text-amber-700">{openCount}</p>
            </div>
          </section>

          {loading ? (
            <div className="rounded-3xl border border-white bg-white/90 p-12 text-center shadow-sm">
              <div className="mx-auto mb-3 h-9 w-9 animate-spin rounded-full border-4 border-cyan-100 border-t-cyan-600" />
              <p className="text-sm text-slate-500">Loading buyer inquiries...</p>
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-8 text-center">
              <p className="text-sm text-rose-700">{error}</p>
              <button onClick={() => void loadInquiries(page)} className="mt-3 text-sm font-semibold text-cyan-700 hover:text-cyan-900">Try again</button>
            </div>
          ) : inquiries.length === 0 ? (
            <div className="rounded-3xl border border-white bg-white/90 px-6 py-12 text-center shadow-md ring-1 ring-slate-100">
              <span className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-100 to-violet-100 text-cyan-700"><MessageSquare className="h-8 w-8" /></span>
              <h2 className="font-bold text-slate-900">No buyer inquiries yet</h2>
              <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">When a buyer contacts you from one of your listings, their message will appear here.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {inquiries.map((inquiry) => (
                <article key={inquiry._id} className="flex flex-col gap-3 rounded-2xl border border-white bg-white/95 p-4 shadow-md shadow-slate-200/50 ring-1 ring-slate-100 sm:flex-row sm:items-start sm:p-5">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-cyan-100 to-violet-100 text-cyan-700">
                    {inquiry.material?.imageUrl ? <img src={inquiry.material.imageUrl} alt="" className="h-full w-full object-cover" /> : <PackageSearch className="h-6 w-6" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-bold text-slate-900">{inquiry.material?.title || 'Listing no longer available'}</h2>
                      <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold capitalize ${statusStyles[inquiry.status] || statusStyles.closed}`}>{inquiry.status}</span>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">{inquiry.buyer?.name || 'Marketplace buyer'} · {formatDate(inquiry.createdAt)}</p>
                    <p className="mt-3 whitespace-pre-wrap rounded-xl bg-slate-50 p-3 text-sm leading-relaxed text-slate-700">{inquiry.message}</p>
                    {inquiry.sellerReply && <div className="mt-3 rounded-xl border border-emerald-100 bg-emerald-50/80 p-3"><p className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">Your reply{inquiry.repliedAt ? ` · ${formatDate(inquiry.repliedAt)}` : ''}</p><p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-emerald-950">{inquiry.sellerReply}</p></div>}
                    {inquiry.buyer?.email && <a href={`mailto:${inquiry.buyer.email}`} className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-cyan-700 hover:text-cyan-900"><Mail className="h-3.5 w-3.5" />{inquiry.buyer.email}</a>}
                    {inquiry.status !== 'closed' && <div className="mt-3 space-y-2">
                      <label htmlFor={`reply-${inquiry._id}`} className="block text-xs font-semibold text-slate-700">Reply to buyer</label>
                      <textarea id={`reply-${inquiry._id}`} value={replyDrafts[inquiry._id] || ''} onChange={(event) => setReplyDrafts((current) => ({ ...current, [inquiry._id]: event.target.value }))} maxLength={2000} rows={2} placeholder="Write a reply about availability, samples, or next steps..." className="w-full resize-y rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100" />
                      {replyError[inquiry._id] && <p role="alert" className="text-xs text-rose-600">{replyError[inquiry._id]}</p>}
                      <button type="button" onClick={() => void sendReply(inquiry)} disabled={!replyDrafts[inquiry._id]?.trim() || sendingId === inquiry._id} className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-600 to-teal-500 px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"><Send className="h-3.5 w-3.5" />{sendingId === inquiry._id ? 'Sending reply...' : inquiry.sellerReply ? 'Send new reply' : 'Send reply'}</button>
                    </div>}
                  </div>
                  {inquiry.material && <button type="button" onClick={() => navigate('/my-listings')} className="inline-flex shrink-0 items-center justify-center gap-1 rounded-xl border border-cyan-100 bg-cyan-50 px-3 py-2 text-xs font-semibold text-cyan-800 transition hover:bg-cyan-100">My listings <ChevronRight className="h-3.5 w-3.5" /></button>}
                </article>
              ))}
              {pages > 1 && <div className="flex items-center justify-center gap-3 pt-2"><button onClick={() => void loadInquiries(page - 1)} disabled={page <= 1} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm disabled:opacity-50">Previous</button><span className="text-sm text-slate-500">Page {page} of {pages}</span><button onClick={() => void loadInquiries(page + 1)} disabled={page >= pages} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm disabled:opacity-50">Next</button></div>}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default SellerInquiries;
