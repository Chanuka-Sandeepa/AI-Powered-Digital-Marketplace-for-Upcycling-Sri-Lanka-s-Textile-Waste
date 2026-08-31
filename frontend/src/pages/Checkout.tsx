import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CreditCard, Banknote, CheckCircle2, PackageSearch } from 'lucide-react';
import BuyerSidebar from '../components/dashboard/BuyerSidebar';
import { useCart } from '../context/CartContext';
import { checkout } from '../services/buyerApi';
import { DISTRICTS } from '../constants/sriLanka';
import type { User } from '../types';

interface CheckoutProps {
  user: User;
  onLogout: () => void;
}

const Checkout = ({ user, onLogout }: CheckoutProps) => {
  const navigate = useNavigate();
  const { items, totalAmount, clearCart } = useCart();

  const [fullName, setFullName] = useState(user.name);
  const [phone, setPhone] = useState(user.phone || '');
  const [addressLine, setAddressLine] = useState('');
  const [city, setCity] = useState('');
  const [district, setDistrict] = useState('Colombo');
  const [postalCode, setPostalCode] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'cash'>('cash');

  // Card fields are collected for UI realism only - no real payment
  // gateway is wired up, this is a simulated/demo payment, not a real
  // charge. Clearly disclosed to the buyer below the form too.
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');

  const [isPlacing, setIsPlacing] = useState(false);
  const [placeError, setPlaceError] = useState('');
  const [placed, setPlaced] = useState(false);

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) return;

    if (paymentMethod === 'card') {
      if (cardNumber.replace(/\s/g, '').length < 12 || !cardExpiry || cardCvv.length < 3) {
        setPlaceError('Please fill in valid card details (this is a simulated payment, no real card is charged).');
        return;
      }
    }

    setIsPlacing(true);
    setPlaceError('');
    try {
      await checkout(
        items.map((i) => ({ materialId: i.materialId, quantityKg: i.quantityKg })),
        { fullName, phone, addressLine, city, district, postalCode },
        paymentMethod
      );
      clearCart();
      setPlaced(true);
    } catch (error: any) {
      console.error('Checkout failed', error);
      setPlaceError(error?.response?.data?.message || 'Checkout failed. Please review your cart and try again.');
    } finally {
      setIsPlacing(false);
    }
  };

  if (placed) {
    return (
      <div className="flex min-h-screen bg-[#F8FAFC] font-sans">
        <BuyerSidebar user={user} onLogout={onLogout} />
        <main className="flex-1 p-6 md:p-8 flex items-center justify-center">
          <div className="bg-white rounded-2xl p-12 border border-gray-200 shadow-sm text-center max-w-md">
            <CheckCircle2 className="w-14 h-14 text-emerald-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Order Placed!</h1>
            <p className="text-gray-500 text-sm mb-6">
              Your order has been sent to the seller{paymentMethod === 'cash' ? ' - payment is due on delivery' : ' and payment has been recorded'}.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => navigate('/my-orders')}
                className="bg-teal-500 hover:bg-teal-600 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-all"
              >
                View My Orders
              </button>
              <button
                onClick={() => navigate('/marketplace')}
                className="border border-gray-300 text-gray-700 px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-50"
              >
                Continue Browsing
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex min-h-screen bg-[#F8FAFC] font-sans">
        <BuyerSidebar user={user} onLogout={onLogout} />
        <main className="flex-1 p-6 md:p-8 flex items-center justify-center">
          <div className="bg-white rounded-2xl p-12 border border-gray-200 shadow-sm text-center">
            <PackageSearch className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 font-medium mb-4">Your cart is empty</p>
            <button onClick={() => navigate('/marketplace')} className="bg-teal-500 hover:bg-teal-600 text-white px-5 py-2.5 rounded-xl text-sm font-medium">
              Browse Marketplace
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#F8FAFC] font-sans">
      <BuyerSidebar user={user} onLogout={onLogout} />

      <main className="flex-1 p-6 md:p-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <button onClick={() => navigate('/cart')} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-teal-600">
            <ArrowLeft className="w-4 h-4" /> Back to Cart
          </button>

          <div className="border-b border-gray-200 pb-5">
            <h1 className="text-3xl font-bold text-gray-900">Checkout</h1>
          </div>

          <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Delivery Address</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-gray-500 mb-1">Full Name</label>
                    <input required value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Phone</label>
                    <input required value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+94 7X XXX XXXX" className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">District</label>
                    <select value={district} onChange={(e) => setDistrict(e.target.value)} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm">
                      {DISTRICTS.map((d) => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-gray-500 mb-1">Address Line</label>
                    <input required value={addressLine} onChange={(e) => setAddressLine(e.target.value)} placeholder="Street address" className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">City</label>
                    <input required value={city} onChange={(e) => setCity(e.target.value)} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Postal Code (optional)</label>
                    <input value={postalCode} onChange={(e) => setPostalCode(e.target.value)} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Payment Method</h2>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('cash')}
                    className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${paymentMethod === 'cash' ? 'border-teal-400 bg-teal-50' : 'border-gray-100 hover:border-gray-200'}`}
                  >
                    <Banknote className={`w-6 h-6 ${paymentMethod === 'cash' ? 'text-teal-600' : 'text-gray-400'}`} />
                    <span className="text-sm font-semibold text-gray-800">Cash on Delivery</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('card')}
                    className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${paymentMethod === 'card' ? 'border-teal-400 bg-teal-50' : 'border-gray-100 hover:border-gray-200'}`}
                  >
                    <CreditCard className={`w-6 h-6 ${paymentMethod === 'card' ? 'text-teal-600' : 'text-gray-400'}`} />
                    <span className="text-sm font-semibold text-gray-800">Card</span>
                  </button>
                </div>

                {paymentMethod === 'card' && (
                  <div className="space-y-3 pt-3 border-t border-gray-100">
                    <p className="text-xs text-amber-600 bg-amber-50 rounded-lg p-2.5">
                      Demo checkout: card details are not processed by a real payment gateway. No real card is charged.
                    </p>
                    <input
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      placeholder="Card Number"
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm"
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <input value={cardExpiry} onChange={(e) => setCardExpiry(e.target.value)} placeholder="MM/YY" className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm" />
                      <input value={cardCvv} onChange={(e) => setCardCvv(e.target.value)} placeholder="CVV" className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm" />
                    </div>
                  </div>
                )}
                {paymentMethod === 'cash' && (
                  <p className="text-xs text-gray-500">Pay the seller in cash when your order is delivered.</p>
                )}
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm h-fit space-y-4">
              <h2 className="text-lg font-bold text-gray-900">Order Summary</h2>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {items.map((item) => (
                  <div key={item.materialId} className="flex justify-between text-sm">
                    <span className="text-gray-600 truncate pr-2">{item.title} × {item.quantityKg}kg</span>
                    <span className="font-medium text-gray-900 shrink-0">LKR {(item.pricePerKg * item.quantityKg).toLocaleString()}</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-gray-100 pt-3 flex justify-between">
                <span className="font-semibold text-gray-900">Items Subtotal</span>
                <span className="font-bold text-gray-900 text-lg">LKR {totalAmount.toLocaleString()}</span>
              </div>
              <p className="text-xs text-gray-400 -mt-2">
                Delivery fee is calculated per seller (LKR 300 same-district, LKR 550 cross-district) and added to your
                final total - shown on your receipt after checkout.
              </p>

              {placeError && <p className="text-xs text-red-600">{placeError}</p>}

              <button
                type="submit"
                disabled={isPlacing}
                className="w-full bg-teal-500 hover:bg-teal-600 text-white py-3 rounded-xl text-sm font-semibold transition-all shadow-sm disabled:opacity-50"
              >
                {isPlacing ? 'Placing Order...' : 'Place Order'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
};

export default Checkout;
