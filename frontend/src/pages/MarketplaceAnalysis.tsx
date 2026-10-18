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
  Search,
  CalendarDays,
} from 'lucide-react';
import Sidebar from '../components/dashboard/Sidebar';
import { getSellerMaterials, analyzeMarketplace, getMarketplaceHistory } from '../services/sellerApi';
import type { MarketplaceAnalysisResult, MarketplacePredictionRecord } from '../services/sellerApi';
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

const MarketplaceAnalysisPage = ({ user, onLogout, focus = 'all' }: MarketplaceAnalysisProps) => {
  const navigate = useNavigate();
  const meta = FOCUS_META[focus];

  const [materials, setMaterials] = useState<ListedMaterial[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [analyzedId, setAnalyzedId] = useState('');
  const [searchText, setSearchText] = useState('');
  const [recentHistory, setRecentHistory] = useState<MarketplacePredictionRecord[]>([]);
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
      setSelectedId((current) => (analyzed.some((m) => m._id === current) ? current : ''));
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

  useEffect(() => {
    if (focus !== 'all') return;
    getMarketplaceHistory(1, 5)
      .then((response) => setRecentHistory(response.predictions))
      .catch((error) => console.error('Failed to load recent marketplace analysis history:', error));
  }, [focus]);

  const runAnalysis = async (materialId: string) => {
    if (!materialId) return;
    setIsAnalyzing(true);
    setAnalysisError('');
    try {
      const res = await analyzeMarketplace({ materialId });
      setResult(res);
      setAnalyzedId(materialId);
      if (focus === 'all') {
        getMarketplaceHistory(1, 5).then((response) => setRecentHistory(response.predictions)).catch(() => undefined);
      }
    } catch (error: any) {
      console.error('Marketplace analysis failed', error);
      setAnalysisError(error?.response?.data?.message || 'Marketplace analysis failed. Please try again.');
      setResult(null);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const selected = materials.find((m) => m._id === selectedId);
  const filteredMaterials = materials.filter((material) =>
    `${material.title} ${material.category}`.toLowerCase().includes(searchText.trim().toLowerCase())
  );
  const manualAnalysis = true;
  const demandSegments = result ? Object.entries(result.demandDistribution).sort((a, b) => b[1] - a[1]) : [];
  const strongestDemandCategory = demandSegments[0]?.[0] || result?.demandLevel || '';
  const trendSegments = result ? Object.entries(result.marketplaceTrendDistribution).sort((a, b) => b[1] - a[1]) : [];
  const strongestTrend = trendSegments[0]?.[0] || result?.marketplaceTrend || '';
  const showResults = Boolean(result && selected && (!manualAnalysis || analyzedId === selectedId));
  const Icon = meta.icon;

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50/40 to-cyan-50/40 font-sans">
      <Sidebar user={user} onLogout={onLogout} />

      <main className="min-w-0 flex-1 p-4 sm:p-6 md:p-8">
        <div className="mx-auto max-w-6xl space-y-6">
          <div className="flex flex-col justify-between gap-4 rounded-3xl bg-gradient-to-r from-emerald-600 via-teal-500 to-cyan-600 p-5 text-white shadow-lg shadow-emerald-200/60 md:flex-row md:items-center sm:p-6">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-white/85">
                <Icon className="h-4 w-4" />
                Marketplace Dashboard
              </div>
              <h1 className="mt-1 text-2xl font-extrabold sm:text-3xl">{meta.title}</h1>
              <p className="mt-1 text-sm text-white/85">
                {focus === 'price' ? 'Select a listing and run AI price analysis to see a suggested value.' : focus === 'buyers' ? 'Select a listing and analyse which buyer group is the best match.' : focus === 'demand' ? 'Select a listing and analyse its strongest demand category.' : 'Select a listing and run the full AI marketplace analysis.'}
              </p>
            </div>
            <button
              onClick={() => manualAnalysis ? void fetchListings() : selectedId && runAnalysis(selectedId)}
              disabled={loading || isAnalyzing || (!manualAnalysis && !selectedId)}
              className="flex items-center gap-2 self-start rounded-xl border border-white/60 bg-white px-4 py-2.5 text-sm font-bold text-emerald-800 shadow-sm transition hover:-translate-y-0.5 hover:bg-emerald-50 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isAnalyzing ? 'animate-spin' : ''}`} />
              Refresh Listings
            </button>
          </div>

          {loading ? (
            <div className="rounded-3xl border border-white bg-white/90 p-16 text-center shadow-md ring-1 ring-slate-100">
              <div className="animate-spin w-12 h-12 border-4 border-sky-500 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-gray-500">Loading your listings...</p>
            </div>
          ) : loadError ? (
            <div className="rounded-3xl border border-rose-100 bg-rose-50 p-16 text-center shadow-sm">
              <p className="text-red-600 mb-4">{loadError}</p>
              <button onClick={fetchListings} className="text-sky-600 hover:text-sky-700 font-medium">
                Try again
              </button>
            </div>
          ) : materials.length === 0 ? (
            <div className="rounded-3xl border border-white bg-white/90 p-16 text-center shadow-md ring-1 ring-slate-100">
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
              {manualAnalysis ? (
              <section className="overflow-hidden rounded-3xl border border-white bg-white/95 shadow-lg shadow-slate-200/50 ring-1 ring-slate-100">
                <div className="border-b border-slate-100 p-5 sm:p-6">
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                    <div><h2 className="flex items-center gap-2 text-lg font-bold text-slate-900"><PackageSearch className="h-5 w-5 text-emerald-600" /> Select a Listing</h2><p className="mt-1 text-sm text-slate-500">{focus === 'price' ? 'Choose a listing, then run a price prediction when you are ready.' : focus === 'buyers' ? 'Choose a listing, then find the best-matched buyer group.' : focus === 'demand' ? 'Choose a listing, then analyse its strongest demand category.' : 'Choose a listing, then run the full marketplace analysis.'}</p></div>
                    <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">{filteredMaterials.length} listings</span>
                  </div>
                  <label className="relative block">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input type="search" value={searchText} onChange={(event) => setSearchText(event.target.value)} placeholder="Search by listing name or fabric..." className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100" />
                  </label>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[620px] text-left text-sm">
                    <thead className="bg-gradient-to-r from-emerald-50 to-cyan-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-5 py-3 font-semibold">Select</th><th className="px-5 py-3 font-semibold">Listing</th><th className="px-5 py-3 font-semibold">Quantity</th><th className="px-5 py-3 font-semibold">Listed price</th><th className="px-5 py-3 font-semibold">Status</th></tr></thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredMaterials.map((material) => {
                        const isSelected = selectedId === material._id;
                        return <tr key={material._id} onClick={() => { setSelectedId(material._id); setAnalyzedId(''); setResult(null); setAnalysisError(''); }} className={`cursor-pointer transition ${isSelected ? 'bg-emerald-50/80' : 'hover:bg-slate-50'}`}>
                          <td className="px-5 py-4"><input type="radio" name="priceListing" checked={isSelected} onChange={() => { setSelectedId(material._id); setAnalyzedId(''); setResult(null); setAnalysisError(''); }} aria-label={`Select ${material.title}`} className="h-4 w-4 accent-emerald-600" /></td>
                          <td className="px-5 py-4"><p className="font-semibold text-slate-900">{material.title}</p><p className="mt-0.5 text-xs text-slate-500">{material.category || 'Textile material'}</p></td>
                          <td className="px-5 py-4 font-medium text-slate-700">{Number(material.quantity).toLocaleString()} kg</td>
                          <td className="px-5 py-4 font-semibold text-emerald-700">LKR {Number(material.price).toLocaleString()}/kg</td>
                          <td className="px-5 py-4"><span className="rounded-full bg-sky-50 px-2.5 py-1 text-xs font-semibold capitalize text-sky-700">{material.status}</span></td>
                        </tr>;
                      })}
                      {filteredMaterials.length === 0 && <tr><td colSpan={5} className="px-5 py-10 text-center text-slate-500">No listings match your search.</td></tr>}
                    </tbody>
                  </table>
                </div>
                <div className="flex flex-col gap-3 border-t border-slate-100 bg-gradient-to-r from-emerald-50/60 to-cyan-50/60 p-5 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-xs text-slate-500">{focus === 'price' ? 'Select a listing above, then run the prediction to view its estimated price.' : focus === 'buyers' ? 'Select a listing above, then analyse it to see the best matched buyer group.' : focus === 'demand' ? 'Select a listing above, then analyse it to see the strongest demand category.' : 'Select a listing above, then run the full marketplace analysis.'}</p>
                  <button type="button" onClick={() => selectedId && runAnalysis(selectedId)} disabled={!selectedId || isAnalyzing} className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 px-6 py-3 text-sm font-bold text-white shadow-md shadow-emerald-200 transition hover:-translate-y-0.5 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50">{focus === 'price' ? <DollarSign className="h-4 w-4" /> : focus === 'buyers' ? <Users className="h-4 w-4" /> : focus === 'demand' ? <BarChart3 className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}{isAnalyzing ? 'Analysing...' : analyzedId === selectedId ? (focus === 'price' ? 'Re-run Price Analysis' : focus === 'buyers' ? 'Re-run Buyer Analysis' : focus === 'demand' ? 'Re-run Demand Analysis' : 'Re-run Full Analysis') : (focus === 'price' ? 'Analyse Price' : focus === 'buyers' ? 'Analyse Buyer Matches' : focus === 'demand' ? 'Analyse Demand' : 'Run Full Analysis')}</button>
                </div>
              </section>
              ) : (
              <div className="rounded-2xl border border-white bg-white/90 p-5 shadow-md ring-1 ring-slate-100">
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
              )}

              {isAnalyzing ? (
                <div className="bg-white rounded-2xl p-16 border border-gray-200 shadow-sm text-center">
                  <div className="animate-spin w-12 h-12 border-4 border-sky-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                  <p className="text-gray-500">Running price / demand / buyer-match models...</p>
                </div>
              ) : analysisError ? (
                <div className="bg-red-50 border border-red-100 rounded-2xl p-8 text-center">
                  <p className="text-red-600">{analysisError}</p>
                </div>
              ) : showResults && result && selected ? (
                <div className="space-y-6">
                  {focus === 'all' && (
                    <section className="rounded-3xl border border-white bg-gradient-to-br from-white via-emerald-50/70 to-cyan-50/70 p-5 shadow-lg shadow-emerald-100/60 ring-1 ring-emerald-100 sm:p-6">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <h2 className="flex items-center gap-3 text-lg font-bold text-slate-900"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700"><TrendingUp className="h-5 w-5" /></span>Strongest Marketplace Trend</h2>
                        <span className={`rounded-full px-4 py-2 text-sm font-bold ${strongestTrend === 'Increasing' ? 'bg-emerald-100 text-emerald-800' : strongestTrend === 'Stable' ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'}`}>{strongestTrend}</span>
                      </div>
                      <p className="mt-2 text-sm text-slate-600">The trend category with the strongest prediction for {selected.title}.</p>
                      <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div className="rounded-2xl border border-emerald-100 bg-white/85 p-4 shadow-sm">
                          <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-800"><CheckCircle2 className="h-4 w-4" /> Listing Success Prediction</h3>
                          <p className={`mt-2 text-2xl font-extrabold ${result.listingWillSell ? 'text-emerald-700' : 'text-amber-700'}`}>{result.listingWillSell ? 'Likely to Sell' : 'May Need Adjustments'}</p>
                          <p className="mt-1 text-sm text-slate-500">{result.listingSuccessProbability.toFixed(0)}% predicted probability</p>
                        </div>
                        <div className="rounded-2xl border border-sky-100 bg-white/85 p-4 shadow-sm">
                          <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-sky-800"><Clock className="h-4 w-4" /> Estimated Time to Sell</h3>
                          <p className="mt-2 text-2xl font-extrabold text-slate-900">~{Math.round(result.estimatedSalesTimeDays)} days</p>
                          <p className="mt-1 text-sm text-slate-500">Based on current market conditions</p>
                        </div>
                      </div>
                    </section>
                  )}

                  {(focus === 'price' || focus === 'all') && (
                    <div className="rounded-3xl border border-white bg-white/95 p-5 shadow-lg shadow-emerald-100/60 ring-1 ring-slate-100 sm:p-6">
                      <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-slate-900">
                        <DollarSign className="w-5 h-5 text-emerald-500" />
                        Predicted Price
                      </h2>
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                        <div className="rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-100 to-teal-50 p-4 shadow-sm">
                          <p className="text-[10px] text-emerald-700 uppercase font-semibold">Predicted Price / kg</p>
                          <p className="font-bold text-emerald-800 text-2xl mt-1">
                            LKR {result.predictedPricePerKg.toLocaleString()}
                          </p>
                        </div>
                        <div className="rounded-2xl border border-sky-100 bg-gradient-to-br from-sky-50 to-white p-4 shadow-sm">
                          <p className="text-[10px] font-semibold uppercase text-sky-700">Your Listed Price / kg</p>
                          <p className="mt-1 text-2xl font-bold text-slate-900">LKR {selected.price}</p>
                        </div>
                        <div className="rounded-2xl border border-violet-100 bg-gradient-to-br from-violet-50 to-white p-4 shadow-sm">
                          <p className="text-[10px] font-semibold uppercase text-violet-700">Estimated Total Value</p>
                          <p className="mt-1 text-2xl font-bold text-slate-900">
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
                    <div className="overflow-hidden rounded-3xl border border-white bg-gradient-to-br from-white via-amber-50/50 to-emerald-50/60 p-5 shadow-lg shadow-amber-100/60 ring-1 ring-amber-100 sm:p-6">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900">
                          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-700"><BarChart3 className="h-5 w-5" /></span>
                          Strongest Demand Category
                        </h2>
                        <span className={`rounded-full px-4 py-2 text-sm font-bold ${strongestDemandCategory === 'High' ? 'bg-emerald-100 text-emerald-800' : strongestDemandCategory === 'Medium' ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'}`}>
                          {strongestDemandCategory} Demand
                        </span>
                      </div>
                      <p className="mt-3 text-sm text-slate-600">This is the demand category with the strongest prediction for the selected listing.</p>
                    </div>
                  )}

                  {(focus === 'buyers' || focus === 'all') && (
                    <div className="rounded-3xl border border-white bg-gradient-to-br from-white via-sky-50/60 to-violet-50/60 p-5 shadow-lg shadow-sky-100/60 ring-1 ring-sky-100 sm:p-6">
                      <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-slate-900">
                        <Users className="w-5 h-5 text-sky-500" />
                        Recommended Buyer Types
                      </h2>
                      <div className="space-y-3">
                        {result.recommendedBuyers.slice(0, 1).map((b) => (
                          <div key={b.buyerType} className="flex items-center gap-3 rounded-xl border border-white bg-white/80 p-3 shadow-sm">
                            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-sky-100 to-violet-100 text-sky-800"><Users className="h-5 w-5" /></span>
                            <div className="min-w-0 flex-1">
                              <p className="text-[10px] font-bold uppercase tracking-wider text-sky-700">Best buyer match</p>
                              <p className="mt-0.5 font-semibold text-slate-900">{b.buyerType}</p>
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
                    <div className="bg-gradient-to-br from-sky-50 to-purple-50 rounded-2xl p-6 border border-sky-100 shadow-sm">
                      <h2 className="text-sm font-semibold text-gray-800 mb-2 flex items-center gap-1.5">
                        <TrendingUp className="w-4 h-4 text-sky-600" />
                        Summary
                      </h2>
                      <p className="text-sm text-gray-700 leading-relaxed">
                        This {selected.category} batch is predicted to sell around{' '}
                        <strong>LKR {result.predictedPricePerKg}/kg</strong> with <strong>{result.demandLevel.toLowerCase()}</strong>{' '}
                        market demand and a <strong>{strongestTrend.toLowerCase()}</strong> market trend. The best
                        buyer match is <strong>{result.recommendedBuyers[0]?.buyerType || 'not available'}</strong>, with an
                        estimated <strong>{result.listingSuccessProbability.toFixed(0)}%</strong> chance of selling in around{' '}
                        <strong>{Math.round(result.estimatedSalesTimeDays)} days</strong>.
                      </p>
                      <p className="text-xs text-gray-400 mt-3">
                        Trend / success / sales-time predictions rely partly on fields this app doesn't collect real data for yet
                        (market competition, seller ratings, economic indicators) - treat these three as indicative, not exact.
                      </p>
                    </div>
                  )}

                  {focus === 'all' && (
                    <section className="overflow-hidden rounded-3xl border border-white bg-white/95 shadow-lg shadow-violet-100/50 ring-1 ring-violet-100">
                      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-violet-100 bg-gradient-to-r from-violet-50 via-white to-cyan-50 p-5 sm:p-6">
                        <div>
                          <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900"><CalendarDays className="h-5 w-5 text-violet-600" />Recent Analysis History</h2>
                          <p className="mt-1 text-sm text-slate-500">Your latest marketplace predictions.</p>
                        </div>
                        <button type="button" onClick={() => navigate('/prediction-history')} className="rounded-xl border border-violet-200 bg-white px-4 py-2 text-xs font-bold text-violet-700 shadow-sm transition hover:bg-violet-50">View full history</button>
                      </div>
                      {recentHistory.length > 0 ? (
                        <div className="divide-y divide-slate-100">
                          {recentHistory.map((entry) => (
                            <div key={entry._id} className="flex flex-col gap-2 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                              <div className="min-w-0">
                                <p className="truncate text-sm font-semibold text-slate-900">{entry.material?.title || `${entry.fabricType} batch`}</p>
                                <p className="mt-0.5 text-xs text-slate-500">{new Date(entry.createdAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })} · {entry.weightKg} kg · {entry.district}</p>
                              </div>
                              <div className="flex flex-wrap items-center gap-2 text-xs">
                                <span className="rounded-full bg-emerald-50 px-2.5 py-1 font-bold text-emerald-800">LKR {entry.predictedPricePerKg.toLocaleString()}/kg</span>
                                <span className="rounded-full bg-amber-50 px-2.5 py-1 font-semibold text-amber-800">{entry.demandLevel} demand</span>
                                <span className="rounded-full bg-sky-50 px-2.5 py-1 font-semibold text-sky-800">{entry.recommendedBuyers[0]?.buyerType || 'Buyer match unavailable'}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="px-5 py-8 text-center text-sm text-slate-500">Your saved predictions will appear here after analysis.</p>
                      )}
                    </section>
                  )}
                </div>
              ) : manualAnalysis ? (
                <div className="rounded-3xl border border-dashed border-emerald-200 bg-white/80 p-10 text-center shadow-sm">
                  {focus === 'price' ? <DollarSign className="mx-auto mb-3 h-10 w-10 text-emerald-500" /> : focus === 'buyers' ? <Users className="mx-auto mb-3 h-10 w-10 text-sky-500" /> : focus === 'demand' ? <BarChart3 className="mx-auto mb-3 h-10 w-10 text-amber-500" /> : <Sparkles className="mx-auto mb-3 h-10 w-10 text-violet-500" />}
                  <h2 className="font-bold text-slate-900">{focus === 'price' ? 'Your price prediction will appear here' : focus === 'buyers' ? 'Your buyer recommendations will appear here' : focus === 'demand' ? 'Your demand category will appear here' : 'Your full analysis will appear here'}</h2>
                  <p className="mt-1 text-sm text-slate-500">Select a listing above and click <span className="font-semibold text-emerald-700">{focus === 'price' ? 'Analyse Price' : focus === 'buyers' ? 'Analyse Buyer Matches' : focus === 'demand' ? 'Analyse Demand' : 'Run Full Analysis'}</span>.</p>
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
