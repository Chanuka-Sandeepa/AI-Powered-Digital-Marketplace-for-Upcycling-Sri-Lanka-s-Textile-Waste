import { useNavigate } from 'react-router-dom';
import { Trash2, Minus, Plus, ShoppingCart, ArrowLeft, PackageSearch } from 'lucide-react';
import BuyerSidebar from '../components/dashboard/BuyerSidebar';
import { useCart } from '../context/CartContext';
import type { User } from '../types';

interface CartProps {
  user: User;
  onLogout: () => void;
}

const Cart = ({ user, onLogout }: CartProps) => {
  const navigate = useNavigate();
  const { items, updateQuantity, removeItem, totalAmount } = useCart();

  return (
    <div className="flex min-h-screen bg-[#F8FAFC] font-sans">
      <BuyerSidebar user={user} onLogout={onLogout} />

      <main className="flex-1 p-6 md:p-8">
        <div className="max-w-3xl mx-auto space-y-6">
          <button
            onClick={() => navigate('/marketplace')}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-teal-600"
          >
            <ArrowLeft className="w-4 h-4" /> Continue Browsing
          </button>

          <div className="border-b border-gray-200 pb-5">
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <ShoppingCart className="w-7 h-7 text-teal-500" /> Your Cart
            </h1>
            <p className="text-gray-500 text-sm mt-0.5">{items.length} listing{items.length !== 1 ? 's' : ''} selected</p>
          </div>

          {items.length === 0 ? (
            <div className="bg-white rounded-2xl p-16 border border-gray-200 shadow-sm text-center">
              <PackageSearch className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 font-medium mb-2">Your cart is empty</p>
              <p className="text-gray-500 text-sm mb-6">Browse the marketplace to find textile waste to purchase.</p>
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
                {items.map((item) => (
                  <div key={item.materialId} className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm flex items-center gap-4">
                    <div className="w-16 h-16 bg-gray-100 rounded-xl flex items-center justify-center shrink-0 overflow-hidden">
                      {item.imageUrl ? (
                        <img src={item.imageUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <PackageSearch className="w-6 h-6 text-gray-300" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 text-sm truncate">{item.title}</p>
                      <p className="text-xs text-gray-400">Sold by {item.sellerName} · LKR {item.pricePerKg}/kg · max {item.availableKg}kg</p>
                    </div>
                    <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden shrink-0">
                      <button onClick={() => updateQuantity(item.materialId, item.quantityKg - 1)} className="p-2 hover:bg-gray-50 text-gray-500">
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <input
                        type="number"
                        value={item.quantityKg}
                        onChange={(e) => updateQuantity(item.materialId, Number(e.target.value) || 1)}
                        className="w-14 text-center border-0 focus:ring-0 text-sm font-semibold"
                      />
                      <button onClick={() => updateQuantity(item.materialId, item.quantityKg + 1)} className="p-2 hover:bg-gray-50 text-gray-500">
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <p className="font-bold text-teal-600 text-sm w-24 text-right shrink-0">
                      LKR {(item.pricePerKg * item.quantityKg).toLocaleString()}
                    </p>
                    <button onClick={() => removeItem(item.materialId)} className="p-2 hover:bg-red-50 rounded-lg shrink-0">
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-gray-600">Total</span>
                  <span className="text-2xl font-bold text-gray-900">LKR {totalAmount.toLocaleString()}</span>
                </div>
                <button
                  onClick={() => navigate('/checkout')}
                  className="w-full bg-teal-500 hover:bg-teal-600 text-white py-3 rounded-xl text-sm font-semibold transition-all shadow-sm"
                >
                  Proceed to Checkout
                </button>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default Cart;
