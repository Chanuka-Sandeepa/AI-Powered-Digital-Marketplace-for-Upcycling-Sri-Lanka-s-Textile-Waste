import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User as UserIcon, Mail, Phone, Save, Package, MessageSquare, ShoppingCart } from 'lucide-react';
import BuyerSidebar from '../components/dashboard/BuyerSidebar';
import API from '../services/api';
import { getMyOrders, getMyInquiries } from '../services/buyerApi';
import { useCart } from '../context/CartContext';
import type { User } from '../types';

interface BuyerProfileProps {
  user: User;
  onLogout: () => void;
  onProfileUpdated?: (user: User) => void;
}

const BuyerProfile = ({ user, onLogout, onProfileUpdated }: BuyerProfileProps) => {
  const navigate = useNavigate();
  const { totalItems } = useCart();
  const [name, setName] = useState(user.name);
  const [phone, setPhone] = useState((user as any).phone || '');
  const [bio, setBio] = useState((user as any).bio || '');
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saved, setSaved] = useState(false);

  const [orderCount, setOrderCount] = useState(0);
  const [totalSpent, setTotalSpent] = useState(0);
  const [inquiryCount, setInquiryCount] = useState(0);
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    Promise.all([getMyOrders(1, 1), getMyInquiries(1, 1)])
      .then(([ordersRes, inquiriesRes]) => {
        setOrderCount(ordersRes.total);
        setTotalSpent(ordersRes.totalSpent);
        setInquiryCount(inquiriesRes.total);
      })
      .catch((error) => console.error('Failed to load profile stats', error))
      .finally(() => setStatsLoading(false));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveError('');
    setSaved(false);
    try {
      const response = await API.put('/auth/me', { name, phone, bio });
      const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
      const updatedUser = { ...user, ...response.data, token: storedUser.token || user.token };
      localStorage.setItem('user', JSON.stringify({ ...storedUser, ...response.data, token: storedUser.token || user.token }));
      onProfileUpdated?.(updatedUser);
      setSaved(true);
    } catch (error: any) {
      console.error('Failed to update profile', error);
      setSaveError(error?.response?.data?.message || 'Failed to save changes. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#F8FAFC] font-sans">
      <BuyerSidebar user={user} onLogout={onLogout} />

      <main className="flex-1 p-6 md:p-8">
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="border-b border-gray-200 pb-5">
            <h1 className="text-3xl font-bold text-gray-900">Profile</h1>
            <p className="text-gray-500 text-sm mt-0.5">Your buyer account details and activity.</p>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div
              onClick={() => navigate('/my-orders')}
              className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
            >
              <Package className="w-5 h-5 text-teal-500 mb-2" />
              <p className="text-xl font-bold text-gray-900">{statsLoading ? '-' : orderCount}</p>
              <p className="text-[11px] text-gray-500">Orders placed</p>
            </div>
            <div
              onClick={() => navigate('/my-inquiries')}
              className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
            >
              <MessageSquare className="w-5 h-5 text-amber-500 mb-2" />
              <p className="text-xl font-bold text-gray-900">{statsLoading ? '-' : inquiryCount}</p>
              <p className="text-[11px] text-gray-500">Inquiries sent</p>
            </div>
            <div
              onClick={() => navigate('/cart')}
              className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
            >
              <ShoppingCart className="w-5 h-5 text-rose-500 mb-2" />
              <p className="text-xl font-bold text-gray-900">{totalItems}</p>
              <p className="text-[11px] text-gray-500">Items in cart</p>
            </div>
          </div>

          {!statsLoading && orderCount > 0 && (
            <div className="bg-gradient-to-r from-teal-500 to-emerald-500 rounded-2xl p-5 text-white">
              <p className="text-teal-50 text-xs uppercase font-semibold">Total Spent</p>
              <p className="text-2xl font-bold mt-1">LKR {totalSpent.toLocaleString()}</p>
            </div>
          )}

          <form onSubmit={handleSave} className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm space-y-4">
            <div className="flex items-center gap-4 pb-4 border-b border-gray-100">
              <div className="w-16 h-16 rounded-full bg-teal-100 flex items-center justify-center">
                <UserIcon className="w-7 h-7 text-teal-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">{user.name}</p>
                <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                  <Mail className="w-3 h-3" /> {user.email}
                </p>
                <span className="inline-block mt-1 text-[10px] font-semibold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full uppercase">
                  {user.role}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-400 focus:border-transparent text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5" /> Phone
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+94 7X XXX XXXX"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-400 focus:border-transparent text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">About</label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={3}
                placeholder="What kind of materials are you looking for?"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-400 focus:border-transparent text-sm resize-none"
              />
            </div>

            {saveError && <p className="text-xs text-red-600">{saveError}</p>}
            {saved && <p className="text-xs text-emerald-600">Profile updated.</p>}

            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-2 bg-teal-500 hover:bg-teal-600 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-all shadow-sm disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
};

export default BuyerProfile;
