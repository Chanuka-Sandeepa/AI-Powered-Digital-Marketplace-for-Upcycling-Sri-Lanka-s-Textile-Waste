import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/dashboard/Sidebar';
import { getAIAnalysisHistory } from '../services/sellerApi';
import type { User } from '../types';

interface AnalysisHistoryProps {
  user: User;
  onLogout: () => void;
}

interface AnalysisRecord {
  _id: string;
  fabricType: string;
  confidence: number;
  defectArea: number;
  healthScore: number;
  repairability: string;
  remainingLifespan: number;
  analyzedAt: string;
  images: string[];
  materialId?: string;
}

const AnalysisHistory = ({ user, onLogout }: AnalysisHistoryProps) => {
  const navigate = useNavigate();
  const [analyses, setAnalyses] = useState<AnalysisRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [selectedAnalysis, setSelectedAnalysis] = useState<AnalysisRecord | null>(null);
  const [dateFilter, setDateFilter] = useState<'all' | 'week' | 'month' | 'year'>('all');

  useEffect(() => {
    fetchAnalyses();
  }, [dateFilter]);

  const fetchAnalyses = async () => {
    try {
      setLoading(true);
      setLoadError('');
      const response = await getAIAnalysisHistory(dateFilter === 'all' ? undefined : dateFilter);
      setAnalyses(response.analyses);
    } catch (error) {
      console.error('Failed to fetch analysis history:', error);
      setAnalyses([]);
      setLoadError('Could not load your analysis history right now. Please try again shortly.');
    } finally {
      setLoading(false);
    }
  };

  const getHealthScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600 bg-green-50';
    if (score >= 70) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const getRepairabilityBadge = (repairability: string) => {
    if (repairability.includes('Highly')) return 'bg-green-100 text-green-700';
    if (repairability.includes('Moderately')) return 'bg-yellow-100 text-yellow-700';
    return 'bg-blue-100 text-blue-700';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredAnalyses = analyses.filter(analysis => {
    const analysisDate = new Date(analysis.analyzedAt);
    const now = new Date();
    const daysDiff = Math.floor((now.getTime() - analysisDate.getTime()) / (1000 * 60 * 60 * 24));
    
    switch (dateFilter) {
      case 'week':
        return daysDiff <= 7;
      case 'month':
        return daysDiff <= 30;
      case 'year':
        return daysDiff <= 365;
      default:
        return true;
    }
  });

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-cyan-50/40 to-violet-50/40">
      <Sidebar user={user} onLogout={onLogout} />

      <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-3xl bg-gradient-to-r from-cyan-600 via-teal-500 to-emerald-500 p-5 text-white shadow-lg shadow-cyan-200/60 sm:p-6">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-50">Fabric intelligence</p>
              <h1 className="mt-1 text-2xl font-bold">Analysis History</h1>
              <p className="mt-1 text-sm text-white/80">Review your past textile scans and AI insights.</p>
            </div>
            <button
              onClick={() => navigate('/upload-textile-waste')}
              className="rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-teal-700 shadow-sm transition hover:-translate-y-0.5 hover:bg-cyan-50"
            >
              + New Analysis
            </button>
          </div>

          {/* Stats Summary */}
          <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-white bg-gradient-to-br from-sky-50 to-white p-4 shadow-md shadow-sky-100/70 ring-1 ring-sky-100">
              <p className="text-xs font-semibold text-sky-700">Total Analyses</p>
              <p className="mt-1 text-2xl font-extrabold text-slate-900">{analyses.length}</p>
            </div>
            <div className="rounded-2xl border border-white bg-gradient-to-br from-emerald-50 to-white p-4 shadow-md shadow-emerald-100/70 ring-1 ring-emerald-100">
              <p className="text-xs font-semibold text-emerald-700">Avg Health Score</p>
              <p className="mt-1 text-2xl font-extrabold text-emerald-700">
                {analyses.length === 0 ? '—' : (analyses.reduce((acc, a) => acc + a.healthScore, 0) / analyses.length).toFixed(1)}
              </p>
            </div>
            <div className="rounded-2xl border border-white bg-gradient-to-br from-violet-50 to-white p-4 shadow-md shadow-violet-100/70 ring-1 ring-violet-100">
              <p className="text-xs font-semibold text-violet-700">Highly Repairable</p>
              <p className="mt-1 text-2xl font-extrabold text-violet-700">
                {analyses.filter(a => a.repairability.includes('Highly')).length}
              </p>
            </div>
          </div>

          {/* Date Filter */}
          <div className="mb-6 rounded-2xl border border-white bg-white/90 p-3 shadow-md shadow-slate-200/40 ring-1 ring-slate-100">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setDateFilter('all')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  dateFilter === 'all' ? 'bg-gradient-to-r from-cyan-600 to-teal-500 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-cyan-50 hover:text-cyan-700'
                }`}
              >
                All Time
              </button>
              <button
                onClick={() => setDateFilter('week')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  dateFilter === 'week' ? 'bg-gradient-to-r from-cyan-600 to-teal-500 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-cyan-50 hover:text-cyan-700'
                }`}
              >
                Last Week
              </button>
              <button
                onClick={() => setDateFilter('month')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  dateFilter === 'month' ? 'bg-gradient-to-r from-cyan-600 to-teal-500 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-cyan-50 hover:text-cyan-700'
                }`}
              >
                Last Month
              </button>
              <button
                onClick={() => setDateFilter('year')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  dateFilter === 'year' ? 'bg-gradient-to-r from-cyan-600 to-teal-500 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-cyan-50 hover:text-cyan-700'
                }`}
              >
                Last Year
              </button>
            </div>
          </div>

          {/* Analysis List */}
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-gray-500">Loading analysis history...</p>
            </div>
          ) : loadError ? (
            <div className="rounded-2xl border border-rose-100 bg-rose-50 p-10 text-center shadow-sm">
              <p className="text-red-600 mb-4">{loadError}</p>
              <button
                onClick={fetchAnalyses}
                className="text-cyan-600 hover:text-cyan-700 font-medium"
              >
                Try again
              </button>
            </div>
          ) : filteredAnalyses.length === 0 ? (
            <div className="rounded-2xl border border-white bg-white/90 p-10 text-center shadow-md ring-1 ring-slate-100">
              <p className="text-gray-500 mb-4">No analysis history found</p>
              <button
                onClick={() => navigate('/upload-textile-waste')}
                className="text-cyan-600 hover:text-cyan-700 font-medium"
              >
                Run your first analysis
              </button>
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-white bg-white/95 shadow-lg shadow-slate-200/50 ring-1 ring-slate-100">
              <div className="overflow-x-auto">
              <table className="w-full min-w-[850px]">
                <thead className="bg-gradient-to-r from-cyan-50 via-white to-violet-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fabric Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Health Score
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Repairability
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Lifespan
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredAnalyses.map((analysis) => (
                    <tr key={analysis._id} className="transition-colors hover:bg-cyan-50/40">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(analysis.analyzedAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-10 w-10 flex-shrink-0">
                            <img
                              className="h-10 w-10 rounded-full object-cover"
                              src={analysis.images[0] || '/hero_textile.png'}
                              alt=""
                            />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{analysis.fabricType}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getHealthScoreColor(analysis.healthScore)}`}>
                          {analysis.healthScore.toFixed(2)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getRepairabilityBadge(analysis.repairability)}`}>
                          {analysis.repairability}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {analysis.remainingLifespan.toFixed(1)} months
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => setSelectedAnalysis(analysis)}
                          className="text-cyan-600 hover:text-cyan-900 mr-3"
                        >
                          View Details
                        </button>
                        {analysis.materialId && (
                          <button
                            onClick={() => {/* Navigate to material */}}
                            className="text-gray-600 hover:text-gray-900"
                          >
                            View Material
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            </div>
          )}

          {/* Detail Modal */}
          {selectedAnalysis && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
              <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-white bg-white p-6 shadow-2xl shadow-slate-950/20">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold">Analysis Details</h2>
                  <button
                    onClick={() => setSelectedAnalysis(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-gray-500 text-sm">Analysis Date</p>
                      <p className="font-medium">{formatDate(selectedAnalysis.analyzedAt)}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-sm">Fabric Type</p>
                      <p className="font-medium">{selectedAnalysis.fabricType}</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-gray-500 text-sm">Health Score</p>
                    <p className={`font-medium text-lg ${getHealthScoreColor(selectedAnalysis.healthScore).split(' ')[0]}`}>
                      {selectedAnalysis.healthScore.toFixed(2)}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-gray-500 text-sm">Defect Area</p>
                      <p className="font-medium">{selectedAnalysis.defectArea.toFixed(2)}%</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-sm">Remaining Lifespan</p>
                      <p className="font-medium">{selectedAnalysis.remainingLifespan.toFixed(1)} months</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-gray-500 text-sm">Repairability Assessment</p>
                    <span className={`inline-block mt-1 px-3 py-1 rounded-full text-sm font-medium ${getRepairabilityBadge(selectedAnalysis.repairability)}`}>
                      {selectedAnalysis.repairability}
                    </span>
                  </div>

                  <div>
                    <p className="text-gray-500 text-sm mb-2">Analyzed Images</p>
                    <div className="grid grid-cols-3 gap-2">
                      {selectedAnalysis.images.map((img, idx) => (
                        <img
                          key={idx}
                          src={img}
                          alt={`Analysis image ${idx + 1}`}
                          className="w-full h-24 object-cover rounded-lg"
                        />
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex gap-3">
                  <button
                    onClick={() => setSelectedAnalysis(null)}
                    className="flex-1 rounded-xl bg-slate-100 py-2.5 font-semibold text-slate-700 transition hover:bg-slate-200"
                  >
                    Close
                  </button>
                  {selectedAnalysis.materialId && (
                    <button
                      onClick={() => {
                        setSelectedAnalysis(null);
                        // Navigate to material details
                      }}
                      className="flex-1 rounded-xl bg-gradient-to-r from-cyan-600 to-teal-500 py-2.5 font-semibold text-white shadow-sm transition hover:shadow-md"
                    >
                      View Material Listing
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default AnalysisHistory;
