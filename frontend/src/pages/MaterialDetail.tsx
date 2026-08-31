import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, MapPin, ShieldCheck, Leaf, PackageSearch, Send, CheckCircle2, Layers, ShoppingCart, Minus, Plus,
} from 'lucide-react';
import BuyerSidebar from '../components/dashboard/BuyerSidebar';
import { getListingDetail, submitInquiry, getListingScenarios } from '../services/buyerApi';
import type { MarketplaceListing } from '../services/buyerApi';
import type { ScenarioComparisonResult } from '../services/sellerApi';
import { useCart } from '../context/CartContext';
import type { User } from '../types';

interface MaterialDetailProps {
  user: User;
  onLogout: () => void;
}

const gradeColor: Record<string, string> = {
  'A+': 'text-emerald-700 bg-emerald-50 border-emerald-200', A: 'text-emerald-600 bg-emerald-50 border-emerald-200',
  B: 'text-sky-600 bg-sky-50 border-sky-200', C: 'text-amber-600 bg-amber-50 border-amber-200', D: 'text-red-600 bg-red-50 border-red-200',
};

const MaterialDetail = ({ user, onLogout }: MaterialDetailProps) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addItem, items: cartItems } = useCart();

  const [listing, setListing] = useState<MarketplaceListing | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [scenarios, setScenarios] = useState<ScenarioComparisonResult | null>(null);
  const [cartQty, setCartQty] = useState(1);
  const [addedToCart, setAddedToCart] = useState(false);

  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState('');
  const [sent, setSent] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setLoadError('');
    getListingDetail(id)
      .then(setListing)
      .catch((error) => {
        console.error('Failed to load listing', error);
        setLoadError('Could not load this listing. It may have been removed.');
      })
      .finally(() => setLoading(false));

    getListingScenarios(id).then(setScenarios).catch(() => setScenarios(null));
  }, [id]);

  const handleInquire = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !message.trim()) return;
    setIsSending(true);
    setSendError('');
    try {
      await submitInquiry(id, message.trim());
      setSent(true);
      setMessage('');
    } catch (error: any) {
      console.error('Failed to send inquiry', error);
      setSendError(error?.response?.data?.message || 'Failed to send your inquiry. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#F8FAFC] font-sans">
      <BuyerSidebar user={user} onLogout={onLogout} />

      <main className="flex-1 p-6 md:p-8">
        <div className="max-w-5xl mx-auto space-y-6">
          <button
            onClick={() => navigate('/marketplace')}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-teal-600"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Marketplace
          </button>

          {loading ? (
            <div className="bg-white rounded-2xl p-16 border border-gray-200 shadow-sm text-center">
              <div className="animate-spin w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-gray-500">Loading listing...</p>
            </div>
          ) : loadError || !listing ? (
            <div className="bg-red-50 border border-red-100 rounded-2xl p-16 text-center">
              <p className="text-red-600">{loadError || 'Listing not found.'}</p>
            </div>
          ) : (
            <>
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="h-64 bg-gray-100 flex items-center justify-center">
                  {listing.imageUrl ? (
                    <img src={listing.imageUrl} alt={listing.title} className="w-full h-full object-cover" />
                  ) : (
                    <PackageSearch className="w-14 h-14 text-gray-300" />
                  )}
                </div>
                <div className="p-6">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h1 className="text-2xl font-bold text-gray-900">{listing.title}</h1>
                      <p className="text-gray-500 text-sm flex items-center gap-1 mt-1">
                        <MapPin className="w-3.5 h-3.5" /> {listing.district || listing.location} · Sold by {listing.sellerName}
                      </p>
                    </div>
                    {listing.sustainability?.grade && (
                      <span className={`text-sm font-bold px-3 py-1 rounded-full border ${gradeColor[listing.sustainability.grade] || 'text-gray-600 bg-gray-50 border-gray-200'}`}>
                        Grade {listing.sustainability.grade}
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-5">
                    <div className="p-3 bg-teal-50 rounded-xl">
                      <p className="text-[10px] text-teal-700 uppercase font-semibold">Price</p>
                      <p className="font-bold text-teal-800 text-lg mt-0.5">LKR {listing.price}/kg</p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-xl">
                      <p className="text-[10px] text-gray-500 uppercase font-semibold">Quantity</p>
                      <p className="font-bold text-gray-900 text-lg mt-0.5">{listing.quantity} kg</p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-xl">
                      <p className="text-[10px] text-gray-500 uppercase font-semibold">Condition</p>
                      <p className="font-bold text-gray-900 text-lg mt-0.5">{listing.condition}</p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-xl">
                      <p className="text-[10px] text-gray-500 uppercase font-semibold">Est. Total</p>
                      <p className="font-bold text-gray-900 text-lg mt-0.5">LKR {(listing.price * listing.quantity).toLocaleString()}</p>
                    </div>
                  </div>

                  <p className="text-gray-600 text-sm mt-5 leading-relaxed">{listing.description}</p>

                  <div className="mt-5 pt-5 border-t border-gray-100 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden">
                      <button
                        type="button"
                        onClick={() => setCartQty((q) => Math.max(1, q - 1))}
                        className="p-3 hover:bg-gray-50 text-gray-500"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <input
                        type="number"
                        min={1}
                        max={listing.quantity}
                        value={cartQty}
                        onChange={(e) => setCartQty(Math.max(1, Math.min(Number(e.target.value) || 1, listing.quantity)))}
                        className="w-16 text-center border-0 focus:ring-0 text-sm font-semibold"
                      />
                      <button
                        type="button"
                        onClick={() => setCartQty((q) => Math.min(listing.quantity, q + 1))}
                        className="p-3 hover:bg-gray-50 text-gray-500"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                      <span className="pr-3 text-xs text-gray-400">kg</span>
                    </div>
                    <button
                      onClick={() => {
                        addItem(
                          { materialId: listing._id, title: listing.title, imageUrl: listing.imageUrl, pricePerKg: listing.price, availableKg: listing.quantity, sellerName: listing.sellerName },
                          cartQty
                        );
                        setAddedToCart(true);
                        setTimeout(() => setAddedToCart(false), 1500);
                      }}
                      disabled={listing.quantity <= 0}
                      className={`flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold transition-all disabled:opacity-40 ${
                        addedToCart ? 'bg-emerald-500 text-white' : 'bg-gray-900 hover:bg-gray-800 text-white'
                      }`}
                    >
                      {addedToCart ? <CheckCircle2 className="w-4 h-4" /> : <ShoppingCart className="w-4 h-4" />}
                      {addedToCart ? 'Added to Cart' : `Add to Cart - LKR ${(listing.price * cartQty).toLocaleString()}`}
                    </button>
                    {cartItems.some((i) => i.materialId === listing._id) && (
                      <button
                        onClick={() => navigate('/cart')}
                        className="px-5 py-3 rounded-xl text-sm font-medium border border-gray-200 hover:bg-gray-50 text-gray-700"
                      >
                        View Cart
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {listing.aiAnalysis && (
                <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                      <ShieldCheck className="w-5 h-5 text-sky-500" /> Fabric Intelligence
                    </h2>
                    <span className="text-[10px] font-semibold text-sky-700 bg-sky-50 px-2.5 py-1 rounded-full border border-sky-100">
                      Member 1
                    </span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Stat label="Fabric Type" value={listing.aiAnalysis.fabricType} />
                    <Stat label="AI Confidence" value={`${listing.aiAnalysis.confidence.toFixed(1)}%`} />
                    <Stat label="Health Score" value={listing.aiAnalysis.healthScore.toFixed(0)} />
                    <Stat label="Repairability" value={listing.aiAnalysis.repairability} />
                  </div>
                </div>
              )}

              {listing.sustainability && (
                <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                      <Leaf className="w-5 h-5 text-emerald-500" /> Sustainability Impact
                    </h2>
                    <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
                      Member 2
                    </span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Stat label="CO2 Saved" value={`${listing.sustainability.co2SavedKg} kg`} />
                    <Stat label="Water Saved" value={`${listing.sustainability.waterSavedLiters} L`} />
                    <Stat label="Circularity" value={listing.sustainability.circularityScore.toFixed(0)} />
                    <Stat label="Recyclability" value={listing.sustainability.recyclabilityScore.toFixed(0)} />
                  </div>
                </div>
              )}

              {scenarios && (
                <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
                  <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-4">
                    <Layers className="w-5 h-5 text-emerald-500" /> Circular Action Comparison
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {scenarios.scenarios.map((s) => (
                      <div
                        key={s.action}
                        className={`rounded-xl p-3 border-2 text-sm ${s.action === scenarios.recommendedAction ? 'border-emerald-300 bg-emerald-50' : 'border-gray-100 bg-gray-50'}`}
                      >
                        <p className="font-bold text-gray-900">{s.action}</p>
                        <p className="text-xs text-gray-500 mt-1">{s.co2SavedKg} kg CO2 · {s.waterSavedLiters} L water saved</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
                <h2 className="text-lg font-bold text-gray-900 mb-3">Contact Seller</h2>
                {sent ? (
                  <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 rounded-xl p-4">
                    <CheckCircle2 className="w-5 h-5" />
                    <p className="text-sm font-medium">Your inquiry has been sent to {listing.sellerName}.</p>
                  </div>
                ) : (
                  <form onSubmit={handleInquire} className="space-y-3">
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder={`Hi ${listing.sellerName}, I'm interested in this ${listing.category} listing...`}
                      rows={4}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-400 focus:border-transparent text-sm resize-none"
                    />
                    {sendError && <p className="text-xs text-red-600">{sendError}</p>}
                    <button
                      type="submit"
                      disabled={isSending || !message.trim()}
                      className="flex items-center gap-2 bg-teal-500 hover:bg-teal-600 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-all shadow-sm disabled:opacity-50"
                    >
                      <Send className="w-4 h-4" />
                      {isSending ? 'Sending...' : 'Send Inquiry'}
                    </button>
                  </form>
                )}
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
};

const Stat = ({ label, value }: { label: string; value: string }) => (
  <div className="p-3 bg-gray-50 rounded-xl">
    <p className="text-[10px] text-gray-400 uppercase font-semibold">{label}</p>
    <p className="font-bold text-gray-900 mt-0.5">{value}</p>
  </div>
);

export default MaterialDetail;
