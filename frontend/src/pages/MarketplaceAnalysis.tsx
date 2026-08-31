import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  DollarSign,
  Users,
  BarChart3,
  Sparkles,
  RefreshCw,
  PackageSearch,
  TrendingUp,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import Sidebar from '../components/dashboard/Sidebar';
import { getSellerMaterials, analyzeMarketplace } from '../services/sellerApi';
import type { MarketplaceAnalysisResult } from '../services/sellerApi';
import type { User } from '../types';

interface MarketplaceAnalysisProps {
  user: User;
  onLogout: () => void;
  focus?: 'price' | 'buyers' | 'demand' | 'all';
}

interface ListedMaterial {
  _id: string;
  title: string;
  category: string;
  quantity: number;
  price: number;
  status: string;
  aiAnalysis?: unknown;
}

const FOCUS_META = {
  price: { title: 'Price Prediction', icon: DollarSign, color: 'text-emerald-600' },
  buyers: { title: 'Buyer Recommendation', icon: Users, color: 'text-sky-600' },
  demand: { title: 'Demand Prediction', icon: BarChart3, color: 'text-amber-600' },
  all: { title: 'AI Marketplace Analysis', icon: Sparkles, color: 'text-purple-600' },
};

const demandColor: Record<string, string> = {
  High: 'text-emerald-600 bg-emerald-50 border-emerald-200',
  Medium: 'text-amber-600 bg-amber-50 border-amber-200',
  Low: 'text-red-600 bg-red-50 border-red-200',
};

const trendColor: Record<string, string> = {
  Increasing: 'text-emerald-600 bg-emerald-50 border-emerald-200',
  Stable: 'text-amber-600 bg-amber-50 border-amber-200',
  Decreasing: 'text-red-600 bg-red-50 border-red-200',
};

const MarketplaceAnalysisPage = ({ user, onLogout, focus = 'all' }: MarketplaceAnalysisProps) => {
  const navigate = useNavigate();
  const meta = FOCUS_META[focus];

  const [materials, setMaterials] = useState<ListedMaterial[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const [result, setResult] = useState<MarketplaceAnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState('');

  const fetchListings = async () => {
    try {
      setLoading(true);
      setLoadError('');
      const response = await getSellerMaterials(undefined, 1, 50);
      const analyzed = (response.materials as ListedMaterial[]).filter((m) => m.aiAnalysis);
      setMaterials(analyzed);
      setSelectedId((current) => (analyzed.some((m) => m._id === current) ? current : analyzed[0]?._id || ''));
    } catch (error) {
      console.error('Failed to load listings', error);
      setMaterials([]);
      setLoadError('Could not load your listings right now. Please try again shortly.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchListings();
  }, []);

  const runAnalysis = async (materialId: string) => {
    if (!materialId) return;
    setIsAnalyzing(true);
    setAnalysisError('');
    try {
      const res = await analyzeMarketplace({ materialId });
      setResult(res);
    } catch (error: any) {
      console.error('Marketplace analysis failed', error);
      setAnalysisError(error?.response?.data?.message || 'Marketplace analysis failed. Please try again.');
      setResult(null);
    } finally {
      setIsAnalyzing(false);
    }
  };

  useEffect(() => {
    if (selectedId) runAnalysis(selectedId);
  }, [selectedId]);

  const selected = materials.find((m) => m._id === selectedId);
  const Icon = meta.icon;

  return (
    <div className="flex min-h-screen bg-[#F8FAFC] font-sans">
      <Sidebar user={user} onLogout={onLogout} />

      <main className="flex-1 p-6 md:p-8">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 pb-5">
            <div>
              <div className={`flex items-center gap-2 text-xs font-semibold uppercase tracking-wide ${meta.color}`}>
                <Icon className="w-3.5 h-3.5" />
                Marketplace Dashboard
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mt-1">{meta.title}</h1>
              <p className="text-gray-500 text-sm mt-0.5">
                AI-predicted price, demand, and buyer matches for your AI-analyzed listings.
              </p>
            </div>
            <button
              onClick={() => selectedId && runAnalysis(selectedId)}
              disabled={isAnalyzing || !selectedId}
              className="flex items-center gap-2 border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 px-4 py-2.5 rounded-xl text-sm font-medium transition-all shadow-sm disabled:opacity-50 self-start"
            >
              <RefreshCw className={`w-4 h-4 ${isAnalyzing ? 'animate-spin' : ''}`} />
              Re-run Analysis
            </button>
          </div>

          {loading ? (
            <div className="bg-white rounded-2xl p-16 border border-gray-200 shadow-sm text-center">
              <div className="animate-spin w-12 h-12 border-4 border-sky-500 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-gray-500">Loading your listings...</p>
            </div>
          ) : loadError ? (
            <div className="bg-red-50 border border-red-100 rounded-2xl p-16 text-center">
              <p className="text-red-600 mb-4">{loadError}</p>
              <button onClick={fetchListings} className="text-sky-600 hover:text-sky-700 font-medium">
                Try again
              </button>
            </div>
          ) : materials.length === 0 ? (
            <div className="bg-white rounded-2xl p-16 border border-gray-200 shadow-sm text-center">
              <PackageSearch className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 font-medium mb-2">No AI-analyzed listings yet</p>
              <p className="text-gray-500 text-sm mb-6">
                Upload textile waste and run AI analysis before marketplace predictions can run.
              </p>
              <button
                onClick={() => navigate('/upload-textile-waste')}
                className="bg-sky-500 hover:bg-sky-600 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-all shadow-sm"
              >
                Upload Textile Waste
              </button>
            </div>
          ) : (
            <>
              <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm">
                <label className="block text-sm font-semibold text-gray-800 mb-2">Select Listing</label>
                <select
                  value={selectedId}
                  onChange={(e) => setSelectedId(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-sky-400 focus:border-transparent bg-white text-gray-800 font-medium text-sm"
                >
                  {materials.map((m) => (
                    <option key={m._id} value={m._id}>
                      {m.title} ({m.quantity} kg)
                    </option>
                  ))}
                </select>
              </div>

              {isAnalyzing ? (
                <div className="bg-white rounded-2xl p-16 border border-gray-200 shadow-sm text-center">
                  <div className="animate-spin w-12 h-12 border-4 border-sky-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                  <p className="text-gray-500">Running price / demand / buyer-match models...</p>
                </div>
              ) : analysisError ? (
                <div className="bg-red-50 border border-red-100 rounded-2xl p-8 text-center">
                  <p className="text-red-600">{analysisError}</p>
                </div>
              ) : result && selected ? (
                <div className="space-y-6">
                  {(focus === 'price' || focus === 'all') && (
                    <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
                      <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-4">
                        <DollarSign className="w-5 h-5 text-emerald-500" />
                        Predicted Price
                      </h2>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="p-4 bg-emerald-50 rounded-xl">
                          <p className="text-[10px] text-emerald-700 uppercase font-semibold">Predicted Price / kg</p>
                          <p className="font-bold text-emerald-800 text-2xl mt-1">
                            LKR {result.predictedPricePerKg.toLocaleString()}
                          </p>
                        </div>
                        <div className="p-4 bg-gray-50 rounded-xl">
                          <p className="text-[10px] text-gray-500 uppercase font-semibold">Your Listed Price / kg</p>
                          <p className="font-bold text-gray-900 text-2xl mt-1">LKR {selected.price}</p>
                        </div>
                        <div className="p-4 bg-gray-50 rounded-xl">
                          <p className="text-[10px] text-gray-500 uppercase font-semibold">Estimated Total Value</p>
                          <p className="font-bold text-gray-900 text-2xl mt-1">
                            LKR {(result.predictedPricePerKg * selected.quantity).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <p className="text-xs text-gray-400 mt-4">
                        Predicted by an XGBoost regression model trained on fabric condition, sustainability, and
                        location features - a reference point, not a fixed rule for what to charge.
                      </p>
                    </div>
                  )}

                  {(focus === 'demand' || focus === 'all') && (
                    <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
                      <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                          <BarChart3 className="w-5 h-5 text-amber-500" />
                          Demand Prediction
                        </h2>
                        <span className={`text-sm font-bold px-3 py-1 rounded-full border ${demandColor[result.demandLevel] || 'text-gray-600 bg-gray-50 border-gray-200'}`}>
                          {result.demandLevel} Demand
                        </span>
                      </div>
                      <div className="space-y-3">
                        {Object.entries(result.demandDistribution)
                          .sort((a, b) => b[1] - a[1])
                          .map(([level, pct]) => (
                            <div key={level}>
                              <div className="flex justify-between text-xs mb-1">
                                <span className="font-medium text-gray-600">{level}</span>
                                <span className="text-gray-500">{pct.toFixed(1)}%</span>
                              </div>
                              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${level === 'High' ? 'bg-emerald-400' : level === 'Medium' ? 'bg-amber-400' : 'bg-red-400'}`}
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}

                  {(focus === 'buyers' || focus === 'all') && (
                    <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
                      <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-4">
                        <Users className="w-5 h-5 text-sky-500" />
                        Recommended Buyer Types
                      </h2>
                      <div className="space-y-3">
                        {result.recommendedBuyers.map((b, i) => (
                          <div key={b.buyerType} className="flex items-center gap-3">
                            <span className="w-6 text-xs font-bold text-gray-400">#{i + 1}</span>
                            <div className="flex-1">
                              <div className="flex justify-between text-sm mb-1">
                                <span className="font-medium text-gray-800">{b.buyerType}</span>
                                <span className="text-gray-500 text-xs">{b.matchScore.toFixed(1)}% match</span>
                              </div>
                              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-gradient-to-r from-sky-400 to-purple-400 rounded-full"
                                  style={{ width: `${Math.min(100, b.matchScore)}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      <p className="text-xs text-gray-400 mt-4">
                        Blended prediction from two independently-trained models (RandomForest + XGBoost) for a
                        more robust ranking.
                      </p>
                    </div>
                  )}

                  {focus === 'all' && (
                    <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
                      <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                          <TrendingUp className="w-5 h-5 text-indigo-500" />
                          Marketplace Trend
                        </h2>
                        <span className={`text-sm font-bold px-3 py-1 rounded-full border ${trendColor[result.marketplaceTrend] || 'text-gray-600 bg-gray-50 border-gray-200'}`}>
                          {result.marketplaceTrend} ({result.marketplaceTrendConfidence.toFixed(0)}%)
                        </span>
                      </div>
                      <div className="space-y-3">
                        {Object.entries(result.marketplaceTrendDistribution)
                          .sort((a, b) => b[1] - a[1])
                          .map(([label, pct]) => (
                            <div key={label}>
                              <div className="flex justify-between text-xs mb-1">
                                <span className="font-medium text-gray-600">{label}</span>
                                <span className="text-gray-500">{pct.toFixed(1)}%</span>
                              </div>
                              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${label === 'Increasing' ? 'bg-emerald-400' : label === 'Stable' ? 'bg-amber-400' : 'bg-red-400'}`}
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}

                  {focus === 'all' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
                        <h2 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                          Listing Success Prediction
                        </h2>
                        <p className={`text-2xl font-bold ${result.listingWillSell ? 'text-emerald-600' : 'text-amber-600'}`}>
                          {result.listingWillSell ? 'Likely to Sell' : 'May Need Adjustments'}
                        </p>
                        <p className="text-gray-500 text-xs mt-1">
                          {result.listingSuccessProbability.toFixed(0)}% predicted probability
                        </p>
                      </div>
                      <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
                        <h2 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-1.5">
                          <Clock className="w-4 h-4 text-sky-500" />
                          Estimated Time to Sell
                        </h2>
                        <p className="text-2xl font-bold text-gray-900">
                          ~{Math.round(result.estimatedSalesTimeDays)} days
                        </p>
                        <p className="text-gray-500 text-xs mt-1">based on current market conditions</p>
                      </div>
                    </div>
                  )}

                  {focus === 'all' && (
                    <div className="bg-gradient-to-br from-sky-50 to-purple-50 rounded-2xl p-6 border border-sky-100 shadow-sm">
                      <h2 className="text-sm font-semibold text-gray-800 mb-2 flex items-center gap-1.5">
                        <TrendingUp className="w-4 h-4 text-sky-600" />
                        Summary
                      </h2>
                      <p className="text-sm text-gray-700 leading-relaxed">
                        This {selected.category} batch is predicted to sell around{' '}
                        <strong>LKR {result.predictedPricePerKg}/kg</strong> with <strong>{result.demandLevel.toLowerCase()}</strong>{' '}
                        market demand and a <strong>{result.marketplaceTrend.toLowerCase()}</strong> market trend. The strongest
                        buyer match is <strong>{result.recommendedBuyers[0]?.buyerType}</strong>
                        {result.recommendedBuyers[0] ? ` (${result.recommendedBuyers[0].matchScore.toFixed(0)}% match)` : ''}, with an
                        estimated <strong>{result.listingSuccessProbability.toFixed(0)}%</strong> chance of selling in around{' '}
                        <strong>{Math.round(result.estimatedSalesTimeDays)} days</strong>.
                      </p>
                      <p className="text-xs text-gray-400 mt-3">
                        Trend / success / sales-time predictions rely partly on fields this app doesn't collect real data for yet
                        (market competition, seller ratings, economic indicators) - treat these three as indicative, not exact.
                      </p>
                    </div>
                  )}
                </div>
              ) : null}
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default MarketplaceAnalysisPage;
