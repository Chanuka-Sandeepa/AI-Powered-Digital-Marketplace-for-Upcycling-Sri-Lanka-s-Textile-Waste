import { useState, useEffect } from 'react';
import { Package, PackageSearch, Truck, MapPin, Phone } from 'lucide-react';
import Sidebar from '../components/dashboard/Sidebar';
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
    <div className="flex min-h-screen bg-[#F8FAFC] font-sans">
      <Sidebar user={user} onLogout={onLogout} />

      <main className="flex-1 p-6 md:p-8">
        <div className="max-w-5xl mx-auto space-y-6">
          <div className="border-b border-gray-200 pb-5">
            <h1 className="text-3xl font-bold text-gray-900">Orders Received</h1>
            <p className="text-gray-500 text-sm mt-0.5">
              Real purchases against your listings - confirm, ship, and mark delivered as you fulfill each one.
            </p>
          </div>

          {actionError && (
            <div className="bg-red-50 border border-red-100 rounded-xl p-3 text-sm text-red-600">{actionError}</div>
          )}

          {loading ? (
            <div className="bg-white rounded-2xl p-16 border border-gray-200 shadow-sm text-center">
              <div className="animate-spin w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-gray-500">Loading orders...</p>
            </div>
          ) : loadError ? (
            <div className="bg-red-50 border border-red-100 rounded-2xl p-16 text-center">
              <p className="text-red-600 mb-4">{loadError}</p>
              <button onClick={() => fetchOrders(1)} className="text-cyan-600 hover:text-cyan-700 font-medium">Try again</button>
            </div>
          ) : orders.length === 0 ? (
            <div className="bg-white rounded-2xl p-16 border border-gray-200 shadow-sm text-center">
              <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
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
                    <div key={order._id} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                      <div
                        className="p-5 flex items-start gap-4 cursor-pointer"
                        onClick={() => setExpandedId(isExpanded ? '' : order._id)}
                      >
                        <div className="w-14 h-14 bg-gray-100 rounded-xl flex items-center justify-center shrink-0 overflow-hidden">
                          {order.materialImageUrl ? (
                            <img src={order.materialImageUrl} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <PackageSearch className="w-6 h-6 text-gray-300" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 flex-wrap">
                            <div>
                              <p className="font-semibold text-gray-900 text-sm">{order.materialTitle}</p>
                              <p className="text-xs text-gray-400 font-mono">{order.orderCode}</p>
                            </div>
                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${orderStatusColor[order.orderStatus] || 'text-gray-500 bg-gray-100'}`}>
                              {order.orderStatus}
                            </span>
                          </div>
                          <p className="text-xs text-gray-400 mt-1">
                            {formatDate(order.createdAt)} · {order.quantityKg}kg · from {order.buyer?.name || 'buyer'}
                          </p>
                          <p className="text-sm font-bold text-cyan-600 mt-1">LKR {order.totalAmount.toLocaleString()}</p>
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="px-5 pb-5 pt-0 border-t border-gray-100 mt-1">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 text-sm">
                            <div>
                              <p className="text-xs text-gray-400 uppercase font-semibold mb-1">Delivery Address</p>
                              <p className="text-gray-700 flex items-start gap-1.5">
                                <MapPin className="w-3.5 h-3.5 mt-0.5 shrink-0 text-gray-400" />
                                {order.deliveryAddress.fullName}, {order.deliveryAddress.addressLine},{' '}
                                {order.deliveryAddress.city}, {order.deliveryAddress.district}
                              </p>
                              <p className="text-gray-700 flex items-center gap-1.5 mt-1">
                                <Phone className="w-3.5 h-3.5 shrink-0 text-gray-400" /> {order.deliveryAddress.phone}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-400 uppercase font-semibold mb-1">Payment</p>
                              <p className="text-gray-700">
                                {order.paymentMethod === 'card' ? 'Card (paid)' : `Cash on Delivery - ${order.paymentStatus}`}
                              </p>
                              <p className="text-gray-400 text-xs mt-1 flex items-center gap-1">
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
                                  className="bg-cyan-500 hover:bg-cyan-600 text-white px-4 py-2 rounded-lg text-xs font-semibold transition-all disabled:opacity-50"
                                >
                                  {updatingId === order._id ? 'Updating...' : `Mark as ${next}`}
                                </button>
                              )}
                              {order.orderStatus === 'pending' && (
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleStatusUpdate(order, 'cancelled'); }}
                                  disabled={updatingId === order._id}
                                  className="border border-red-200 text-red-600 hover:bg-red-50 px-4 py-2 rounded-lg text-xs font-medium transition-all disabled:opacity-50"
                                >
                                  Cancel Order
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {pages > 1 && (
                <div className="flex items-center justify-center gap-3 pt-2">
                  <button onClick={() => fetchOrders(page - 1)} disabled={page <= 1} className="px-4 py-2 border border-gray-300 rounded-lg text-sm disabled:opacity-50">
                    Previous
                  </button>
                  <span className="text-sm text-gray-500">Page {page} of {pages}</span>
                  <button onClick={() => fetchOrders(page + 1)} disabled={page >= pages} className="px-4 py-2 border border-gray-300 rounded-lg text-sm disabled:opacity-50">
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
