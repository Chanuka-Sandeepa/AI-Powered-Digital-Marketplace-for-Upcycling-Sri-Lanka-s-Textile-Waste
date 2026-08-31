import { useState, useEffect } from 'react';
import Sidebar from '../components/dashboard/Sidebar';
import {
  getSellerProfile,
  updateSellerProfile,
  getCompanyInfo,
  updateCompanyInfo,
} from '../services/sellerApi';
import type { User } from '../types';

interface SellerProfileProps {
  user: User;
  onLogout: () => void;
}

interface CompanyInfo {
  companyName: string;
  businessType: string;
  registrationNumber: string;
  taxId: string;
  address: string;
  city: string;
  country: string;
  postalCode: string;
  phone: string;
  website: string;
}

interface SellerStats {
  totalListings: number;
  totalSales: number;
  totalRevenue: number;
  averageRating: number | null;
  responseRate: number | null;
  memberSince: string;
}

const SellerProfile = ({ user, onLogout }: SellerProfileProps) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'company' | 'settings'>('profile');
  const [loading, setLoading] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  
  const [profileData, setProfileData] = useState({
    name: user.name || '',
    email: user.email || '',
    phone: user.phone || '',
    bio: '',
    avatar: ''
  });

  const [companyInfo, setCompanyInfo] = useState<CompanyInfo>({
    companyName: '',
    businessType: '',
    registrationNumber: '',
    taxId: '',
    address: '',
    city: '',
    country: 'Sri Lanka',
    postalCode: '',
    phone: '',
    website: ''
  });

  const [sellerStats, setSellerStats] = useState<SellerStats>({
    totalListings: 0,
    totalSales: 0,
    totalRevenue: 0,
    averageRating: null,
    responseRate: null,
    memberSince: ''
  });
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    fetchProfileData();
  }, []);

  const fetchProfileData = async () => {
    try {
      setLoading(true);
      setLoadError('');
      const [profileResponse, companyResponse] = await Promise.all([
        getSellerProfile(),
        getCompanyInfo(),
      ]);

      setProfileData({
        name: profileResponse.name || user.name || '',
        email: profileResponse.email || user.email || '',
        phone: profileResponse.phone || '',
        bio: profileResponse.bio || '',
        avatar: profileResponse.avatar || ''
      });

      setCompanyInfo({
        companyName: companyResponse.companyName || '',
        businessType: companyResponse.businessType || '',
        registrationNumber: companyResponse.registrationNumber || '',
        taxId: companyResponse.taxId || '',
        address: companyResponse.address || '',
        city: companyResponse.city || '',
        country: companyResponse.country || 'Sri Lanka',
        postalCode: companyResponse.postalCode || '',
        phone: companyResponse.phone || '',
        website: companyResponse.website || ''
      });

      setSellerStats({
        totalListings: profileResponse.totalListings || 0,
        totalSales: profileResponse.totalSales || 0,
        totalRevenue: profileResponse.totalRevenue || 0,
        averageRating: profileResponse.averageRating ?? null,
        responseRate: profileResponse.responseRate ?? null,
        memberSince: profileResponse.memberSince || ''
      });
    } catch (error) {
      console.error('Failed to fetch profile data:', error);
      setLoadError('Could not load your profile right now. Please try again shortly.');
    } finally {
      setLoading(false);
    }
  };

  const handleProfileSave = async () => {
    try {
      setLoading(true);
      await updateSellerProfile({
        name: profileData.name,
        phone: profileData.phone,
        bio: profileData.bio,
        avatar: profileData.avatar,
      });

      setSaveMessage('Profile updated successfully!');
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (error) {
      console.error('Failed to update profile:', error);
      setSaveMessage('Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCompanySave = async () => {
    try {
      setLoading(true);
      await updateCompanyInfo(companyInfo);

      setSaveMessage('Company information updated successfully!');
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (error) {
      console.error('Failed to update company info:', error);
      setSaveMessage('Failed to update company information. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '—';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar user={user} onLogout={onLogout} />

      <main className="flex-1 p-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">My Profile</h1>

          {/* Stats Overview */}
          {loadError && (
            <div className="mb-6 rounded-xl bg-red-50 border border-red-100 p-4 text-sm text-red-600">
              {loadError}
            </div>
          )}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <p className="text-gray-500 text-sm">Total Listings</p>
              <p className="text-2xl font-bold text-gray-900">{sellerStats.totalListings}</p>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <p className="text-gray-500 text-sm">Total Sales</p>
              <p className="text-2xl font-bold text-green-600">{sellerStats.totalSales}</p>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <p className="text-gray-500 text-sm">Revenue</p>
              <p className="text-2xl font-bold text-cyan-600">LKR {sellerStats.totalRevenue.toLocaleString()}</p>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <p className="text-gray-500 text-sm">Rating</p>
              <p className="text-2xl font-bold text-yellow-600">
                {sellerStats.averageRating != null ? `⭐ ${sellerStats.averageRating}` : 'No ratings yet'}
              </p>
            </div>
          </div>

          {/* Tabs */}
          <div className="bg-white rounded-xl shadow-sm mb-6">
            <div className="border-b">
              <nav className="flex">
                <button
                  onClick={() => setActiveTab('profile')}
                  className={`px-6 py-4 font-medium transition-colors ${
                    activeTab === 'profile'
                      ? 'border-b-2 border-cyan-500 text-cyan-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Personal Profile
                </button>
                <button
                  onClick={() => setActiveTab('company')}
                  className={`px-6 py-4 font-medium transition-colors ${
                    activeTab === 'company'
                      ? 'border-b-2 border-cyan-500 text-cyan-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Company Information
                </button>
                <button
                  onClick={() => setActiveTab('settings')}
                  className={`px-6 py-4 font-medium transition-colors ${
                    activeTab === 'settings'
                      ? 'border-b-2 border-cyan-500 text-cyan-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Account Settings
                </button>
              </nav>
            </div>

            <div className="p-6">
              {saveMessage && (
                <div className={`mb-4 p-3 rounded-lg ${
                  saveMessage.includes('success') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>
                  {saveMessage}
                </div>
              )}

              {/* Personal Profile Tab */}
              {activeTab === 'profile' && (
                <div className="space-y-6">
                  <div className="flex items-center gap-6">
                    <div className="h-24 w-24 bg-gray-200 rounded-full flex items-center justify-center">
                      <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <div>
                      <button className="bg-cyan-500 text-white px-4 py-2 rounded-lg hover:bg-cyan-600 transition-colors text-sm">
                        Upload Photo
                      </button>
                      <p className="text-gray-500 text-xs mt-1">JPG, PNG. Max 2MB</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                      <input
                        type="text"
                        value={profileData.name}
                        onChange={(e) => setProfileData({...profileData, name: e.target.value})}
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                      <input
                        type="email"
                        value={profileData.email}
                        onChange={(e) => setProfileData({...profileData, email: e.target.value})}
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                      <input
                        type="tel"
                        value={profileData.phone}
                        onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Member Since</label>
                      <input
                        type="text"
                        value={formatDate(sellerStats.memberSince)}
                        disabled
                        className="w-full px-4 py-2 border rounded-lg bg-gray-50 text-gray-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Bio</label>
                    <textarea
                      value={profileData.bio}
                      onChange={(e) => setProfileData({...profileData, bio: e.target.value})}
                      rows={4}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
                      placeholder="Tell buyers about your business and sustainability practices..."
                    />
                  </div>

                  <button
                    onClick={handleProfileSave}
                    disabled={loading}
                    className="bg-cyan-500 text-white px-6 py-2 rounded-lg hover:bg-cyan-600 transition-colors disabled:opacity-50"
                  >
                    {loading ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              )}

              {/* Company Information Tab */}
              {activeTab === 'company' && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Company Name</label>
                    <input
                      type="text"
                      value={companyInfo.companyName}
                      onChange={(e) => setCompanyInfo({...companyInfo, companyName: e.target.value})}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Business Type</label>
                      <select
                        value={companyInfo.businessType}
                        onChange={(e) => setCompanyInfo({...companyInfo, businessType: e.target.value})}
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
                      >
                        <option value="">Select business type</option>
                        <option value="Textile Manufacturer">Textile Manufacturer</option>
                        <option value="Garment Factory">Garment Factory</option>
                        <option value="Recycling Center">Recycling Center</option>
                        <option value="Wholesaler">Wholesaler</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Registration Number</label>
                      <input
                        type="text"
                        value={companyInfo.registrationNumber}
                        onChange={(e) => setCompanyInfo({...companyInfo, registrationNumber: e.target.value})}
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Tax ID</label>
                      <input
                        type="text"
                        value={companyInfo.taxId}
                        onChange={(e) => setCompanyInfo({...companyInfo, taxId: e.target.value})}
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Website</label>
                      <input
                        type="url"
                        value={companyInfo.website}
                        onChange={(e) => setCompanyInfo({...companyInfo, website: e.target.value})}
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                    <input
                      type="text"
                      value={companyInfo.address}
                      onChange={(e) => setCompanyInfo({...companyInfo, address: e.target.value})}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                      <input
                        type="text"
                        value={companyInfo.city}
                        onChange={(e) => setCompanyInfo({...companyInfo, city: e.target.value})}
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Country</label>
                      <input
                        type="text"
                        value={companyInfo.country}
                        onChange={(e) => setCompanyInfo({...companyInfo, country: e.target.value})}
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Postal Code</label>
                      <input
                        type="text"
                        value={companyInfo.postalCode}
                        onChange={(e) => setCompanyInfo({...companyInfo, postalCode: e.target.value})}
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Business Phone</label>
                    <input
                      type="tel"
                      value={companyInfo.phone}
                      onChange={(e) => setCompanyInfo({...companyInfo, phone: e.target.value})}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
                    />
                  </div>

                  <button
                    onClick={handleCompanySave}
                    disabled={loading}
                    className="bg-cyan-500 text-white px-6 py-2 rounded-lg hover:bg-cyan-600 transition-colors disabled:opacity-50"
                  >
                    {loading ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              )}

              {/* Account Settings Tab */}
              {activeTab === 'settings' && (
                <div className="space-y-6">
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <h3 className="font-medium text-yellow-800 mb-2">⚠️ Important</h3>
                    <p className="text-sm text-yellow-700">
                      Changes to account settings may affect your access to the platform. Please review carefully before saving.
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Current Password</label>
                    <input
                      type="password"
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
                      placeholder="Enter current password"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
                      <input
                        type="password"
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
                        placeholder="Enter new password"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Confirm New Password</label>
                      <input
                        type="password"
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
                        placeholder="Confirm new password"
                      />
                    </div>
                  </div>

                  <div className="border-t pt-6">
                    <h3 className="font-medium text-gray-900 mb-4">Notification Preferences</h3>
                    <div className="space-y-3">
                      <label className="flex items-center">
                        <input type="checkbox" defaultChecked className="mr-3" />
                        <span className="text-sm text-gray-700">Email notifications for new inquiries</span>
                      </label>
                      <label className="flex items-center">
                        <input type="checkbox" defaultChecked className="mr-3" />
                        <span className="text-sm text-gray-700">Email notifications for sales</span>
                      </label>
                      <label className="flex items-center">
                        <input type="checkbox" defaultChecked className="mr-3" />
                        <span className="text-sm text-gray-700">Weekly sustainability reports</span>
                      </label>
                      <label className="flex items-center">
                        <input type="checkbox" className="mr-3" />
                        <span className="text-sm text-gray-700">Marketing emails</span>
                      </label>
                    </div>
                  </div>

                  <div className="border-t pt-6">
                    <h3 className="font-medium text-red-600 mb-4">Danger Zone</h3>
                    <button className="border border-red-300 text-red-600 px-4 py-2 rounded-lg hover:bg-red-50 transition-colors text-sm">
                      Deactivate Account
                    </button>
                  </div>

                  <button
                    className="bg-cyan-500 text-white px-6 py-2 rounded-lg hover:bg-cyan-600 transition-colors"
                  >
                    Save Settings
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default SellerProfile;
