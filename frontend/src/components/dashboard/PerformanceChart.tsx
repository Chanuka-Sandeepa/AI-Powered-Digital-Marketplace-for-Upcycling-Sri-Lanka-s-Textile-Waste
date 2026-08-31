import { useEffect, useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { getSellerPerformance } from '../../services/sellerApi';

interface ChartItem {
  date: string;
  listings: number;
}

const PerformanceChart = () => {
  const [data, setData] = useState<ChartItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPerformance = async () => {
      try {
        const performanceData = await getSellerPerformance(30);
        const dailyData = Array.isArray(performanceData?.dailyData)
          ? performanceData.dailyData
          : [];

        const chartData = dailyData.map((item: any) => ({
          date: new Date(item.date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
          }),
          listings: Number(item.count ?? 0),
        }));

        setData(chartData);
      } catch (error) {
        console.error('Error fetching performance data:', error);
        setData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPerformance();
  }, []);

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-full">
      <div className="mb-4">
        <h2 className="font-semibold text-xl text-gray-900">
          Performance Overview
        </h2>
        <p className="text-gray-500 text-sm mt-1">
          Listings created over the last 30 days
        </p>
      </div>

      {loading ? (
        <div className="h-[300px] bg-gray-100 rounded-xl animate-pulse" />
      ) : data.length === 0 ? (
        <div className="h-[300px] flex items-center justify-center text-gray-500 text-sm">
          No performance data available yet.
        </div>
      ) : (
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="listings" fill="#0ea5e9" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

export default PerformanceChart;
