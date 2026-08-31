import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Brain,
  Leaf,
  Award,
  TrendingUp,
  Zap,
  Droplet,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  RefreshCw,
  Layers,
  PackageSearch,
} from 'lucide-react';
import Sidebar from '../components/dashboard/Sidebar';
import { getSellerMaterials, regradeMaterial } from '../services/sellerApi';
import type { User } from '../types';

interface SustainabilityAnalysisProps {
  user: User;
  onLogout: () => void;
}

// Only fields the backend actually produces (from the AI classifier/U-Net
// and the XGBoost sustainability pipeline) live here. No buyer directory,
// distances or demand scores are fabricated - those would need a real
// matching/logistics system this app doesn't have yet.
interface AnalyzedMaterial {
  _id: string;
  title: string;
  category: string;
  quantity: number;
  price: number;
  location: string;
  status: string;
  imageUrl?: string;
  aiAnalysis?: {
    fabricType: string;
    confidence: number;
    defectArea: number;
    healthScore: number;
    repairability: string;
    remainingLifespan: number;
  };
  sustainability?: {
    grade: string;
    circularityScore: number;
    recyclabilityScore: number;
    carbonReductionPercent: number;
    waterReductionPercent: number;
    co2SavedKg: number;
    waterSavedLiters: number;
    energySavedKwh: number;
    landfillDivertedKg: number;
    sdgImpactScore: number;
    economicImpactScore: number;
  };
}

const gradeColor: Record<string, string> = {
  'A+': 'text-emerald-600 bg-emerald-50 border-emerald-200',
  A: 'text-green-600 bg-green-50 border-green-200',
  B: 'text-cyan-600 bg-cyan-50 border-cyan-200',
  C: 'text-amber-600 bg-amber-50 border-amber-200',
  D: 'text-red-600 bg-red-50 border-red-200',
};

const recommendedAction = (m: AnalyzedMaterial): string => {
  const grade = m.sustainability?.grade;
  const health = m.aiAnalysis?.healthScore ?? 0;
  if (grade === 'A+' || grade === 'A' || health >= 90) {
    return 'This batch qualifies as premium circular material - keep it listed as-is to attract top-tier buyers.';
  }
  if (health >= 70) {
    return 'Solid condition. Consider highlighting repairability in your listing description to improve buyer confidence.';
  }
  return 'Lower health score - sorting, minor repairs, or bundling with higher-grade material may improve marketability.';
};

const SustainabilityAnalysis = ({ user, onLogout }: SustainabilityAnalysisProps) => {
  const navigate = useNavigate();
  const [materials, setMaterials] = useState<AnalyzedMaterial[]>([]);
  const [selectedId, setSelectedId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const [showFabricIntel, setShowFabricIntel] = useState(true);
  const [showEcoImpact, setShowEcoImpact] = useState(true);
  const [isRegrading, setIsRegrading] = useState(false);
  const [regradeError, setRegradeError] = useState('');

  const fetchListings = async () => {
    try {
      setLoading(true);
      setLoadError('');
      const response = await getSellerMaterials(undefined, 1, 50);
      const analyzed = (response.materials as AnalyzedMaterial[]).filter((m) => m.aiAnalysis);
      setMaterials(analyzed);
      setSelectedId((current) =>
        analyzed.some((m) => m._id === current) ? current : (analyzed[0]?._id || '')
      );
    } catch (error) {
      console.error('Failed to load materials for sustainability analysis', error);
      setMaterials([]);
      setLoadError('Could not load your listings right now. Please try again shortly.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchListings();
  }, []);

  const selected = materials.find((m) => m._id === selectedId) || materials[0];

  const handleRegrade = async () => {
    if (!selected) return;
    setIsRegrading(true);
    setRegradeError('');
    try {
      await regradeMaterial(selected._id);
      await fetchListings();
    } catch (error: any) {
      console.error('Re-grading failed', error);
      setRegradeError(error?.response?.data?.message || 'Re-grading failed. Please try again shortly.');
    } finally {
      setIsRegrading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#F8FAFC] font-sans">
      <Sidebar user={user} onLogout={onLogout} />

      <main className="flex-1 p-6 md:p-8">
        <div className="max-w-7xl mx-auto space-y-6">

          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 pb-5">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-sky-500 uppercase tracking-wide">
                <Sparkles className="w-3.5 h-3.5" />
                AI Sustainability Analysis
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mt-1">Sustainability Analysis</h1>
              <p className="text-gray-500 text-sm mt-0.5">
                Real fabric intelligence and environmental impact for each of your AI-analyzed listings.
              </p>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                onClick={fetchListings}
                className="flex items-center gap-2 border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 px-4 py-2.5 rounded-xl text-sm font-medium transition-all shadow-sm"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
              <button
                onClick={() => navigate('/my-listings')}
                className="flex items-center gap-2 bg-sky-500 hover:bg-sky-600 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-all shadow-sm"
              >
                <ArrowRight className="w-4 h-4" />
                Manage Listings
              </button>
            </div>
          </div>

          {loading ? (
            <div className="bg-white rounded-2xl p-16 border border-gray-200 shadow-sm text-center">
              <div className="animate-spin w-12 h-12 border-4 border-sky-500 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-gray-500">Loading your analyzed listings...</p>
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
                Upload textile waste and run AI analysis to see fabric intelligence and sustainability impact here.
              </p>
              <button
                onClick={() => navigate('/upload-textile-waste')}
                className="bg-sky-500 hover:bg-sky-600 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-all shadow-sm"
              >
                Upload Textile Waste
              </button>
            </div>
          ) : selected ? (
            <>
              {/* Batch Selector + Model info */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm flex flex-col justify-between">
                  <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-2 flex items-center gap-1.5">
                      <Layers className="w-4 h-4 text-sky-500" />
                      Select Listing
                    </label>
                    <select
                      value={selectedId}
                      onChange={(e) => setSelectedId(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-sky-400 focus:border-transparent bg-white text-gray-800 font-medium text-sm transition-all"
                    >
                      {materials.map((m) => (
                        <option key={m._id} value={m._id}>
                          {m.title} ({m.quantity} KG)
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-500 mt-2">
                      Choose a listing to view its AI fabric intelligence and sustainability impact.
                    </p>
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-100 flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-sky-50 flex items-center justify-center text-sky-600 font-bold text-sm">
                      {selected.category.charAt(0)}
                    </div>
                    <div className="text-sm">
                      <div className="font-semibold text-gray-800">{selected.title}</div>
                      <div className="text-gray-500 text-xs">{selected.location}</div>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm lg:col-span-2">
                  <h2 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-1.5">
                    <Brain className="w-4 h-4 text-sky-500" />
                    AI Models Powering This Analysis
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div
                      onClick={() => setShowFabricIntel((v) => !v)}
                      className={`p-4 border rounded-xl cursor-pointer transition-all ${
                        showFabricIntel ? 'border-sky-500 bg-sky-50/50' : 'border-gray-200 bg-white hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-sky-600 uppercase">Fabric Intelligence</span>
                        <input type="checkbox" checked={showFabricIntel} onChange={() => {}} className="rounded text-sky-500 w-4 h-4" />
                      </div>
                      <h3 className="font-bold text-gray-900 mt-1 text-sm">EfficientNet-B3 + U-Net</h3>
                      <p className="text-gray-500 text-[11px] mt-1">
                        Fabric type classification and pixel-level defect segmentation from your uploaded photos.
                      </p>
                    </div>

                    <div
                      onClick={() => setShowEcoImpact((v) => !v)}
                      className={`p-4 border rounded-xl cursor-pointer transition-all ${
                        showEcoImpact ? 'border-emerald-500 bg-emerald-50/50' : 'border-gray-200 bg-white hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-emerald-600 uppercase">EcoImpact Grading</span>
                        <input type="checkbox" checked={showEcoImpact} onChange={() => {}} className="rounded text-emerald-500 w-4 h-4" />
                      </div>
                      <h3 className="font-bold text-gray-900 mt-1 text-sm">XGBoost Sustainability Model</h3>
                      <p className="text-gray-500 text-[11px] mt-1">
                        Predicts circularity, recyclability and environmental savings from material + location data.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Fabric Intelligence */}
              {showFabricIntel && selected.aiAnalysis && (
                <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
                  <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-4">
                    <ShieldCheck className="w-5 h-5 text-sky-500" />
                    Fabric Intelligence
                  </h2>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-4 bg-gray-50 rounded-xl">
                      <p className="text-[10px] text-gray-400 uppercase font-semibold">Fabric Type</p>
                      <p className="font-bold text-gray-900 mt-1">{selected.aiAnalysis.fabricType}</p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-xl">
                      <p className="text-[10px] text-gray-400 uppercase font-semibold">Confidence</p>
                      <p className="font-bold text-gray-900 mt-1">{selected.aiAnalysis.confidence.toFixed(1)}%</p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-xl">
                      <p className="text-[10px] text-gray-400 uppercase font-semibold">Defect Area</p>
                      <p className="font-bold text-gray-900 mt-1">{selected.aiAnalysis.defectArea.toFixed(1)}%</p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-xl">
                      <p className="text-[10px] text-gray-400 uppercase font-semibold">Health Score</p>
                      <p className="font-bold text-gray-900 mt-1">{selected.aiAnalysis.healthScore.toFixed(1)}</p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-xl">
                      <p className="text-[10px] text-gray-400 uppercase font-semibold">Repairability</p>
                      <p className="font-bold text-gray-900 mt-1">{selected.aiAnalysis.repairability}</p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-xl">
                      <p className="text-[10px] text-gray-400 uppercase font-semibold">Remaining Lifespan</p>
                      <p className="font-bold text-gray-900 mt-1">{selected.aiAnalysis.remainingLifespan.toFixed(1)} months</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Sustainability Intelligence */}
              {showEcoImpact && (
                <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                      <Leaf className="w-5 h-5 text-emerald-500" />
                      Sustainability Intelligence
                    </h2>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleRegrade}
                        disabled={isRegrading}
                        className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-sky-600 border border-gray-200 hover:border-sky-300 rounded-full px-3 py-1.5 transition-colors disabled:opacity-50"
                        title="Re-run sustainability grading against the current model"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isRegrading ? 'animate-spin' : ''}`} />
                        {isRegrading ? 'Re-checking...' : 'Re-check Grade'}
                      </button>
                      {selected.sustainability?.grade && (
                        <span className={`text-sm font-bold px-3 py-1 rounded-full border ${gradeColor[selected.sustainability.grade] || 'text-gray-600 bg-gray-50 border-gray-200'}`}>
                          Grade {selected.sustainability.grade}
                        </span>
                      )}
                    </div>
                  </div>

                  {regradeError && (
                    <p className="text-xs text-red-600 mb-4 -mt-2">{regradeError}</p>
                  )}

                  {selected.sustainability ? (
                    <>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="p-4 bg-emerald-50 rounded-xl">
                          <Droplet className="w-4 h-4 text-emerald-600 mb-1" />
                          <p className="text-[10px] text-emerald-700 uppercase font-semibold">CO₂ Saved</p>
                          <p className="font-bold text-emerald-800 mt-1">{selected.sustainability.co2SavedKg.toFixed(1)} kg</p>
                        </div>
                        <div className="p-4 bg-cyan-50 rounded-xl">
                          <Droplet className="w-4 h-4 text-cyan-600 mb-1" />
                          <p className="text-[10px] text-cyan-700 uppercase font-semibold">Water Saved</p>
                          <p className="font-bold text-cyan-800 mt-1">{selected.sustainability.waterSavedLiters.toFixed(0)} L</p>
                        </div>
                        <div className="p-4 bg-amber-50 rounded-xl">
                          <Zap className="w-4 h-4 text-amber-600 mb-1" />
                          <p className="text-[10px] text-amber-700 uppercase font-semibold">Energy Saved</p>
                          <p className="font-bold text-amber-800 mt-1">{selected.sustainability.energySavedKwh.toFixed(1)} kWh</p>
                        </div>
                        <div className="p-4 bg-purple-50 rounded-xl">
                          <Award className="w-4 h-4 text-purple-600 mb-1" />
                          <p className="text-[10px] text-purple-700 uppercase font-semibold">Landfill Diverted</p>
                          <p className="font-bold text-purple-800 mt-1">{selected.sustainability.landfillDivertedKg.toFixed(0)} kg</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                        <ScoreBar label="Circularity" value={selected.sustainability.circularityScore} />
                        <ScoreBar label="Recyclability" value={selected.sustainability.recyclabilityScore} />
                        <ScoreBar label="SDG Impact" value={selected.sustainability.sdgImpactScore} />
                        <ScoreBar label="Economic Impact" value={selected.sustainability.economicImpactScore} />
                      </div>
                    </>
                  ) : (
                    <p className="text-sm text-gray-500">
                      Sustainability grading wasn't available for this listing (the ML service may have been
                      offline when it was created). Re-run analysis from the upload flow to generate a grade.
                    </p>
                  )}
                </div>
              )}

              {/* Listing snapshot + recommendation */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm lg:col-span-1">
                  <h2 className="text-sm font-semibold text-gray-800 mb-4">Listing Snapshot</h2>
                  <dl className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-gray-500">Quantity</dt>
                      <dd className="font-semibold text-gray-900">{selected.quantity.toLocaleString()} kg</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-500">Price</dt>
                      <dd className="font-semibold text-gray-900">LKR {selected.price}/kg</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-500">Estimated Value</dt>
                      <dd className="font-semibold text-gray-900">
                        LKR {(selected.quantity * selected.price).toLocaleString()}
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-500">Status</dt>
                      <dd className="font-semibold text-gray-900 capitalize">{selected.status}</dd>
                    </div>
                  </dl>
                </div>

                <div className="bg-gradient-to-br from-sky-50 to-emerald-50 rounded-2xl p-6 border border-sky-100 shadow-sm lg:col-span-2">
                  <h2 className="text-sm font-semibold text-gray-800 mb-2 flex items-center gap-1.5">
                    <TrendingUp className="w-4 h-4 text-sky-600" />
                    Recommended Next Step
                  </h2>
                  <p className="text-sm text-gray-700 leading-relaxed">{recommendedAction(selected)}</p>
                </div>
              </div>
            </>
          ) : null}
        </div>
      </main>
    </div>
  );
};

const ScoreBar = ({ label, value }: { label: string; value: number }) => (
  <div>
    <div className="flex justify-between text-[11px] mb-1">
      <span className="text-gray-500 font-medium">{label}</span>
      <span className="text-gray-900 font-semibold">{value.toFixed(0)}</span>
    </div>
    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
      <div
        className="h-full bg-gradient-to-r from-sky-400 to-emerald-400 rounded-full"
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  </div>
);

export default SustainabilityAnalysis;
