import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MapPin, PackageSearch, SlidersHorizontal, ShoppingCart, Plus, Check } from 'lucide-react';
import BuyerSidebar from '../components/dashboard/BuyerSidebar';
import { browseMarketplace } from '../services/buyerApi';
import type { MarketplaceListing } from '../services/buyerApi';
import { useCart } from '../context/CartContext';
import { DISTRICTS } from '../constants/sriLanka';
import type { User } from '../types';

interface MarketplaceProps {
  user: User;
  onLogout: () => void;
}

const CATEGORIES = [
  'All', 'Cotton', 'Denim', 'Polyester', 'Wool', 'Silk', 'Linen', 'Nylon',
  'Viscose', 'Blended', 'Leather', 'Fleece', 'Satin', 'Chenille', 'Corduroy', 'Crepe', 'Terrycloth',
];

const gradeColor: Record<string, string> = {
  'A+': 'text-emerald-700 bg-emerald-50', A: 'text-emerald-600 bg-emerald-50',
  B: 'text-sky-600 bg-sky-50', C: 'text-amber-600 bg-amber-50', D: 'text-red-600 bg-red-50',
};

// Doubles as the buyer's dashboard home (per request: "buyer dashboard is
// marketplace") - both /buyer-dashboard and /marketplace render this same
// component, so there's one browsing experience, not two competing ones.
const Marketplace = ({ user, onLogout }: MarketplaceProps) => {
  const navigate = useNavigate();
  const { items: cartItems, addItem, totalItems } = useCart();
  const [listings, setListings] = useState<MarketplaceListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [district, setDistrict] = useState('All');
  const [maxPrice, setMaxPrice] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [justAdded, setJustAdded] = useState<string | null>(null);

  const fetchListings = async () => {
    try {
      setLoading(true);
      setLoadError('');
      const data = await browseMarketplace({
        search: search || undefined,
        category: category !== 'All' ? category : undefined,
        district: district !== 'All' ? district : undefined,
        maxPrice: maxPrice ? Number(maxPrice) : undefined,
        limit: 60,
      });
      setListings(data);
    } catch (error) {
      console.error('Failed to browse marketplace', error);
      setListings([]);
      setLoadError('Could not load marketplace listings right now. Please try again shortly.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchListings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchListings();
  };

  const handleAddToCart = (e: React.MouseEvent, item: MarketplaceListing) => {
    e.stopPropagation();
    addItem(
      {
        materialId: item._id,
        title: item.title,
        imageUrl: item.imageUrl,
        pricePerKg: item.price,
        availableKg: item.quantity,
        sellerName: item.sellerName,
      },
      Math.min(1, item.quantity)
    );
    setJustAdded(item._id);
    setTimeout(() => setJustAdded((cur) => (cur === item._id ? null : cur)), 1200);
  };

  const isInCart = (id: string) => cartItems.some((i) => i.materialId === id);

  return (
    <div className="flex min-h-screen bg-[#F8FAFC] font-sans">
      <BuyerSidebar user={user} onLogout={onLogout} />

      <main className="flex-1 p-6 md:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="border-b border-gray-200 pb-5 flex items-start justify-between flex-wrap gap-3">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Welcome back, {user.name.split(' ')[0]}</h1>
              <p className="text-gray-500 text-sm mt-0.5">
                AI-verified textile waste listings, Sri Lanka-wide. Add items to your cart and check out when ready.
              </p>
            </div>
            <button
              onClick={() => navigate('/cart')}
              className="flex items-center gap-2 bg-teal-500 hover:bg-teal-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-all shadow-sm relative"
            >
              <ShoppingCart className="w-4 h-4" />
              Cart
              {totalItems > 0 && (
                <span className="absolute -top-2 -right-2 bg-rose-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
                  {totalItems}
                </span>
              )}
            </button>
          </div>

          <form onSubmit={handleSearchSubmit} className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm">
            <div className="flex flex-col md:flex-row gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search listings (e.g. cotton offcuts, denim scraps)..."
                  className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-400 focus:border-transparent text-sm"
                />
              </div>
              <button
                type="button"
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 px-4 py-2.5 rounded-xl text-sm font-medium transition-all"
              >
                <SlidersHorizontal className="w-4 h-4" />
                Filters
              </button>
              <button
                type="submit"
                className="bg-teal-500 hover:bg-teal-600 text-white px-6 py-2.5 rounded-xl text-sm font-medium transition-all shadow-sm"
              >
                Search
              </button>
            </div>

            {showFilters && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3 pt-3 border-t border-gray-100">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Fabric Type</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                  >
                    {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">District</label>
                  <select
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                  >
                    <option value="All">All Districts</option>
                    {DISTRICTS.map((d) => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Max Price (LKR/kg)</label>
                  <input
                    type="number"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    placeholder="No limit"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                  />
                </div>
              </div>
            )}
          </form>

          {loading ? (
            <div className="bg-white rounded-2xl p-16 border border-gray-200 shadow-sm text-center">
              <div className="animate-spin w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-gray-500">Loading listings...</p>
            </div>
          ) : loadError ? (
            <div className="bg-red-50 border border-red-100 rounded-2xl p-16 text-center">
              <p className="text-red-600 mb-4">{loadError}</p>
              <button onClick={fetchListings} className="text-teal-600 hover:text-teal-700 font-medium">Try again</button>
            </div>
          ) : listings.length === 0 ? (
            <div className="bg-white rounded-2xl p-16 border border-gray-200 shadow-sm text-center">
              <PackageSearch className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 font-medium">No listings match your search</p>
              <p className="text-gray-500 text-sm mt-1">Try widening your filters.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {listings.map((item) => (
                <div
                  key={item._id}
                  onClick={() => navigate(`/marketplace/${item._id}`)}
                  className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer overflow-hidden"
                >
                  <div className="h-40 bg-gray-100 flex items-center justify-center overflow-hidden">
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" />
                    ) : (
                      <PackageSearch className="w-10 h-10 text-gray-300" />
                    )}
                  </div>
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold text-gray-900 text-sm leading-snug">{item.title}</h3>
                      {item.sustainability?.grade && (
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${gradeColor[item.sustainability.grade] || 'text-gray-600 bg-gray-50'}`}>
                          {item.sustainability.grade}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> {item.district || item.location}
                    </p>
                    <div className="flex items-center justify-between mt-3">
                      <span className="text-lg font-bold text-teal-600">LKR {item.price}<span className="text-xs text-gray-400 font-normal">/kg</span></span>
                      <span className="text-xs text-gray-500">{item.quantity} kg</span>
                    </div>
                    <button
                      onClick={(e) => handleAddToCart(e, item)}
                      disabled={item.quantity <= 0}
                      className={`w-full mt-3 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all disabled:opacity-40 ${
                        justAdded === item._id
                          ? 'bg-emerald-500 text-white'
                          : isInCart(item._id)
                          ? 'bg-teal-50 text-teal-700 border border-teal-200'
                          : 'bg-gray-900 text-white hover:bg-gray-800'
                      }`}
                    >
                      {justAdded === item._id ? (
                        <>
                          <Check className="w-3.5 h-3.5" /> Added
                        </>
                      ) : isInCart(item._id) ? (
                        <>
                          <ShoppingCart className="w-3.5 h-3.5" /> In Cart - Add More
                        </>
                      ) : (
                        <>
                          <Plus className="w-3.5 h-3.5" /> Add to Cart
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Marketplace;
