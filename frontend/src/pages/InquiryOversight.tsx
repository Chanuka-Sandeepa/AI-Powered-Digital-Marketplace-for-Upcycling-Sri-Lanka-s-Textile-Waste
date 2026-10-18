import { useCallback, useEffect, useState } from 'react';
import { ChevronDown, MessageSquare, PackageSearch, RefreshCw } from 'lucide-react';
import AdminSidebar from '../components/dashboard/AdminSidebar';
import { getAllInquiries } from '../services/adminApi';
import type { AdminInquiryRecord } from '../services/adminApi';
import type { User } from '../types';

interface InquiryOversightProps {
  user: User;
  onLogout: () => void;
}

type InquiryFilter = 'all' | 'open' | 'responded' | 'closed';

const statusColor: Record<string, string> = {
  open: 'text-amber-700 bg-amber-50 ring-amber-200',
  responded: 'text-emerald-700 bg-emerald-50 ring-emerald-200',
  closed: 'text-slate-600 bg-slate-100 ring-slate-200',
};

const InquiryOversight = ({ user, onLogout }: InquiryOversightProps) => {
  const [inquiries, setInquiries] = useState<AdminInquiryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState<InquiryFilter>('all');
  const [expandedInquiry, setExpandedInquiry] = useState<string | null>(null);

  const fetchInquiries = useCallback(async (requestedPage: number) => {
    try {
      setLoading(true);
      setLoadError('');
      const response = await getAllInquiries(requestedPage, 20, statusFilter);
      setInquiries(Array.isArray(response?.inquiries) ? response.inquiries : []);
      setPage(response.page || requestedPage);
      setPages(response.pages || 1);
      setTotal(response.total || 0);
    } catch (error) {
      console.error('Failed to load inquiries', error);
      setInquiries([]);
      setTotal(0);
      setLoadError('Could not load buyer activity right now. Please try again shortly.');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    void fetchInquiries(1);
  }, [fetchInquiries]);

  const formatDate = (iso: string) => {
    const date = new Date(iso);
    return Number.isNaN(date.getTime())
      ? 'Date unavailable'
      : date.toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex min-h-screen bg-[#F8FAFC] font-sans">
      <AdminSidebar user={user} onLogout={onLogout} />

      <main className="flex-1 p-6 md:p-8">
        <div className="mx-auto max-w-5xl space-y-6">
          <header className="border-b border-gray-200 pb-5">
            <p className="text-xs font-bold uppercase tracking-wider text-sky-700">Marketplace oversight</p>
            <h1 className="mt-1 text-3xl font-bold text-gray-900">Buyer Inquiries</h1>
            <p className="mt-1 text-sm text-gray-500">Open an inquiry to read the complete buyer message and seller reply.</p>
          </header>

          <section className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-sky-100 bg-gradient-to-r from-sky-50 via-white to-violet-50 p-4">
            <div>
              <p className="text-sm font-semibold text-slate-900">{total} {statusFilter === 'all' ? 'total' : statusFilter} inquiries</p>
              <p className="text-xs text-slate-500">Most recent first · Admin and super admin access</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {(['all', 'open', 'responded', 'closed'] as const).map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => setStatusFilter(status)}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold capitalize transition ${statusFilter === status ? 'bg-sky-700 text-white shadow-sm' : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-sky-50'}`}
                >
                  {status === 'responded' ? 'Replied' : status}
                </button>
              ))}
              <button type="button" onClick={() => void fetchInquiries(page)} className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50">
                <RefreshCw className="h-3.5 w-3.5" /> Refresh
              </button>
            </div>
          </section>

          {loading ? (
            <div className="rounded-2xl border border-gray-200 bg-white p-16 text-center shadow-sm">
              <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-sky-500 border-t-transparent" />
              <p className="text-gray-500">Loading inquiries...</p>
            </div>
          ) : loadError ? (
            <div className="rounded-2xl border border-red-100 bg-red-50 p-16 text-center">
              <p className="mb-4 text-red-600">{loadError}</p>
              <button onClick={() => void fetchInquiries(1)} className="font-medium text-rose-600 hover:text-rose-700">Try again</button>
            </div>
          ) : inquiries.length === 0 ? (
            <div className="rounded-2xl border border-gray-200 bg-white p-16 text-center shadow-sm">
              <MessageSquare className="mx-auto mb-4 h-12 w-12 text-sky-300" />
              <p className="font-medium text-gray-700">No {statusFilter === 'all' ? '' : `${statusFilter} `}inquiries found</p>
              <p className="mt-1 text-sm text-gray-500">Try another status filter or refresh the list.</p>
            </div>
          ) : (
            <>
              <div className="space-y-3">
                {inquiries.map((inquiry) => {
                  const isExpanded = expandedInquiry === inquiry._id;
                  const hasReply = Boolean(inquiry.sellerReply?.trim());

                  return (
                    <article key={inquiry._id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md">
                      <button
                        type="button"
                        aria-expanded={isExpanded}
                        onClick={() => setExpandedInquiry((current) => current === inquiry._id ? null : inquiry._id)}
                        className="flex w-full items-start gap-4 p-4 text-left sm:p-5"
                      >
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-sky-50">
                          {inquiry.material?.imageUrl ? (
                            <img src={inquiry.material.imageUrl} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <PackageSearch className="h-5 w-5 text-sky-500" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <p className="text-sm font-semibold text-slate-900">{inquiry.material?.title || 'Listing removed'}</p>
                            <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold capitalize ring-1 ${statusColor[inquiry.status] || statusColor.closed}`}>
                              {inquiry.status === 'responded' ? 'Replied' : inquiry.status}
                            </span>
                          </div>
                          <p className="mt-1 text-xs text-slate-500">
                            {formatDate(inquiry.createdAt)} · {inquiry.buyer?.name || 'Buyer'} ({inquiry.buyer?.email || 'email unavailable'}) → {inquiry.seller?.name || 'Seller'}
                          </p>
                          <p className="mt-2 line-clamp-2 whitespace-pre-wrap break-words text-sm text-slate-600">{inquiry.message}</p>
                        </div>
                        <ChevronDown className={`mt-1 h-5 w-5 shrink-0 text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                      </button>

                      {isExpanded && (
                        <div className="space-y-4 border-t border-slate-100 bg-gradient-to-br from-slate-50/70 to-sky-50/40 p-4 sm:p-5">
                          <div className="grid gap-3 text-sm sm:grid-cols-2">
                            <div className="rounded-xl border border-white bg-white p-3">
                              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Buyer</p>
                              <p className="mt-1 font-semibold text-slate-900">{inquiry.buyer?.name || 'Buyer account unavailable'}</p>
                              <p className="text-xs text-slate-500">{inquiry.buyer?.email || 'Email unavailable'}</p>
                            </div>
                            <div className="rounded-xl border border-white bg-white p-3">
                              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Seller</p>
                              <p className="mt-1 font-semibold text-slate-900">{inquiry.seller?.name || 'Seller account unavailable'}</p>
                              <p className="text-xs text-slate-500">{inquiry.seller?.email || 'Email unavailable'}</p>
                            </div>
                          </div>

                          <div className="rounded-xl border border-sky-100 bg-white p-4">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-sky-700">Full buyer inquiry</p>
                            <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-relaxed text-slate-800">{inquiry.message}</p>
                          </div>

                          <div className={`rounded-xl border p-4 ${hasReply ? 'border-emerald-100 bg-emerald-50/80' : 'border-amber-100 bg-amber-50/80'}`}>
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <p className={`text-[10px] font-bold uppercase tracking-wider ${hasReply ? 'text-emerald-800' : 'text-amber-800'}`}>Seller reply</p>
                              {inquiry.repliedAt && <p className="text-[11px] text-slate-500">{formatDate(inquiry.repliedAt)}</p>}
                            </div>
                            <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-relaxed text-slate-800">
                              {inquiry.sellerReply?.trim() || 'The seller has not replied yet.'}
                            </p>
                          </div>

                          {inquiry.material && (
                            <p className="text-xs text-slate-500">
                              Listing: <span className="font-semibold text-slate-700">{inquiry.material.title}</span>
                              {inquiry.material.category ? ` · ${inquiry.material.category}` : ''}
                              {typeof inquiry.material.price === 'number' ? ` · LKR ${inquiry.material.price.toLocaleString()}/kg` : ''}
                              {inquiry.material.status ? ` · ${inquiry.material.status}` : ''}
                            </p>
                          )}
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>

              {pages > 1 && (
                <div className="flex items-center justify-center gap-3 pt-2">
                  <button onClick={() => void fetchInquiries(page - 1)} disabled={page <= 1} className="rounded-lg border border-gray-300 px-4 py-2 text-sm disabled:opacity-50">Previous</button>
                  <span className="text-sm text-gray-500">Page {page} of {pages}</span>
                  <button onClick={() => void fetchInquiries(page + 1)} disabled={page >= pages} className="rounded-lg border border-gray-300 px-4 py-2 text-sm disabled:opacity-50">Next</button>
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
