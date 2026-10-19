import { useState, useEffect } from 'react';
import { Search, Trash2, PackageSearch, ShieldAlert } from 'lucide-react';
import AdminSidebar from '../components/dashboard/AdminSidebar';
import { getAllListings, updateListingStatus, deleteListing } from '../services/adminApi';
import type { AdminMaterialRecord } from '../services/adminApi';
import type { User } from '../types';

interface ListingManagementProps {
  user: User;
  onLogout: () => void;
}

const statusColor: Record<string, string> = {
  available: 'text-emerald-700 bg-emerald-50',
  pending: 'text-amber-700 bg-amber-50',
  sold: 'text-gray-500 bg-gray-100',
};

const ListingManagement = ({ user, onLogout }: ListingManagementProps) => {
  const [listings, setListings] = useState<AdminMaterialRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [search, setSearch] = useState('');
  const [actionError, setActionError] = useState('');
  const [pendingId, setPendingId] = useState('');

  const fetchListings = async () => {
    try {
      setLoading(true);
      setLoadError('');
      const data = await getAllListings({ search: search || undefined });
      setListings(data);
    } catch (error) {
      console.error('Failed to load listings', error);
      setListings([]);
      setLoadError('Could not load listings right now. Please try again shortly.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchListings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleStatusChange = async (item: AdminMaterialRecord, status: string) => {
    setActionError('');
    setPendingId(item._id);
    try {
      await updateListingStatus(item._id, status);
      await fetchListings();
    } catch (error: any) {
      console.error('Failed to update listing status', error);
      setActionError(error?.response?.data?.message || 'Failed to update listing.');
    } finally {
      setPendingId('');
    }
  };

  const handleDelete = async (item: AdminMaterialRecord) => {
    if (!window.confirm(`Permanently delete "${item.title}"? This cannot be undone.`)) return;
    setActionError('');
    setPendingId(item._id);
    try {
      await deleteListing(item._id);
      await fetchListings();
    } catch (error: any) {
      console.error('Failed to delete listing', error);
      setActionError(error?.response?.data?.message || 'Failed to delete listing.');
    } finally {
      setPendingId('');
    }
  };

  return (
    <div className="flex min-h-screen bg-[#F8FAFC] font-sans">
      <AdminSidebar user={user} onLogout={onLogout} />

      <main className="flex-1 p-6 md:p-8">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="border-b border-gray-200 pb-5">
            <h1 className="text-3xl font-bold text-gray-900">All Listings</h1>
            <p className="text-gray-500 text-sm mt-0.5">System-wide - edit status or remove any listing, regardless of seller.</p>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm flex gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchListings()}
                placeholder="Search listings..."
                className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-rose-400 focus:border-transparent text-sm"
              />
            </div>
            <button onClick={fetchListings} className="bg-rose-500 hover:bg-rose-600 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-all">
              Search
            </button>
          </div>

          {actionError && (
            <div className="bg-red-50 border border-red-100 rounded-xl p-3 text-sm text-red-600 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0" /> {actionError}
            </div>
          )}

          {loading ? (
            <div className="bg-white rounded-2xl p-16 border border-gray-200 shadow-sm text-center">
              <div className="animate-spin w-12 h-12 border-4 border-rose-500 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-gray-500">Loading listings...</p>
            </div>
          ) : loadError ? (
            <div className="bg-red-50 border border-red-100 rounded-2xl p-16 text-center">
              <p className="text-red-600 mb-4">{loadError}</p>
              <button onClick={fetchListings} className="text-rose-600 hover:text-rose-700 font-medium">Try again</button>
            </div>
          ) : listings.length === 0 ? (
            <div className="bg-white rounded-2xl p-16 border border-gray-200 shadow-sm text-center">
              <PackageSearch className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No listings found.</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                  <tr>
                    <th className="text-left px-5 py-3 font-semibold">Listing</th>
                    <th className="text-left px-5 py-3 font-semibold">Seller</th>
                    <th className="text-left px-5 py-3 font-semibold">Price</th>
                    <th className="text-left px-5 py-3 font-semibold">Status</th>
                    <th className="text-right px-5 py-3 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {listings.map((item) => (
                    <tr key={item._id} className="hover:bg-gray-50">
                      <td className="px-5 py-3">
                        <p className="font-medium text-gray-900">{item.title}</p>
                        <p className="text-xs text-gray-400">{item.category} · {item.quantity} kg</p>
                      </td>
                      <td className="px-5 py-3 text-gray-600">{item.sellerName}</td>
                      <td className="px-5 py-3 text-gray-900 font-semibold">LKR {item.price}/kg</td>
                      <td className="px-5 py-3">
                        <select
                          value={item.status}
                          disabled={pendingId === item._id}
                          onChange={(e) => handleStatusChange(item, e.target.value)}
                          className={`text-xs font-semibold px-2 py-1 rounded-full border-0 ${statusColor[item.status] || 'text-gray-600 bg-gray-50'}`}
                        >
                          <option value="available">available</option>
                          <option value="pending">pending</option>
                          <option value="sold">sold</option>
                        </select>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <button
                          onClick={() => handleDelete(item)}
                          disabled={pendingId === item._id}
                          title="Delete listing"
                          className="p-1.5 rounded-lg hover:bg-red-50 disabled:opacity-50"
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default ListingManagement;
