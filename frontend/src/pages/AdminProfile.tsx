import { useState } from 'react';
import { User as UserIcon, Mail, Phone, Save } from 'lucide-react';
import AdminSidebar from '../components/dashboard/AdminSidebar';
import API from '../services/api';
import type { User } from '../types';

interface AdminProfileProps {
  user: User;
  onLogout: () => void;
  onProfileUpdated?: (user: User) => void;
}

const AdminProfile = ({ user, onLogout, onProfileUpdated }: AdminProfileProps) => {
  const [name, setName] = useState(user.name);
  const [phone, setPhone] = useState(user.phone || '');
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saved, setSaved] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveError('');
    setSaved(false);
    try {
      const response = await API.put('/auth/me', { name, phone });
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
      <AdminSidebar user={user} onLogout={onLogout} />

      <main className="flex-1 p-6 md:p-8">
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="border-b border-gray-200 pb-5">
            <h1 className="text-3xl font-bold text-gray-900">Profile</h1>
            <p className="text-gray-500 text-sm mt-0.5">Your {user.role === 'super_admin' ? 'super admin' : 'admin'} account details.</p>
          </div>

          <form onSubmit={handleSave} className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm space-y-4">
            <div className="flex items-center gap-4 pb-4 border-b border-gray-100">
              <div className="w-16 h-16 rounded-full bg-rose-100 flex items-center justify-center">
                <UserIcon className="w-7 h-7 text-rose-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">{user.name}</p>
                <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                  <Mail className="w-3 h-3" /> {user.email}
                </p>
                <span className="inline-block mt-1 text-[10px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full uppercase">
                  {user.role.replace('_', ' ')}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-rose-400 focus:border-transparent text-sm"
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
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-rose-400 focus:border-transparent text-sm"
              />
            </div>

            {saveError && <p className="text-xs text-red-600">{saveError}</p>}
            {saved && <p className="text-xs text-emerald-600">Profile updated.</p>}

            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-2 bg-rose-500 hover:bg-rose-600 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-all shadow-sm disabled:opacity-50"
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

export default AdminProfile;
