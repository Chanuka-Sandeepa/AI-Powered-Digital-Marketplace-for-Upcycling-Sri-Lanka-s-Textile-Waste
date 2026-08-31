import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, PackageSearch, Download, Truck, Check } from 'lucide-react';
import BuyerSidebar from '../components/dashboard/BuyerSidebar';
import { getMyOrders, downloadReceipt } from '../services/buyerApi';
import type { OrderRecord } from '../services/buyerApi';
import type { User } from '../types';

interface MyOrdersProps {
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

// Daraz-style horizontal step tracker - filled steps up to the current
// status, current step highlighted, later steps greyed out.
function OrderStatusTracker({ status }: { status: string }) {
  if (status === 'cancelled') {
    return <p className="text-xs font-semibold text-red-600 bg-red-50 inline-block px-2 py-1 rounded-full">Order Cancelled</p>;
  }
  const currentIdx = ORDER_STEPS.indexOf(status as any);
  return (
    <div className="flex items-center w-full max-w-md">
      {ORDER_STEPS.map((step, i) => {
        const done = i <= currentIdx;
        const isLast = i === ORDER_STEPS.length - 1;
        return (
          <div key={step} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center">
              <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${done ? 'bg-teal-500 text-white' : 'bg-gray-200 text-gray-400'}`}>
                {done ? <Check className="w-3 h-3" /> : i + 1}
              </div>
              <span className={`text-[9px] mt-1 capitalize ${done ? 'text-teal-600 font-semibold' : 'text-gray-400'}`}>{step}</span>
            </div>
            {!isLast && <div className={`flex-1 h-0.5 mx-1 mb-4 ${i < currentIdx ? 'bg-teal-500' : 'bg-gray-200'}`} />}
          </div>
        );
      })}
    </div>
  );
}

const MyOrders = ({ user, onLogout }: MyOrdersProps) => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [totalSpent, setTotalSpent] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [downloadingId, setDownloadingId] = useState('');

  const handleDownloadReceipt = async (orderId: string) => {
    setDownloadingId(orderId);
    try {
      await downloadReceipt(orderId);
    } catch (error) {
      console.error('Failed to download receipt', error);
    } finally {
      setDownloadingId('');
    }
  };

  const fetchOrders = async (p: number) => {
    try {
      setLoading(true);
      setLoadError('');
      const response = await getMyOrders(p, 20);
      setOrders(response.orders);
      setTotalSpent(response.totalSpent);
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

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

  return (
    <div className="flex min-h-screen bg-[#F8FAFC] font-sans">
      <BuyerSidebar user={user} onLogout={onLogout} />

      <main className="flex-1 p-6 md:p-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="border-b border-gray-200 pb-5 flex items-start justify-between flex-wrap gap-3">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Orders</h1>
              <p className="text-gray-500 text-sm mt-0.5">Everything you've purchased through TexCycle AI.</p>
            </div>
            {!loading && orders.length > 0 && (
              <div className="bg-white rounded-xl px-5 py-3 border border-gray-200 shadow-sm text-right">
                <p className="text-[10px] text-gray-400 uppercase font-semibold">Total Spent</p>
                <p className="text-xl font-bold text-teal-600">LKR {totalSpent.toLocaleString()}</p>
              </div>
            )}
          </div>

          {loading ? (
            <div className="bg-white rounded-2xl p-16 border border-gray-200 shadow-sm text-center">
              <div className="animate-spin w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-gray-500">Loading your orders...</p>
            </div>
          ) : loadError ? (
            <div className="bg-red-50 border border-red-100 rounded-2xl p-16 text-center">
              <p className="text-red-600 mb-4">{loadError}</p>
              <button onClick={() => fetchOrders(1)} className="text-teal-600 hover:text-teal-700 font-medium">Try again</button>
            </div>
          ) : orders.length === 0 ? (
            <div className="bg-white rounded-2xl p-16 border border-gray-200 shadow-sm text-center">
              <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 font-medium mb-2">No orders yet</p>
              <p className="text-gray-500 text-sm mb-6">Browse the marketplace and add items to your cart to place your first order.</p>
              <button
                onClick={() => navigate('/marketplace')}
                className="bg-teal-500 hover:bg-teal-600 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-all shadow-sm"
              >
                Browse Marketplace
              </button>
            </div>
          ) : (
            <>
              <div className="space-y-3">
                {orders.map((order) => (
                  <div key={order._id} className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm">
                    <div className="flex items-start gap-4">
                      <div className="w-16 h-16 bg-gray-100 rounded-xl flex items-center justify-center shrink-0 overflow-hidden">
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
                            <p className="text-[11px] text-gray-400 font-mono mt-0.5">{order.orderCode}</p>
                          </div>
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${orderStatusColor[order.orderStatus] || 'text-gray-500 bg-gray-100'}`}>
                            {order.orderStatus}
                          </span>
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {formatDate(order.createdAt)} · {order.quantityKg}kg · from {order.seller?.name || 'seller'}
                        </p>
                        <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                          <span className="text-sm font-bold text-teal-600">LKR {order.totalAmount.toLocaleString()}</span>
                          <span className="text-xs text-gray-400">
                            {order.paymentMethod === 'card' ? 'Paid by card' : order.paymentStatus === 'paid' ? 'Paid (cash)' : 'Cash on delivery'}
                          </span>
                          {order.estimatedDeliveryDate && order.orderStatus !== 'delivered' && order.orderStatus !== 'cancelled' && (
                            <span className="text-xs text-gray-400 flex items-center gap-1">
                              <Truck className="w-3 h-3" /> Est. {formatDate(order.estimatedDeliveryDate)}
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => handleDownloadReceipt(order._id)}
                        disabled={downloadingId === order._id}
                        title="Download receipt (PDF)"
                        className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-teal-600 border border-gray-200 hover:border-teal-300 rounded-full px-3 py-1.5 transition-colors disabled:opacity-50 shrink-0"
                      >
                        <Download className="w-3.5 h-3.5" />
                        {downloadingId === order._id ? '...' : 'Receipt'}
                      </button>
                    </div>
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <OrderStatusTracker status={order.orderStatus} />
                    </div>
                  </div>
                ))}
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

export default MyOrders;
