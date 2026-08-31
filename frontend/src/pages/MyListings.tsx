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
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar user={user} onLogout={onLogout} />

      <main className="flex-1 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-900">My Listings</h1>
            <button
              onClick={() => navigate('/upload-textile-waste')}
              className="bg-cyan-500 text-white px-4 py-2 rounded-lg hover:bg-cyan-600 transition-colors"
            >
              + Add New Listing
            </button>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-xl p-4 shadow-sm mb-6">
            <div className="flex gap-4">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Search listings..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
                />
              </div>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
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
            <div className="bg-red-50 border border-red-100 rounded-xl p-12 text-center">
              <p className="text-red-600 mb-4">{loadError}</p>
              <button onClick={fetchListings} className="text-cyan-600 hover:text-cyan-700 font-medium">
                Try again
              </button>
            </div>
          ) : filteredListings.length === 0 ? (
            <div className="bg-white rounded-xl p-12 shadow-sm text-center">
              <p className="text-gray-500 mb-4">No listings found</p>
              <button
                onClick={() => navigate('/upload-textile-waste')}
                className="text-cyan-600 hover:text-cyan-700 font-medium"
              >
                Create your first listing
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredListings.map((listing) => (
                <div key={listing._id} className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                  <div className="relative">
                    <img
                      src={listing.imageUrl || '/hero_textile.png'}
                      alt={listing.title}
                      className="w-full h-48 object-cover"
                    />
                    <span className={`absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(listing.status)}`}>
                      {listing.status.charAt(0).toUpperCase() + listing.status.slice(1)}
                    </span>
                  </div>
                  
                  <div className="p-4">
                    <h3 className="font-semibold text-lg mb-2">{listing.title}</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Category:</span>
                        <span className="font-medium">{listing.category}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Condition:</span>
                        <span className="font-medium">{listing.condition}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Quantity:</span>
                        <span className="font-medium">{listing.quantity} KG</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Price:</span>
                        <span className="font-medium text-cyan-600">LKR {listing.price}/KG</span>
                      </div>
                      {listing.healthScore && (
                        <div className="flex justify-between">
                          <span className="text-gray-500">Health Score:</span>
                          <span className={`font-medium ${getHealthScoreColor(listing.healthScore)}`}>
                            {listing.healthScore.toFixed(2)}
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-gray-500">Location:</span>
                        <span className="font-medium text-xs">{listing.location}</span>
                      </div>
                    </div>
                    
                    <div className="mt-4 pt-4 border-t flex gap-2">
                      <button
                        className="flex-1 bg-cyan-500 text-white py-2 rounded-lg hover:bg-cyan-600 transition-colors text-sm"
                        onClick={() => navigate('/sustainability-analysis')}
                      >
                        View Details
                      </button>
                      {listing.status === 'available' && (
                        <button
                          className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm"
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
                className="px-4 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="px-4 py-2 bg-cyan-500 text-white rounded-lg">
                {currentPage}
              </span>
              <button
                onClick={() => setCurrentPage(currentPage + 1)}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50"
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
