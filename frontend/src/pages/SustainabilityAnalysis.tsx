import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Award,
  CalendarDays,
  Droplet,
  Leaf,
  PackageSearch,
  RefreshCw,
  Search,
  Sparkles,
  TrendingUp,
  Zap,
  ArrowRight,
} from 'lucide-react';

import Sidebar from '../components/dashboard/Sidebar';
import { getSellerMaterials, regradeMaterial } from '../services/sellerApi';
import type { User } from '../types';

interface SustainabilityAnalysisProps {
  user: User;
  onLogout: () => void;
}

interface AnalyzedMaterial {
  _id: string;
  title: string;
  category: string;
  quantity: number;
  price: number;
  location: string;
  status: string;
  imageUrl?: string;
  createdAt?: string;
  updatedAt?: string;
  listedAt?: string;
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

type TimeFilter = 'all' | 'today' | '7days' | '30days';

const gradeColor: Record<string, string> = {
  'A+': 'text-emerald-700 bg-emerald-50 border-emerald-200',
  A: 'text-green-700 bg-green-50 border-green-200',
  B: 'text-cyan-700 bg-cyan-50 border-cyan-200',
  C: 'text-amber-700 bg-amber-50 border-amber-200',
  D: 'text-red-700 bg-red-50 border-red-200',
};

const safeNumber = (value: number | undefined | null): number =>
  typeof value === 'number' && Number.isFinite(value) ? value : 0;

const getMaterialDate = (material: AnalyzedMaterial): Date | null => {
  const rawDate = material.createdAt || material.listedAt || material.updatedAt;
  if (!rawDate) return null;
  const date = new Date(rawDate);
  return Number.isNaN(date.getTime()) ? null : date;
};

const formatDate = (material: AnalyzedMaterial): string => {
  const date = getMaterialDate(material);
  return date
    ? date.toLocaleString(undefined, {
        year: 'numeric',
        month: 'short',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'Date unavailable';
};

/** Display grade from the four sustainability indicators; stored backend grade is unchanged. */
const getDisplayGrade = (material: AnalyzedMaterial): string | undefined => {
  const sustainability = material.sustainability;
  if (!sustainability) return undefined;

  const scores = [
    sustainability.circularityScore,
    sustainability.recyclabilityScore,
    sustainability.sdgImpactScore,
    sustainability.economicImpactScore,
  ];

  if (!scores.every((score) => Number.isFinite(score) && score >= 0 && score <= 100)) {
    return undefined;
  }

  const average = scores.reduce((sum, score) => sum + score, 0) / scores.length;
  if (average >= 80) return 'A+';
  if (average >= 70) return 'A';
  if (average >= 60) return 'B';
  if (average >= 50) return 'C';
  return 'D';
};

const recommendedAction = (material: AnalyzedMaterial): string => {
  const grade = getDisplayGrade(material);
  const health = safeNumber(material.aiAnalysis?.healthScore);

  if (grade === 'A+' && health >= 70) {
    return 'Best for Reuse: This textile batch has a strong sustainability score and a suitable health score. It may be appropriate for direct reuse or resale after a physical inspection. Highlight its condition, repairability and remaining lifespan in the listing.';
  }

  if (grade === 'A+' || grade === 'A' || health >= 70) {
    return 'Suitable for Reuse after Review: This textile batch shows promising reuse potential. Inspect its physical condition and consider cleaning or minor repairs where necessary before reuse.';
  }

  return 'Reuse Preparation Recommended: This textile batch may need sorting, cleaning or minor repairs before reuse. Inspect the actual material before deciding on reuse or recycling.';
};

const SustainabilityAnalysis = ({ user, onLogout }: SustainabilityAnalysisProps) => {
  const navigate = useNavigate();

  const [materials, setMaterials] = useState<AnalyzedMaterial[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [analyzedId, setAnalyzedId] = useState('');
  const [searchText, setSearchText] = useState('');
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all');

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState('');
  const [regradeError, setRegradeError] = useState('');

  const fetchListings = async () => {
    try {
      setLoading(true);
      setLoadError('');

      const response = await getSellerMaterials(undefined, 1, 50);
      const list = (response.materials || []) as AnalyzedMaterial[];

      // Keep the listings available for selection; do not automatically open results.
      setMaterials(list);
      setSelectedId((current) =>
        list.some((material) => material._id === current) ? current : ''
      );
      setAnalyzedId((current) =>
        list.some((material) => material._id === current) ? current : ''
      );
    } catch (error) {
      console.error('Failed to load listings for sustainability analysis', error);
      setMaterials([]);
      setLoadError('Could not load your listings right now. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchListings();
  }, []);

  const filteredMaterials = useMemo(() => {
    const query = searchText.trim().toLowerCase();
    const now = new Date();

    return materials
      .filter((material) => {
        const matchesName =
          !query ||
          material.title?.toLowerCase().includes(query) ||
          material.category?.toLowerCase().includes(query) ||
          material.location?.toLowerCase().includes(query);

        if (!matchesName) return false;
        if (timeFilter === 'all') return true;

        const date = getMaterialDate(material);
        if (!date) return false;

        if (timeFilter === 'today') {
          return date.toDateString() === now.toDateString();
        }

        const days = timeFilter === '7days' ? 7 : 30;
        const cutoff = new Date(now);
        cutoff.setDate(now.getDate() - days);
        return date >= cutoff && date <= now;
      })
      .sort((a, b) => {
        const dateA = getMaterialDate(a)?.getTime() ?? 0;
        const dateB = getMaterialDate(b)?.getTime() ?? 0;
        return dateB - dateA;
      });
  }, [materials, searchText, timeFilter]);

  const selectedMaterial = materials.find((material) => material._id === selectedId);
  const analyzedMaterial = materials.find((material) => material._id === analyzedId);

  const handleAnalyze = async () => {
    if (!selectedMaterial) {
      setAnalysisError('Please select a listing from the table first.');
      return;
    }

    setIsAnalyzing(true);
    setAnalysisError('');
    setRegradeError('');

    try {
      // Re-run the existing sustainability endpoint for the selected material.
      // The results panel remains hidden until this action finishes.
      await regradeMaterial(selectedMaterial._id);
      const response = await getSellerMaterials(undefined, 1, 50);
      const refreshed = (response.materials || []) as AnalyzedMaterial[];
      setMaterials(refreshed);
      setAnalyzedId(selectedMaterial._id);
    } catch (error: any) {
      console.error('Sustainability analysis failed', error);
      setAnalysisError(
        error?.response?.data?.message ||
          'Analysis could not be completed. Please try again.'
      );
      setAnalyzedId('');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleRegrade = async () => {
    if (!analyzedMaterial) return;

    setIsAnalyzing(true);
    setRegradeError('');

    try {
      await regradeMaterial(analyzedMaterial._id);
      const response = await getSellerMaterials(undefined, 1, 50);
      setMaterials((response.materials || []) as AnalyzedMaterial[]);
    } catch (error: any) {
      console.error('Re-checking sustainability grade failed', error);
      setRegradeError(
        error?.response?.data?.message ||
          'Could not re-check the grade. Please try again.'
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#F8FAFC] font-sans">
      <Sidebar user={user} onLogout={onLogout} />

      <main className="flex-1 p-5 md:p-8">
        <div className="mx-auto max-w-7xl space-y-6">
          {/* Page header */}
          <div className="flex flex-col gap-4 border-b border-gray-200 pb-5 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-emerald-600">
                <Sparkles className="h-3.5 w-3.5" />
                Member 02 · Sustainability Intelligence
              </div>
              <h1 className="mt-1 text-3xl font-bold text-gray-900">
                Sustainability Analysis
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Select a listing and run an analysis to view its environmental impact.
              </p>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                onClick={() => void fetchListings()}
                disabled={loading}
                className="flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>

              <button
                onClick={() => navigate('/my-listings')}
                className="flex items-center gap-2 rounded-xl bg-sky-500 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-sky-600"
              >
                <ArrowRight className="h-4 w-4" />
                Manage Listings
              </button>
            </div>
          </div>

          {loading ? (
            <div className="rounded-2xl border border-gray-200 bg-white p-16 text-center shadow-sm">
              <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-sky-500 border-t-transparent" />
              <p className="text-gray-500">Loading your listings...</p>
            </div>
          ) : loadError ? (
            <div className="rounded-2xl border border-red-100 bg-red-50 p-12 text-center">
              <p className="mb-4 text-red-600">{loadError}</p>
              <button onClick={() => void fetchListings()} className="font-medium text-sky-600 hover:text-sky-700">
                Try again
              </button>
            </div>
          ) : materials.length === 0 ? (
            <div className="rounded-2xl border border-gray-200 bg-white p-16 text-center shadow-sm">
              <PackageSearch className="mx-auto mb-4 h-12 w-12 text-gray-300" />
              <p className="mb-2 font-medium text-gray-700">No listings found</p>
              <p className="mb-6 text-sm text-gray-500">
                Upload a textile listing first, then return here to analyse its sustainability.
              </p>
              <button
                onClick={() => navigate('/upload-textile-waste')}
                className="rounded-xl bg-sky-500 px-5 py-2.5 text-sm font-medium text-white hover:bg-sky-600"
              >
                Upload Textile Waste
              </button>
            </div>
          ) : (
            <>
              {/* Searchable listing table */}
              <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                <div className="border-b border-gray-100 p-5">
                  <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <h2 className="flex items-center gap-2 text-lg font-bold text-gray-900">
                        <PackageSearch className="h-5 w-5 text-sky-500" />
                        Select a Listing
                      </h2>
                      <p className="mt-1 text-sm text-gray-500">
                        Search by listing name and filter by listing date. Results appear only after you click Analyse.
                      </p>
                    </div>
                    <span className="text-sm text-gray-500">
                      {filteredMaterials.length} of {materials.length} listings
                    </span>
                  </div>

                  <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_220px]">
                    <label className="relative block">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                      <input
                        type="search"
                        value={searchText}
                        onChange={(event) => setSearchText(event.target.value)}
                        placeholder="Search listing name, category or location..."
                        className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-10 pr-4 text-sm outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                      />
                    </label>

                    <label className="relative block">
                      <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                      <select
                        value={timeFilter}
                        onChange={(event) => setTimeFilter(event.target.value as TimeFilter)}
                        className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-10 pr-3 text-sm outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                      >
                        <option value="all">Any time</option>
                        <option value="today">Today</option>
                        <option value="7days">Last 7 days</option>
                        <option value="30days">Last 30 days</option>
                      </select>
                    </label>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full min-w-[760px] text-left text-sm">
                    <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                      <tr>
                        <th className="px-5 py-3 font-semibold">Select</th>
                        <th className="px-5 py-3 font-semibold">Listing</th>
                        <th className="px-5 py-3 font-semibold">Location</th>
                        <th className="px-5 py-3 font-semibold">Quantity</th>
                        <th className="px-5 py-3 font-semibold">Listing date / time</th>
                        <th className="px-5 py-3 font-semibold">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredMaterials.map((material) => {
                        const isSelected = selectedId === material._id;
                        return (
                          <tr
                            key={material._id}
                            onClick={() => {
                              setSelectedId(material._id);
                              setAnalysisError('');
                            }}
                            className={`cursor-pointer transition ${
                              isSelected ? 'bg-sky-50' : 'hover:bg-gray-50'
                            }`}
                          >
                            <td className="px-5 py-4">
                              <input
                                type="radio"
                                name="selectedListing"
                                checked={isSelected}
                                onChange={() => setSelectedId(material._id)}
                                aria-label={`Select ${material.title}`}
                                className="h-4 w-4 accent-sky-600"
                              />
                            </td>
                            <td className="px-5 py-4">
                              <div className="font-semibold text-gray-900">{material.title}</div>
                              <div className="mt-0.5 text-xs text-gray-500">{material.category || 'Textile material'}</div>
                            </td>
                            <td className="px-5 py-4 text-gray-600">{material.location || '—'}</td>
                            <td className="px-5 py-4 font-medium text-gray-800">
                              {safeNumber(material.quantity).toLocaleString()} kg
                            </td>
                            <td className="px-5 py-4 text-gray-600">{formatDate(material)}</td>
                            <td className="px-5 py-4">
                              <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium capitalize text-gray-600">
                                {material.status || 'Unknown'}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                      {filteredMaterials.length === 0 && (
                        <tr>
                          <td colSpan={6} className="px-5 py-10 text-center text-gray-500">
                            No listings match your search or selected time range.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="flex flex-col gap-3 border-t border-gray-100 bg-gray-50/70 p-5 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-xs text-gray-500">
                    Select one listing, then run sustainability analysis to load its results.
                  </p>
                  <button
                    onClick={() => void handleAnalyze()}
                    disabled={!selectedMaterial || isAnalyzing}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Leaf className={`h-4 w-4 ${isAnalyzing ? 'animate-pulse' : ''}`} />
                    {isAnalyzing ? 'Analysing...' : 'Analyse Sustainability'}
                  </button>
                </div>
              </section>

              {analysisError && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                  {analysisError}
                </div>
              )}

              {/* No analysis details are rendered until the user clicks Analyse. */}
              {!analyzedMaterial && !isAnalyzing && !analysisError && (
                <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center">
                  <Leaf className="mx-auto mb-3 h-10 w-10 text-emerald-500" />
                  <h3 className="font-semibold text-gray-800">Sustainability results will appear here</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Select a listing in the table above and click “Analyse Sustainability”.
                  </p>
                </div>
              )}

              {isAnalyzing && (
                <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
                  <div className="mx-auto mb-3 h-9 w-9 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
                  <p className="font-medium text-gray-700">Running sustainability analysis...</p>
                  <p className="mt-1 text-sm text-gray-500">Please wait while the selected listing is processed.</p>
                </div>
              )}

              {analyzedMaterial && !isAnalyzing && (
                <>
                  {/* Sustainability Intelligence only; no Fabric Intelligence/model cards */}
                  <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                    <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">
                          Analysis results
                        </p>
                        <h2 className="mt-1 flex items-center gap-2 text-xl font-bold text-gray-900">
                          <Leaf className="h-5 w-5 text-emerald-500" />
                          Sustainability Intelligence
                        </h2>
                        <p className="mt-1 text-sm text-gray-500">
                          {analyzedMaterial.title}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => void handleRegrade()}
                          disabled={isAnalyzing}
                          className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 px-3 py-2 text-xs font-medium text-gray-600 transition hover:border-emerald-300 hover:text-emerald-700 disabled:opacity-50"
                        >
                          <RefreshCw className="h-3.5 w-3.5" />
                          Re-check Grade
                        </button>
                        {getDisplayGrade(analyzedMaterial) && (
                          <span
                            className={`rounded-full border px-3 py-1.5 text-sm font-bold ${
                              gradeColor[getDisplayGrade(analyzedMaterial)!]
                            }`}
                          >
                            Grade {getDisplayGrade(analyzedMaterial)}
                          </span>
                        )}
                      </div>
                    </div>

                    {regradeError && (
                      <p className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{regradeError}</p>
                    )}

                    {analyzedMaterial.sustainability ? (
                      <>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                          <ImpactCard
                            icon={<Droplet className="mb-1 h-4 w-4 text-emerald-600" />}
                            label="CO₂ Saved"
                            value={`${safeNumber(analyzedMaterial.sustainability.co2SavedKg).toFixed(1)} kg`}
                            className="bg-emerald-50"
                            labelClass="text-emerald-700"
                            valueClass="text-emerald-800"
                          />
                          <ImpactCard
                            icon={<Droplet className="mb-1 h-4 w-4 text-cyan-600" />}
                            label="Water Saved"
                            value={`${safeNumber(analyzedMaterial.sustainability.waterSavedLiters).toFixed(0)} L`}
                            className="bg-cyan-50"
                            labelClass="text-cyan-700"
                            valueClass="text-cyan-800"
                          />
                          <ImpactCard
                            icon={<Zap className="mb-1 h-4 w-4 text-amber-600" />}
                            label="Energy Saved"
                            value={`${safeNumber(analyzedMaterial.sustainability.energySavedKwh).toFixed(1)} kWh`}
                            className="bg-amber-50"
                            labelClass="text-amber-700"
                            valueClass="text-amber-800"
                          />
                          <ImpactCard
                            icon={<Award className="mb-1 h-4 w-4 text-purple-600" />}
                            label="Landfill Diverted"
                            value={`${safeNumber(analyzedMaterial.sustainability.landfillDivertedKg).toFixed(0)} kg`}
                            className="bg-purple-50"
                            labelClass="text-purple-700"
                            valueClass="text-purple-800"
                          />
                        </div>

                        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                          <ScoreBar label="Circularity" value={analyzedMaterial.sustainability.circularityScore} />
                          <ScoreBar label="Recyclability" value={analyzedMaterial.sustainability.recyclabilityScore} />
                          <ScoreBar label="SDG Impact" value={analyzedMaterial.sustainability.sdgImpactScore} />
                          <ScoreBar label="Economic Impact" value={analyzedMaterial.sustainability.economicImpactScore} />
                        </div>
                      </>
                    ) : (
                      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                        Sustainability results are not available for this listing yet. Please check that the sustainability service is running and try again.
                      </div>
                    )}
                  </section>

                  {/* Listing Snapshot */}
                  <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                      <h2 className="mb-4 text-sm font-semibold text-gray-800">Listing Snapshot</h2>
                      <dl className="space-y-3 text-sm">
                        <SnapshotRow label="Quantity" value={`${safeNumber(analyzedMaterial.quantity).toLocaleString()} kg`} />
                        <SnapshotRow label="Price" value={`LKR ${safeNumber(analyzedMaterial.price).toLocaleString()}/kg`} />
                        <SnapshotRow
                          label="Estimated Value"
                          value={`LKR ${(safeNumber(analyzedMaterial.quantity) * safeNumber(analyzedMaterial.price)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                        />
                        <SnapshotRow label="Status" value={analyzedMaterial.status || 'Unknown'} capitalize />
                      </dl>
                    </section>

                    {/* Best Use Recommendation */}
                    <section className="rounded-2xl border border-emerald-100 bg-gradient-to-br from-sky-50 to-emerald-50 p-6 shadow-sm lg:col-span-2">
                      <h2 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-gray-800">
                        <TrendingUp className="h-4 w-4 text-sky-600" />
                        Best Use Recommendation
                      </h2>
                      <p className="text-sm leading-relaxed text-gray-700">
                        {recommendedAction(analyzedMaterial)}
                      </p>
                      <p className="mt-3 text-xs text-gray-500">
                        Recommendation is an estimate. Inspect the physical textile before reuse.
                      </p>
                    </section>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
};

const ImpactCard = ({
  icon,
  label,
  value,
  className,
  labelClass,
  valueClass,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  className: string;
  labelClass: string;
  valueClass: string;
}) => (
  <div className={`rounded-xl p-4 ${className}`}>
    {icon}
    <p className={`text-[10px] font-semibold uppercase ${labelClass}`}>{label}</p>
    <p className={`mt-1 font-bold ${valueClass}`}>{value}</p>
  </div>
);

const ScoreBar = ({ label, value }: { label: string; value: number }) => {
  const score = Math.min(100, Math.max(0, safeNumber(value)));

  return (
    <div>
      <div className="mb-1 flex justify-between text-[11px]">
        <span className="font-medium text-gray-500">{label}</span>
        <span className="font-semibold text-gray-900">{score.toFixed(0)}/100</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-gray-100">
        <div
          className="h-full rounded-full bg-gradient-to-r from-sky-400 to-emerald-400"
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
};

const SnapshotRow = ({
  label,
  value,
  capitalize = false,
}: {
  label: string;
  value: string;
  capitalize?: boolean;
}) => (
  <div className="flex justify-between gap-4">
    <dt className="text-gray-500">{label}</dt>
    <dd className={`text-right font-semibold text-gray-900 ${capitalize ? 'capitalize' : ''}`}>
      {value}
    </dd>
  </div>
);

export default SustainabilityAnalysis;
