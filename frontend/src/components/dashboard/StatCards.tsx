import { useEffect, useState } from 'react';
import {
  Package,
  ShoppingBag,
  Wallet,
  Scale,
} from 'lucide-react';
import { getSellerStats } from '../../services/sellerApi';

interface SellerStats {
  totalListings: number;
  soldListings: number;
  revenue: number;
  totalQuantity: number;
}

const StatCards = () => {
  const [stats, setStats] = useState<SellerStats>({
    totalListings: 0,
    soldListings: 0,
    revenue: 0,
    totalQuantity: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await getSellerStats();

        setStats({
          totalListings: Number(data?.totalListings ?? 0),
          soldListings: Number(data?.soldListings ?? 0),
          revenue: Number(data?.revenue ?? 0),
          totalQuantity: Number(data?.totalQuantity ?? 0),
        });
      } catch (error) {
        console.error('Error fetching seller stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const statItems = [
    {
      title: 'Total Listings',
      value: stats.totalListings.toLocaleString(),
      icon: <Package size={22} />,
      iconClass: 'bg-sky-50 text-sky-600',
    },
    {
      title: 'Sold Materials',
      value: stats.soldListings.toLocaleString(),
      icon: <ShoppingBag size={22} />,
      iconClass: 'bg-green-50 text-green-600',
    },
    {
      title: 'Revenue',
      value: `LKR ${stats.revenue.toLocaleString()}`,
      icon: <Wallet size={22} />,
      iconClass: 'bg-amber-50 text-amber-600',
    },
    {
      title: 'Total Quantity',
      value: `${stats.totalQuantity.toLocaleString()} kg`,
      icon: <Scale size={22} />,
      iconClass: 'bg-purple-50 text-purple-600',
    },
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 animate-pulse"
          >
            <div className="h-10 w-10 bg-gray-200 rounded-xl mb-4" />
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-3" />
            <div className="h-8 bg-gray-200 rounded w-3/4" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-6">
      {statItems.map((item) => (
        <div
          key={item.title}
          className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100"
        >
          <div className="flex items-start justify-between">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${item.iconClass}`}>
              {item.icon}
            </div>
          </div>

          <p className="text-gray-500 text-sm mt-4">{item.title}</p>
          <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 mt-1 break-words">
            {item.value}
          </h2>
        </div>
      ))}
    </div>
  );
};

export default StatCards;
