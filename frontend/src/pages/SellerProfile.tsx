import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, BadgeCheck, Boxes, MapPin, Package, ShoppingBag, Star } from 'lucide-react';
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
  availableListings: number;
  soldListings: number;
  totalSales: number;
  totalRevenue: number;
  quantitySold: number;
  availableMaterials: Array<{
    _id: string;
    title: string;
    category: string;
    condition?: string;
    quantity: number;
    price: number;
    location?: string;
    imageUrl?: string;
    status: string;
  }>;
  averageRating: number | null;
  reviewCount: number;
  reviews: Array<{
    _id: string;
    rating: number;
    comment: string;
    materialTitle?: string;
    createdAt: string;
    reviewer: { name: string; avatar?: string } | null;
  }>;
  responseRate: number | null;
  memberSince: string;
}

const SellerProfile = ({ user, onLogout }: SellerProfileProps) => {
  const navigate = useNavigate();
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
    availableListings: 0,
    soldListings: 0,
    totalSales: 0,
    totalRevenue: 0,
    quantitySold: 0,
    availableMaterials: [],
    averageRating: null,
    reviewCount: 0,
    reviews: [],
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
        availableListings: profileResponse.availableListings || 0,
        soldListings: profileResponse.soldListings || 0,
        totalSales: profileResponse.totalSales || 0,
        totalRevenue: profileResponse.totalRevenue || 0,
        quantitySold: profileResponse.quantitySold || 0,
        availableMaterials: profileResponse.availableMaterials || [],
        averageRating: profileResponse.averageRating ?? null,
        reviewCount: profileResponse.reviewCount || 0,
        reviews: profileResponse.reviews || [],
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

      <main className="min-w-0 flex-1 bg-gradient-to-br from-slate-50 via-cyan-50/40 to-emerald-50/50 p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-6xl">
          <header className="relative mb-6 overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-700 via-teal-600 to-cyan-600 px-6 py-7 text-white shadow-lg shadow-teal-900/10 sm:px-8">
            <div className="absolute -right-10 -top-16 h-56 w-56 rounded-full bg-white/10" />
            <div className="absolute right-28 -bottom-28 h-56 w-56 rounded-full bg-cyan-300/10" />
            <div className="relative flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-teal-100">Seller workspace</p>
                <h1 className="mt-2 text-3xl font-bold">My Seller Profile</h1>
                <p className="mt-2 text-sm text-teal-50">Your sales, active inventory, and buyer reputation at a glance.</p>
              </div>
              <div className="flex items-center gap-3 rounded-2xl border border-white/20 bg-white/10 px-4 py-3 backdrop-blur-sm">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white/20 text-lg font-bold">
                  {(profileData.name || user.name || 'S').slice(0, 1).toUpperCase()}
                </div>
                <div><p className="font-semibold">{profileData.name || user.name}</p><p className="text-xs text-teal-100">Seller account</p></div>
                <BadgeCheck className="ml-2 h-5 w-5 text-emerald-200" />
              </div>
            </div>
          </header>

          {/* Stats Overview */}
          {loadError && (
            <div className="mb-6 rounded-xl bg-red-50 border border-red-100 p-4 text-sm text-red-600">
              {loadError}
            </div>
          )}
          <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
            <div className="rounded-2xl border border-sky-100 bg-white p-4 shadow-sm shadow-sky-100/60">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-sky-100 text-sky-700"><Package className="h-5 w-5" /></div>
              <p className="text-sm text-slate-500">Total Listings</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">{sellerStats.totalListings}</p>
            </div>
            <div className="rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm shadow-emerald-100/60">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700"><Boxes className="h-5 w-5" /></div>
              <p className="text-sm text-slate-500">Available Listings</p>
              <p className="mt-1 text-2xl font-bold text-emerald-700">{sellerStats.availableListings}</p>
            </div>
            <div className="rounded-2xl border border-violet-100 bg-white p-4 shadow-sm shadow-violet-100/60">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100 text-violet-700"><ShoppingBag className="h-5 w-5" /></div>
              <p className="text-sm text-slate-500">Completed Sales</p>
              <p className="mt-1 text-2xl font-bold text-violet-700">{sellerStats.totalSales}</p>
            </div>
            <div className="rounded-2xl border border-amber-100 bg-white p-4 shadow-sm shadow-amber-100/60">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-700"><Star className="h-5 w-5 fill-amber-400" /></div>
              <p className="text-sm text-slate-500">Buyer Rating</p>
              <p className="flex items-center gap-1 text-2xl font-bold text-amber-700">
                {sellerStats.averageRating != null ? sellerStats.averageRating.toFixed(1) : '—'}
              </p>
              <p className="mt-1 text-xs text-slate-400">{sellerStats.reviewCount} review{sellerStats.reviewCount === 1 ? '' : 's'}</p>
            </div>
            <div className="col-span-2 rounded-2xl border border-cyan-100 bg-white p-4 shadow-sm shadow-cyan-100/60 sm:col-span-1">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-100 text-cyan-700"><span className="text-xs font-bold">LKR</span></div>
              <p className="text-sm text-slate-500">Sales Revenue</p>
              <p className="mt-1 truncate text-2xl font-bold text-cyan-800">LKR {sellerStats.totalRevenue.toLocaleString()}</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="mb-6 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm shadow-slate-200/60">
            <div className="border-b border-slate-100 bg-slate-50/80">
              <nav className="flex overflow-x-auto">
                <button
                  onClick={() => setActiveTab('profile')}
                  className={`px-6 py-4 font-medium transition-colors ${
                    activeTab === 'profile'
                    ? 'border-b-2 border-cyan-600 bg-white text-cyan-700'
                      : 'text-gray-500 hover:bg-white/70 hover:text-gray-700'
                  }`}
                >
                  Personal Profile
                </button>
                <button
                  onClick={() => setActiveTab('company')}
                  className={`px-6 py-4 font-medium transition-colors ${
                    activeTab === 'company'
                    ? 'border-b-2 border-cyan-600 bg-white text-cyan-700'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Company Information
                </button>
                <button
                  onClick={() => setActiveTab('settings')}
                  className={`px-6 py-4 font-medium transition-colors ${
                    activeTab === 'settings'
                    ? 'border-b-2 border-cyan-600 bg-white text-cyan-700'
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


                  <section className="rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50/80 via-white to-cyan-50/50 p-5">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700"><Boxes className="h-5 w-5" /></div>
                          <h2 className="text-lg font-bold text-slate-900">Available materials</h2>
                        </div>
                        <p className="mt-1 text-sm text-slate-500">{sellerStats.availableListings} active listing{sellerStats.availableListings === 1 ? '' : 's'} ready for buyers.</p>
                      </div>
                      <button type="button" onClick={() => navigate('/my-listings')} className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-white px-4 py-2 text-sm font-semibold text-emerald-800 transition hover:bg-emerald-50">
                        Manage listings <ArrowRight className="h-4 w-4" />
                      </button>
                    </div>
                    {sellerStats.availableMaterials.length === 0 ? (
                      <div className="mt-4 rounded-xl border border-dashed border-emerald-200 bg-white/80 px-4 py-7 text-center">
                        <Package className="mx-auto h-7 w-7 text-emerald-500" />
                        <p className="mt-2 text-sm font-semibold text-slate-700">No available listings right now</p>
                        <p className="mt-1 text-xs text-slate-500">Published materials with remaining stock will appear here.</p>
                      </div>
                    ) : (
                      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                        {sellerStats.availableMaterials.map((material) => (
                          <article key={material._id} className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                            <div className="relative h-32 bg-gradient-to-br from-emerald-100 to-cyan-100">
                              {material.imageUrl ? <img src={material.imageUrl} alt={material.title} className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-emerald-700"><Package className="h-9 w-9" /></div>}
                              <span className="absolute left-2 top-2 rounded-full bg-emerald-600 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white shadow">Available</span>
                            </div>
                            <div className="p-3.5">
                              <div className="flex items-start justify-between gap-2">
                                <h3 className="line-clamp-1 font-semibold text-slate-900">{material.title}</h3>
                                <span className="shrink-0 rounded-full bg-cyan-50 px-2 py-1 text-[10px] font-semibold text-cyan-800">{material.category}</span>
                              </div>
                              <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                                <span>{Number(material.quantity).toLocaleString()} kg available</span>
                                <span className="font-bold text-emerald-700">LKR {Number(material.price).toLocaleString()}/kg</span>
                              </div>
                              {material.location && <p className="mt-2 flex items-center gap-1 text-xs text-slate-400"><MapPin className="h-3.5 w-3.5" />{material.location}</p>}
                            </div>
                          </article>
                        ))}
                      </div>
                    )}
                  </section>

                  <section className="rounded-xl border border-amber-100 bg-gradient-to-br from-amber-50/70 to-white p-5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <h2 className="text-lg font-bold text-gray-900">Buyer feedback</h2>
                        <p className="mt-1 text-sm text-gray-500">Ratings from buyers after their orders were delivered.</p>
                      </div>
                      <div className="flex items-center gap-1 rounded-full bg-white px-3 py-1.5 text-sm font-semibold text-amber-700 shadow-sm">
                        <Star className="h-4 w-4 fill-amber-400 text-amber-500" />
                        {sellerStats.averageRating != null ? sellerStats.averageRating.toFixed(1) : '?'}
                        <span className="text-xs font-normal text-gray-500">({sellerStats.reviewCount})</span>
                      </div>
                    </div>
                    {sellerStats.reviews.length === 0 ? (
                      <p className="mt-4 rounded-lg bg-white/80 p-4 text-sm text-gray-500">No buyer reviews yet. Feedback will appear here after a delivered order is reviewed.</p>
                    ) : (
                      <div className="mt-4 space-y-3">
                        {sellerStats.reviews.map((review) => (
                          <article key={review._id} className="rounded-lg border border-amber-100 bg-white p-4">
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex items-center gap-2">
                                {review.reviewer?.avatar ? (
                                  <img src={review.reviewer.avatar} alt="" className="h-8 w-8 rounded-full object-cover" />
                                ) : (
                                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-cyan-100 text-xs font-bold text-cyan-800">{(review.reviewer?.name || 'B').slice(0, 1).toUpperCase()}</div>
                                )}
                                <div>
                                  <p className="text-sm font-semibold text-gray-900">{review.reviewer?.name || 'Buyer'}</p>
                                  <p className="text-xs text-gray-400">{formatDate(review.createdAt)}</p>
                                </div>
                              </div>
                              <div className="flex shrink-0 items-center gap-0.5" aria-label={`${review.rating} out of 5 stars`}>
                                {[1, 2, 3, 4, 5].map((star) => <Star key={star} className={`h-3.5 w-3.5 ${star <= review.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-200'}`} />)}
                              </div>
                            </div>
                            <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-gray-700">{review.comment}</p>
                            {review.materialTitle && <p className="mt-2 text-xs font-medium text-cyan-700">Order: {review.materialTitle}</p>}
                          </article>
                        ))}
                      </div>
                    )}
                  </section>

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
