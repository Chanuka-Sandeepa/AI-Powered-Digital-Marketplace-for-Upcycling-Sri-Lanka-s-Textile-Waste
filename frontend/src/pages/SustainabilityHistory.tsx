import { useState, useEffect } from 'react';
import Sidebar from '../components/dashboard/Sidebar';
import { getSustainabilityMetrics } from '../services/sellerApi';
import type { User } from '../types';

interface SustainabilityHistoryProps {
  user: User;
  onLogout: () => void;
}

interface SustainabilityMetric {
  _id: string;
  period: string;
  wasteDiverted: number; // in KG
  co2Saved: number; // in KG
  waterSaved: number; // in liters
  energySaved: number; // in KWh
  materialsRecycled: number;
  revenueGenerated: number; // in USD
  createdAt: string;
}

const SustainabilityHistory = ({ user, onLogout }: SustainabilityHistoryProps) => {
  const [metrics, setMetrics] = useState<SustainabilityMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'quarter' | 'year'>('month');

  useEffect(() => {
    fetchSustainabilityMetrics();
  }, [timeRange]);

  const fetchSustainabilityMetrics = async () => {
    try {
      setLoading(true);
      setLoadError('');
      const response = await getSustainabilityMetrics(timeRange);
      setMetrics(response.metrics);
    } catch (error) {
      console.error('Failed to fetch sustainability metrics:', error);
      setMetrics([]);
      setLoadError('Could not load sustainability data right now. Please try again shortly.');
    } finally {
      setLoading(false);
    }
  };

  const calculateTotals = () => {
    return metrics.reduce((acc, metric) => ({
      wasteDiverted: acc.wasteDiverted + metric.wasteDiverted,
      co2Saved: acc.co2Saved + metric.co2Saved,
      waterSaved: acc.waterSaved + metric.waterSaved,
      energySaved: acc.energySaved + metric.energySaved,
      materialsRecycled: acc.materialsRecycled + metric.materialsRecycled,
      revenueGenerated: acc.revenueGenerated + metric.revenueGenerated
    }), { wasteDiverted: 0, co2Saved: 0, waterSaved: 0, energySaved: 0, materialsRecycled: 0, revenueGenerated: 0 });
  };

  const totals = calculateTotals();

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toFixed(0);
  };

  const formatPeriod = (period: string) => {
    // Backend buckets periods differently depending on the selected time
    // range: "2024-01" (month), "2024-Q1" (quarter), "2024" (year), or
    // "2024-W03" (week, ISO week number).
    if (/^\d{4}-Q[1-4]$/.test(period)) return period.replace('-', ' ');
    if (/^\d{4}-W\d{2}$/.test(period)) return period.replace('-W', ' - Week ');
    if (/^\d{4}$/.test(period)) return period;
    const date = new Date(period);
    if (Number.isNaN(date.getTime())) return period;
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
  };



  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar user={user} onLogout={onLogout} />

      <main className="flex-1 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Sustainability History</h1>
            <div className="flex gap-2">
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value as any)}
                className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
              >
                <option value="week">Last Week</option>
                <option value="month">Last Month</option>
                <option value="quarter">Last Quarter</option>
                <option value="year">Last Year</option>
              </select>
            </div>
          </div>

          {/* Impact Overview Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 shadow-sm border border-green-200">
              <div className="flex items-center justify-between mb-2">
                <p className="text-green-700 text-sm font-medium">Waste Diverted</p>
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <p className="text-3xl font-bold text-green-800">{formatNumber(totals.wasteDiverted)} KG</p>
              <p className="text-green-600 text-xs mt-1">Total diverted from landfill</p>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 shadow-sm border border-blue-200">
              <div className="flex items-center justify-between mb-2">
                <p className="text-blue-700 text-sm font-medium">CO₂ Saved</p>
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064" />
                </svg>
              </div>
              <p className="text-3xl font-bold text-blue-800">{formatNumber(totals.co2Saved)} KG</p>
              <p className="text-blue-600 text-xs mt-1">Carbon footprint reduced</p>
            </div>

            <div className="bg-gradient-to-br from-cyan-50 to-cyan-100 rounded-xl p-6 shadow-sm border border-cyan-200">
              <div className="flex items-center justify-between mb-2">
                <p className="text-cyan-700 text-sm font-medium">Water Saved</p>
                <svg className="w-6 h-6 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                </svg>
              </div>
              <p className="text-3xl font-bold text-cyan-800">{formatNumber(totals.waterSaved)} L</p>
              <p className="text-cyan-600 text-xs mt-1">Water conservation</p>
            </div>

            <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl p-6 shadow-sm border border-emerald-200">
              <div className="flex items-center justify-between mb-2">
                <p className="text-emerald-700 text-sm font-medium">Energy Saved</p>
                <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <p className="text-3xl font-bold text-emerald-800">{formatNumber(totals.energySaved)} KWh</p>
              <p className="text-emerald-600 text-xs mt-1">Energy conservation</p>
            </div>
          </div>

          {/* Additional Stats */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">Materials Recycled</p>
                  <p className="text-2xl font-bold text-gray-900">{totals.materialsRecycled}</p>
                </div>
                <div className="h-12 w-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">Revenue Generated</p>
                  <p className="text-2xl font-bold text-gray-900">LKR {formatNumber(totals.revenueGenerated)}</p>
                </div>
                <div className="h-12 w-12 bg-yellow-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Environmental Impact Equivalents */}
          <div className="bg-white rounded-xl p-6 shadow-sm mb-6">
            <h2 className="text-lg font-semibold mb-4">Environmental Impact Equivalents</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-3xl font-bold text-green-600">{(totals.co2Saved / 0.2).toFixed(0)}</p>
                <p className="text-gray-500 text-sm">Tree seedlings grown for 10 years</p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-3xl font-bold text-blue-600">{(totals.waterSaved / 150).toFixed(0)}</p>
                <p className="text-gray-500 text-sm">Bathtubs of water saved</p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-3xl font-bold text-cyan-600">{(totals.energySaved / 10).toFixed(0)}</p>
                <p className="text-gray-500 text-sm">Days of household electricity</p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-3xl font-bold text-emerald-600">{(totals.wasteDiverted / 500).toFixed(0)}</p>
                <p className="text-gray-500 text-sm">Washing machines recycled</p>
              </div>
            </div>
          </div>

          {/* Historical Data Table */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="p-4 border-b">
              <h2 className="text-lg font-semibold">Monthly Breakdown</h2>
            </div>
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-gray-500">Loading sustainability data...</p>
              </div>
            ) : loadError ? (
              <div className="bg-red-50 text-center py-12">
                <p className="text-red-600 mb-4">{loadError}</p>
                <button onClick={fetchSustainabilityMetrics} className="text-cyan-600 hover:text-cyan-700 font-medium">
                  Try again
                </button>
              </div>
            ) : metrics.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">
                  No sustainability data yet. Upload and list textile waste to start tracking your impact.
                </p>
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Period
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Waste Diverted
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      CO₂ Saved
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Water Saved
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Energy Saved
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Materials
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Revenue
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {metrics.map((metric) => (
                    <tr key={metric._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {formatPeriod(metric.period)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {metric.wasteDiverted.toLocaleString()} KG
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">
                        {metric.co2Saved.toLocaleString()} KG
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-cyan-600">
                        {metric.waterSaved.toLocaleString()} L
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-emerald-600">
                        {metric.energySaved.toLocaleString()} KWh
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {metric.materialsRecycled}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        LKR {metric.revenueGenerated.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Sustainability Tips */}
          <div className="mt-6 bg-gradient-to-r from-green-50 to-cyan-50 rounded-xl p-6 border border-green-200">
            <h3 className="font-semibold text-green-800 mb-3">💡 Sustainability Tips</h3>
            <ul className="space-y-2 text-sm text-green-700">
              <li>• Continue sorting materials by fabric type for higher recycling efficiency</li>
              <li>• Consider partnering with local recyclers to reduce transportation emissions</li>
              <li>• Track your monthly goals to identify improvement opportunities</li>
              <li>• Share your sustainability achievements with buyers to build trust</li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
};

export default SustainabilityHistory;
