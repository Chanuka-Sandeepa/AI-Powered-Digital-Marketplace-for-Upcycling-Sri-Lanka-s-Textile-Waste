import { useEffect, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getSellerStats } from '../../services/sellerApi';

const RecentListings = () => {
  const navigate = useNavigate();
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchListings = async () => {
      try {
        const data = await getSellerStats();
        setListings(Array.isArray(data?.recentListings) ? data.recentListings : []);
      } catch (error) {
        console.error('Error fetching recent listings:', error);
        setListings([]);
      } finally {
        setLoading(false);
      }
    };

    fetchListings();
  }, []);

  const getStatusColor = (status: string) => {
    switch (String(status).toLowerCase()) {
      case 'available':
        return 'text-green-700 bg-green-50';
      case 'sold':
        return 'text-blue-700 bg-blue-50';
      case 'pending':
        return 'text-yellow-700 bg-yellow-50';
      default:
        return 'text-gray-700 bg-gray-50';
    }
  };

  const formatPrice = (price: unknown) => {
    const numericPrice = Number(price ?? 0);
    return Number.isFinite(numericPrice)
      ? numericPrice.toLocaleString()
      : '0';
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-full">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="font-semibold text-xl text-gray-900">Recent Listings</h2>
          <p className="text-gray-500 text-sm mt-1">
            Your latest textile marketplace activity
          </p>
        </div>

        <button
          type="button"
          onClick={() => navigate('/my-listings')}
          className="text-sky-600 hover:text-sky-700 text-sm font-medium flex items-center gap-1"
        >
          View all
          <ArrowRight size={15} />
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-14 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : listings.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-gray-500">No listings yet.</p>
          <button
            type="button"
            onClick={() => navigate('/upload-textile-waste')}
            className="mt-3 text-sky-600 hover:text-sky-700 font-medium text-sm"
          >
            Create your first listing
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[620px]">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-gray-400">
                <th className="pb-3 font-medium">Material</th>
                <th className="pb-3 font-medium">Condition</th>
                <th className="pb-3 font-medium">Price</th>
                <th className="pb-3 font-medium">Status</th>
              </tr>
            </thead>

            <tbody>
              {listings.slice(0, 5).map((item, index) => (
                <tr key={item?._id ?? `listing-${index}`} className="border-t border-gray-100">
                  <td className="py-4 font-medium text-gray-900">
                    {item?.title || item?.category || 'Textile Material'}
                  </td>

                  <td className="py-4 text-gray-600">
                    {item?.condition || '—'}
                  </td>

                  <td className="py-4 text-gray-700">
                    LKR {formatPrice(item?.price)}
                  </td>

                  <td className="py-4">
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(
                        item?.status
                      )}`}
                    >
                      {item?.status || 'unknown'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default RecentListings;
