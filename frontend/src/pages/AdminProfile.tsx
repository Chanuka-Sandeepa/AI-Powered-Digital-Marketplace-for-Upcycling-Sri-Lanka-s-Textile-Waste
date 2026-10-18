import { useState } from 'react';
import { User as UserIcon, Mail, Phone, Save, ShieldCheck } from 'lucide-react';
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
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-sky-50/40 to-violet-50/40 font-sans">
      <AdminSidebar user={user} onLogout={onLogout} />

      <main className="min-w-0 flex-1 p-4 md:p-8">
        <div className="mx-auto max-w-3xl space-y-6">
          <header className={`rounded-3xl bg-gradient-to-r ${user.role === 'super_admin' ? 'from-violet-700 via-indigo-600 to-sky-600' : 'from-teal-700 via-cyan-600 to-sky-600'} p-6 text-white shadow-lg`}>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/75">Account settings</p>
            <h1 className="mt-2 text-3xl font-extrabold">Admin Profile</h1>
            <p className="mt-2 text-sm text-white/85">Manage the details shown for your {user.role === 'super_admin' ? 'super-admin' : 'admin'} account.</p>
          </header>

          <form onSubmit={handleSave} className="space-y-5 rounded-2xl border border-white bg-white/95 p-5 shadow-sm ring-1 ring-slate-100 sm:p-7">
            <div className="flex items-center gap-4 border-b border-slate-100 pb-5">
              <div className={`flex h-16 w-16 items-center justify-center rounded-2xl ${user.role === 'super_admin' ? 'bg-violet-100 text-violet-700' : 'bg-teal-100 text-teal-700'}`}>
                <UserIcon className="h-7 w-7" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">{user.name}</p>
                <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                  <Mail className="w-3 h-3" /> {user.email}
                </p>
                <span className={`mt-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${user.role === 'super_admin' ? 'bg-violet-50 text-violet-700' : 'bg-teal-50 text-teal-700'}`}>
                  <ShieldCheck className="h-3 w-3" />
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
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
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
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
              />
            </div>

            {saveError && <p className="text-xs text-red-600">{saveError}</p>}
            {saved && <p className="text-xs text-emerald-600">Profile updated.</p>}

            <button
              type="submit"
              disabled={isSaving}
              className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:shadow-md disabled:opacity-50 ${user.role === 'super_admin' ? 'bg-violet-600 hover:bg-violet-700' : 'bg-teal-600 hover:bg-teal-700'}`}
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
