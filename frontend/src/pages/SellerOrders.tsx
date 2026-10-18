import { useState, useEffect } from 'react';
import { Package, PackageSearch, Truck, MapPin, Phone } from 'lucide-react';
import Sidebar from '../components/dashboard/Sidebar';
import OrderReviewForm from '../components/OrderReviewForm';
import { getSellerOrders, updateOrderStatus } from '../services/sellerApi';
import type { SellerOrderRecord } from '../services/sellerApi';
import type { User } from '../types';

interface SellerOrdersProps {
  user: User;
  onLogout: () => void;
}

const ORDER_STEPS = ['pending', 'confirmed', 'shipped', 'delivered'] as const;

const orderStatusColor: Record<string, string> = {
  pending: 'text-amber-600 bg-amber-50',
  confirmed: 'text-sky-600 bg-sky-50',
  shipped: 'text-purple-600 bg-purple-50',
  delivered: 'text-emerald-600 bg-emerald-50',
  cancelled: 'text-red-600 bg-red-50',
};

const SellerOrders = ({ user, onLogout }: SellerOrdersProps) => {
  const [orders, setOrders] = useState<SellerOrderRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [updatingId, setUpdatingId] = useState('');
  const [actionError, setActionError] = useState('');
  const [expandedId, setExpandedId] = useState('');

  const fetchOrders = async (p: number) => {
    try {
      setLoading(true);
      setLoadError('');
      const response = await getSellerOrders(p, 20);
      setOrders(response.orders);
      setPage(response.page);
      setPages(response.pages);
    } catch (error) {
      console.error('Failed to load orders', error);
      setOrders([]);
      setLoadError('Could not load your orders right now. Please try again shortly.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders(1);
  }, []);

  const handleStatusUpdate = async (order: SellerOrderRecord, newStatus: string) => {
    setActionError('');
    setUpdatingId(order._id);
    try {
      await updateOrderStatus(order._id, newStatus);
      await fetchOrders(page);
    } catch (error: any) {
      console.error('Failed to update order status', error);
      setActionError(error?.response?.data?.message || 'Failed to update order status.');
    } finally {
      setUpdatingId('');
    }
  };

  const formatDate = (iso?: string) =>
    iso ? new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '-';

  const nextStatus = (current: string): string | null => {
    const idx = ORDER_STEPS.indexOf(current as any);
    if (idx === -1 || idx === ORDER_STEPS.length - 1) return null;
    return ORDER_STEPS[idx + 1];
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-cyan-50/40 to-violet-50/40 font-sans">
      <Sidebar user={user} onLogout={onLogout} />

      <main className="min-w-0 flex-1 p-4 sm:p-6 md:p-8">
        <div className="mx-auto max-w-5xl space-y-5">
          <div className="rounded-3xl bg-gradient-to-r from-cyan-600 via-teal-500 to-emerald-500 p-5 text-white shadow-lg shadow-cyan-200/60 sm:p-6">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-50">Seller workspace</p>
            <h1 className="mt-1 text-2xl font-bold sm:text-3xl">Orders Received</h1>
            <p className="mt-2 max-w-2xl text-sm text-white/85">
              Real purchases against your listings - confirm, ship, and mark delivered as you fulfill each one.
            </p>
          </div>

          {actionError && (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700 shadow-sm">{actionError}</div>
          )}

          {loading ? (
            <div className="rounded-3xl border border-white bg-white/90 p-12 text-center shadow-lg shadow-slate-200/50 ring-1 ring-slate-100">
              <div className="animate-spin w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-gray-500">Loading orders...</p>
            </div>
          ) : loadError ? (
            <div className="rounded-3xl border border-rose-100 bg-rose-50 p-12 text-center shadow-sm">
              <p className="text-red-600 mb-4">{loadError}</p>
              <button onClick={() => fetchOrders(1)} className="text-cyan-600 hover:text-cyan-700 font-medium">Try again</button>
            </div>
          ) : orders.length === 0 ? (
            <div className="rounded-3xl border border-white bg-white/90 p-12 text-center shadow-lg shadow-slate-200/50 ring-1 ring-slate-100">
              <span className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-100 to-violet-100"><Package className="h-8 w-8 text-cyan-700" /></span>
              <p className="text-gray-600 font-medium">No orders yet</p>
              <p className="text-gray-500 text-sm mt-1">Orders placed against your listings will show up here.</p>
            </div>
          ) : (
            <>
              <div className="space-y-3">
                {orders.map((order) => {
                  const next = nextStatus(order.orderStatus);
                  const isExpanded = expandedId === order._id;
                  return (
                    <div key={order._id} className="group overflow-hidden rounded-2xl border border-white bg-white/95 shadow-md shadow-slate-200/50 ring-1 ring-slate-100 transition hover:shadow-lg">
                      <div
                        className="flex cursor-pointer items-center gap-3 p-3.5 transition hover:bg-cyan-50/40 sm:gap-4 sm:p-4"
                        onClick={() => setExpandedId(isExpanded ? '' : order._id)}
                      >
                        <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-gradient-to-br from-cyan-100 to-violet-100 ring-1 ring-cyan-100 sm:h-14 sm:w-14">
                          {order.materialImageUrl ? (
                            <img src={order.materialImageUrl} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <PackageSearch className="m-auto h-6 w-6 text-cyan-600" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 flex-wrap">
                            <div>
                              <p className="truncate text-sm font-bold text-slate-900">{order.materialTitle}</p>
                              <p className="font-mono text-[11px] text-slate-400">{order.orderCode}</p>
                            </div>
                            <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold capitalize ring-1 ring-inset ring-black/5 ${orderStatusColor[order.orderStatus] || 'text-slate-500 bg-slate-100'}`}>
                              {order.orderStatus}
                            </span>
                          </div>
                          <p className="mt-1 text-[11px] text-slate-500">
                            {formatDate(order.createdAt)} · {order.quantityKg}kg · from {order.buyer?.name || 'buyer'}
                          </p>
                          <p className="mt-1 text-sm font-extrabold text-teal-700">LKR {order.totalAmount.toLocaleString()}</p>
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="mt-1 border-t border-slate-100 bg-gradient-to-br from-slate-50/80 to-cyan-50/30 px-4 pb-4 pt-3 sm:px-5 sm:pb-5">
                          <div className="mt-1 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                            <div className="rounded-xl border border-white bg-white/80 p-3 shadow-sm">
                              <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-cyan-700">Delivery Address</p>
                              <p className="flex items-start gap-1.5 text-slate-700">
                                <MapPin className="w-3.5 h-3.5 mt-0.5 shrink-0 text-gray-400" />
                                {order.deliveryAddress.fullName}, {order.deliveryAddress.addressLine},{' '}
                                {order.deliveryAddress.city}, {order.deliveryAddress.district}
                              </p>
                              <p className="mt-1 flex items-center gap-1.5 text-slate-700">
                                <Phone className="w-3.5 h-3.5 shrink-0 text-gray-400" /> {order.deliveryAddress.phone}
                              </p>
                            </div>
                            <div className="rounded-xl border border-white bg-white/80 p-3 shadow-sm">
                              <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-violet-700">Payment</p>
                              <p className="text-slate-700">
                                {order.paymentMethod === 'card' ? 'Card (paid)' : `Cash on Delivery - ${order.paymentStatus}`}
                              </p>
                              <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                                <Truck className="w-3 h-3" /> Est. delivery {formatDate(order.estimatedDeliveryDate)}
                              </p>
                            </div>
                          </div>

                          {order.orderStatus !== 'cancelled' && (
                            <div className="flex items-center gap-2 mt-4 flex-wrap">
                              {next && (
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleStatusUpdate(order, next); }}
                                  disabled={updatingId === order._id}
                                  className="rounded-xl bg-gradient-to-r from-cyan-600 to-teal-500 px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md disabled:opacity-50"
                                >
                                  {updatingId === order._id ? 'Updating...' : `Mark as ${next}`}
                                </button>
                              )}
                              {order.orderStatus === 'pending' && (
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleStatusUpdate(order, 'cancelled'); }}
                                  disabled={updatingId === order._id}
                                  className="rounded-xl border border-rose-200 bg-white px-4 py-2 text-xs font-semibold text-rose-600 transition hover:bg-rose-50 disabled:opacity-50"
                                >
                                  Cancel Order
                                </button>
                              )}
                            </div>
                          )}

                          {order.orderStatus === 'delivered' && (
                            <OrderReviewForm
                              orderId={order._id}
                              reviewerRole="seller"
                              revieweeName={order.buyer?.name || 'the buyer'}
                              reviewed={Boolean(order.reviewedByMe)}
                              onSubmitted={() => setOrders((current) => current.map((item) => item._id === order._id ? { ...item, reviewedByMe: true } : item))}
                            />
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {pages > 1 && (
                <div className="flex items-center justify-center gap-3 pt-2">
                  <button onClick={() => fetchOrders(page - 1)} disabled={page <= 1} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm disabled:opacity-50">
                    Previous
                  </button>
                  <span className="text-sm font-medium text-slate-500">Page {page} of {pages}</span>
                  <button onClick={() => fetchOrders(page + 1)} disabled={page >= pages} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm disabled:opacity-50">
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

export default SellerOrders;
