import { useEffect, useState } from 'react';
import { getSellerActivity } from '../../services/sellerApi';

interface Activity {
  type?: string;
  title?: string;
  quantity?: number;
  price?: number;
  date?: string | Date;
}

const ActivityPanel = () => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchActivity = async () => {
      try {
        const data = await getSellerActivity(5);
        setActivities(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Error fetching activity:', error);
        setActivities([]);
      } finally {
        setLoading(false);
      }
    };

    fetchActivity();
  }, []);

  const formatDate = (date?: string | Date) => {
    if (!date) return 'Date unavailable';

    const parsedDate = new Date(date);
    if (Number.isNaN(parsedDate.getTime())) return 'Date unavailable';

    return parsedDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatPrice = (price?: number) => {
    const numericPrice = Number(price ?? 0);
    return Number.isFinite(numericPrice) ? numericPrice.toLocaleString() : '0';
  };

  const getActivityIcon = (type?: string) => {
    switch (type) {
      case 'sale':
        return '💰';
      case 'listing':
        return '📦';
      default:
        return '📋';
    }
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-full">
      <h2 className="font-semibold text-xl text-gray-900 mb-5">
        Recent Activity
      </h2>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : activities.length === 0 ? (
        <p className="text-gray-500 text-center py-8">
          No recent activity
        </p>
      ) : (
        <div className="space-y-5">
          {activities.map((activity, index) => (
            <div key={`${activity.type ?? 'activity'}-${index}`}>
              <div className="flex items-center gap-2">
                <span className="text-xl">
                  {getActivityIcon(activity.type)}
                </span>
                <p className="font-medium text-gray-900">
                  {activity.type === 'sale' ? 'Material Sold' : 'New Listing'}
                </p>
              </div>

              <p className="text-gray-500 text-sm ml-8 mt-1">
                {activity.title || 'Textile material'}{' '}
                {activity.quantity != null
                  ? `- ${activity.quantity} kg`
                  : ''}
                {activity.price != null
                  ? ` @ LKR ${formatPrice(activity.price)}`
                  : ''}
              </p>

              <p className="text-gray-400 text-xs ml-8 mt-1">
                {formatDate(activity.date)}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ActivityPanel;
