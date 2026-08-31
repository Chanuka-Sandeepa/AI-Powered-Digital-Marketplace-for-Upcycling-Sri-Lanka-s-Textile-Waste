import { useState, useEffect } from 'react';
import { Clock, DollarSign, BarChart3, Users, TrendingUp } from 'lucide-react';
import Sidebar from '../components/dashboard/Sidebar';
import { getMarketplaceHistory } from '../services/sellerApi';
import type { MarketplacePredictionRecord } from '../services/sellerApi';
import type { User } from '../types';

interface PredictionHistoryProps {
  user: User;
  onLogout: () => void;
}

const demandColor: Record<string, string> = {
  High: 'text-emerald-600 bg-emerald-50',
  Medium: 'text-amber-600 bg-amber-50',
  Low: 'text-red-600 bg-red-50',
};

const trendColor: Record<string, string> = {
  Increasing: 'text-emerald-600 bg-emerald-50',
  Stable: 'text-amber-600 bg-amber-50',
  Decreasing: 'text-red-600 bg-red-50',
};

const PredictionHistory = ({ user, onLogout }: PredictionHistoryProps) => {
  const [predictions, setPredictions] = useState<MarketplacePredictionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);

  const fetchHistory = async (p: number) => {
    try {
      setLoading(true);
      setLoadError('');
      const response = await getMarketplaceHistory(p, 20);
      setPredictions(response.predictions);
      setPage(response.page);
      setPages(response.pages);
    } catch (error) {
      console.error('Failed to load prediction history', error);
      setPredictions([]);
      setLoadError('Could not load prediction history right now. Please try again shortly.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory(1);
  }, []);

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

  return (
    <div className="flex min-h-screen bg-[#F8FAFC] font-sans">
      <Sidebar user={user} onLogout={onLogout} />

      <main className="flex-1 p-6 md:p-8">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="border-b border-gray-200 pb-5">
            <div className="flex items-center gap-2 text-xs font-semibold text-purple-600 uppercase tracking-wide">
              <Clock className="w-3.5 h-3.5" />
              Marketplace Dashboard
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mt-1">Prediction History</h1>
            <p className="text-gray-500 text-sm mt-0.5">
              Every price / demand / buyer-recommendation analysis you've run, most recent first.
            </p>
          </div>

          {loading ? (
            <div className="bg-white rounded-2xl p-16 border border-gray-200 shadow-sm text-center">
              <div className="animate-spin w-12 h-12 border-4 border-sky-500 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-gray-500">Loading prediction history...</p>
            </div>
          ) : loadError ? (
            <div className="bg-red-50 border border-red-100 rounded-2xl p-16 text-center">
              <p className="text-red-600 mb-4">{loadError}</p>
              <button onClick={() => fetchHistory(1)} className="text-sky-600 hover:text-sky-700 font-medium">
                Try again
              </button>
            </div>
          ) : predictions.length === 0 ? (
            <div className="bg-white rounded-2xl p-16 border border-gray-200 shadow-sm text-center">
              <Clock className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 font-medium">No predictions yet</p>
              <p className="text-gray-500 text-sm mt-1">
                Run an analysis from AI Marketplace Analysis, Price Prediction, Buyer Recommendation, or Demand
                Prediction to see it show up here.
              </p>
            </div>
          ) : (
            <>
              <div className="space-y-3">
                {predictions.map((p) => (
                  <div key={p._id} className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold text-gray-900">
                          {p.material?.title || `${p.fabricType} batch`}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">{formatDate(p.createdAt)} · {p.weightKg} kg · {p.district}</p>
                      </div>
                      <div className="flex items-center gap-4 flex-wrap">
                        <div className="flex items-center gap-1.5 text-sm">
                          <DollarSign className="w-4 h-4 text-emerald-500" />
                          <span className="font-semibold text-gray-800">LKR {p.predictedPricePerKg}/kg</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-sm">
                          <BarChart3 className="w-4 h-4 text-amber-500" />
                          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${demandColor[p.demandLevel] || 'text-gray-600 bg-gray-50'}`}>
                            {p.demandLevel} Demand
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-sm">
                          <Users className="w-4 h-4 text-sky-500" />
                          <span className="text-gray-700">{p.recommendedBuyers[0]?.buyerType || '—'}</span>
                        </div>
                        {p.marketplaceTrend && (
                          <div className="flex items-center gap-1.5 text-sm">
                            <TrendingUp className="w-4 h-4 text-indigo-500" />
                            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${trendColor[p.marketplaceTrend] || 'text-gray-600 bg-gray-50'}`}>
                              {p.marketplaceTrend}
                            </span>
                          </div>
                        )}
                        {p.estimatedSalesTimeDays != null && (
                          <div className="flex items-center gap-1.5 text-sm">
                            <Clock className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-700">~{Math.round(p.estimatedSalesTimeDays)} days</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {pages > 1 && (
                <div className="flex items-center justify-center gap-3 pt-2">
                  <button
                    onClick={() => fetchHistory(page - 1)}
                    disabled={page <= 1}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <span className="text-sm text-gray-500">Page {page} of {pages}</span>
                  <button
                    onClick={() => fetchHistory(page + 1)}
                    disabled={page >= pages}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default PredictionHistory;
