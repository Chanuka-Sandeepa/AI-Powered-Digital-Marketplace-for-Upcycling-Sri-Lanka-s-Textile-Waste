import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/dashboard/Sidebar';
import { getSellerMaterials, updateMaterial } from '../services/sellerApi';
import type { User } from '../types';

interface MyListingsProps {
  user: User;
  onLogout: () => void;
}

interface MaterialListing {
  _id: string;
  title: string;
  category: string;
  condition: string;
  quantity: number;
  price: number;
  location: string;
  status: 'available' | 'pending' | 'sold';
  imageUrl?: string;
  createdAt: string;
  fabricType?: string;
  healthScore?: number;
  description?: string;
}

// Common textile categories for the correction dropdown. If your AI
// service's fabric_classes.json uses different names, feel free to adjust
// this list to match - it's just what populates the picker below.
const FABRIC_CATEGORIES = [
  'Cotton', 'Polyester', 'Denim', 'Silk', 'Wool', 'Linen', 'Nylon', 'Rayon',
  'Viscose', 'Chiffon', 'Velvet', 'Satin', 'Fleece', 'Canvas', 'Blended Fabric', 'Leather',
];

const MyListings = ({ user, onLogout }: MyListingsProps) => {
  const navigate = useNavigate();
  const [listings, setListings] = useState<MaterialListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [filter, setFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [editingListing, setEditingListing] = useState<MaterialListing | null>(null);
  const [editForm, setEditForm] = useState({
    title: '', category: '', condition: '', price: '', quantity: '', location: '', description: '',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [editError, setEditError] = useState('');

  const openEditModal = (listing: MaterialListing) => {
    setEditingListing(listing);
    setEditForm({
      title: listing.title,
      category: listing.category,
      condition: listing.condition,
      price: String(listing.price),
      quantity: String(listing.quantity),
      location: listing.location,
      description: listing.description || '',
    });
    setEditError('');
  };

  const handleEditSave = async () => {
    if (!editingListing) return;
    setIsSaving(true);
    setEditError('');
    try {
      await updateMaterial(editingListing._id, {
        title: editForm.title,
        category: editForm.category,
        condition: editForm.condition,
        price: parseFloat(editForm.price),
        quantity: parseFloat(editForm.quantity),
        location: editForm.location,
        description: editForm.description,
      });
      setEditingListing(null);
      fetchListings();
    } catch (error: any) {
      setEditError(error?.response?.data?.message || 'Failed to update listing. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    fetchListings();
  }, [filter, currentPage]);

  const fetchListings = async () => {
    try {
      setLoading(true);
      setLoadError('');
      const status = filter === 'all' ? undefined : filter;
      const response = await getSellerMaterials(status, currentPage, 10);
      setListings(response.materials);
    } catch (error) {
      console.error('Failed to fetch listings:', error);
      setListings([]);
      setLoadError('Could not load your listings right now. Please try again shortly.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-green-100 text-green-700';
      case 'pending':
        return 'bg-yellow-100 text-yellow-700';
      case 'sold':
        return 'bg-blue-100 text-blue-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getHealthScoreColor = (score?: number) => {
    if (!score) return 'text-gray-600';
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const filteredListings = listings.filter(listing =>
    listing.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    listing.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    listing.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-cyan-50/40 to-violet-50/40">
      <Sidebar user={user} onLogout={onLogout} />

      <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-3xl bg-gradient-to-r from-cyan-600 via-teal-500 to-emerald-500 p-5 text-white shadow-lg shadow-cyan-200/60 sm:p-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-50">Seller workspace</p>
              <h1 className="mt-1 text-2xl font-bold">My Listings</h1>
              <p className="mt-1 text-sm text-white/80">Manage your textile materials and offers.</p>
            </div>
            <button
              onClick={() => navigate('/upload-textile-waste')}
              className="rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-teal-700 shadow-sm transition hover:-translate-y-0.5 hover:bg-cyan-50"
            >
              + Add New Listing
            </button>
          </div>

          {/* Filters */}
          <div className="mb-6 rounded-2xl border border-white bg-white/90 p-4 shadow-md shadow-slate-200/40 ring-1 ring-slate-100">
            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Search listings..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none transition focus:border-cyan-400 focus:bg-white focus:ring-4 focus:ring-cyan-100"
                />
              </div>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none transition focus:border-cyan-400 focus:bg-white focus:ring-4 focus:ring-cyan-100"
              >
                <option value="all">All Status</option>
                <option value="available">Available</option>
                <option value="pending">Pending</option>
                <option value="sold">Sold</option>
              </select>
            </div>
          </div>

          {/* Listings Grid */}
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-gray-500">Loading listings...</p>
            </div>
          ) : loadError ? (
            <div className="rounded-2xl border border-rose-100 bg-rose-50 p-10 text-center shadow-sm">
              <p className="text-red-600 mb-4">{loadError}</p>
              <button onClick={fetchListings} className="text-cyan-600 hover:text-cyan-700 font-medium">
                Try again
              </button>
            </div>
          ) : filteredListings.length === 0 ? (
            <div className="rounded-2xl border border-white bg-white/90 p-10 text-center shadow-md ring-1 ring-slate-100">
              <p className="text-gray-500 mb-4">No listings found</p>
              <button
                onClick={() => navigate('/upload-textile-waste')}
                className="text-cyan-600 hover:text-cyan-700 font-medium"
              >
                Create your first listing
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {filteredListings.map((listing) => (
                <div key={listing._id} className="group overflow-hidden rounded-2xl border border-white bg-white shadow-md shadow-slate-200/50 ring-1 ring-slate-100 transition duration-200 hover:-translate-y-1 hover:shadow-xl">
                  <div className="relative h-32 overflow-hidden bg-gradient-to-br from-cyan-100 to-violet-100 sm:h-36">
                    <img
                      src={listing.imageUrl || '/hero_textile.png'}
                      alt={listing.title}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <span className={`absolute right-2.5 top-2.5 rounded-full px-2.5 py-1 text-[11px] font-bold shadow-sm ${getStatusColor(listing.status)}`}>
                      {listing.status.charAt(0).toUpperCase() + listing.status.slice(1)}
                    </span>
                  </div>
                  
                  <div className="p-3.5 sm:p-4">
                    <div className="mb-3 flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-cyan-700">{listing.category}</p>
                        <h3 className="mt-0.5 truncate font-bold text-slate-900">{listing.title}</h3>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-x-3 gap-y-2 rounded-xl bg-slate-50/80 p-3 text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Condition</span>
                        <span className="text-right font-semibold text-slate-800">{listing.condition}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Quantity</span>
                        <span className="text-right font-semibold text-slate-800">{listing.quantity} kg</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Price / kg</span>
                        <span className="text-right font-bold text-teal-700">LKR {listing.price}</span>
                      </div>
                      {listing.healthScore && (
                        <div className="flex justify-between">
                          <span className="text-slate-500">Health score</span>
                          <span className={`text-right font-semibold ${getHealthScoreColor(listing.healthScore)}`}>
                            {listing.healthScore.toFixed(2)}
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-slate-500">Location</span>
                        <span className="truncate text-right font-semibold text-slate-700" title={listing.location}>{listing.location}</span>
                      </div>
                    </div>
                    
                    <div className="mt-3 flex gap-2 border-t border-slate-100 pt-3">
                      <button
                        className="flex-1 rounded-xl bg-gradient-to-r from-cyan-600 to-teal-500 py-2 text-xs font-bold text-white shadow-sm transition hover:shadow-md"
                        onClick={() => navigate('/sustainability-analysis')}
                      >
                        View Details
                      </button>
                      {listing.status === 'available' && (
                        <button
                          className="rounded-xl border border-violet-200 bg-violet-50 px-4 py-2 text-xs font-semibold text-violet-700 transition hover:bg-violet-100"
                          onClick={() => openEditModal(listing)}
                        >
                          Edit
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {!loading && filteredListings.length > 0 && (
            <div className="flex justify-center mt-8 gap-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Previous
              </button>
              <span className="rounded-xl bg-gradient-to-r from-cyan-600 to-teal-500 px-4 py-2 text-sm font-bold text-white shadow-sm">
                {currentPage}
              </span>
              <button
                onClick={() => setCurrentPage(currentPage + 1)}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Edit Listing Modal */}
      {editingListing && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6">
            <h2 className="text-xl font-semibold mb-1">Edit Listing</h2>
            <p className="text-sm text-gray-500 mb-4">Correct any details the AI got wrong before buyers see them.</p>

            {editingListing.fabricType && (
              <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
                If the AI-detected fabric type below is wrong, changing "Category / Fabric Type" here will also
                recalculate this listing's sustainability grade and environmental impact numbers to match.
              </div>
            )}

            {editError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-lg text-sm text-red-600">
                {editError}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  type="text"
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category / Fabric Type</label>
                <select
                  value={editForm.category}
                  onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
                >
                  {!FABRIC_CATEGORIES.includes(editForm.category) && (
                    <option value={editForm.category}>{editForm.category}</option>
                  )}
                  {FABRIC_CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Condition</label>
                  <select
                    value={editForm.condition}
                    onChange={(e) => setEditForm({ ...editForm, condition: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
                  >
                    {['Excellent', 'Good', 'Fair', 'Poor'].map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Price (LKR/kg)</label>
                  <input
                    type="number"
                    value={editForm.price}
                    onChange={(e) => setEditForm({ ...editForm, price: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Quantity (kg)</label>
                  <input
                    type="number"
                    value={editForm.quantity}
                    onChange={(e) => setEditForm({ ...editForm, quantity: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                  <input
                    type="text"
                    value={editForm.location}
                    onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setEditingListing(null)}
                disabled={isSaving}
                className="flex-1 border border-gray-300 text-gray-700 py-2.5 rounded-xl font-medium hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleEditSave}
                disabled={isSaving}
                className="flex-1 bg-cyan-500 text-white py-2.5 rounded-xl font-medium hover:bg-cyan-600 disabled:opacity-50"
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyListings;
