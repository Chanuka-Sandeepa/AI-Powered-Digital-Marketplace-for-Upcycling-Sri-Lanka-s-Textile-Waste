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

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 90) return 'text-green-600';
    if (confidence >= 70) return 'text-yellow-600';
    return 'text-red-600';
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
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar user={user} onLogout={onLogout} />

      <main className="flex-1 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Analysis History</h1>
            <button
              onClick={() => navigate('/upload-textile-waste')}
              className="bg-cyan-500 text-white px-4 py-2 rounded-lg hover:bg-cyan-600 transition-colors"
            >
              + New Analysis
            </button>
          </div>

          {/* Stats Summary */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <p className="text-gray-500 text-sm">Total Analyses</p>
              <p className="text-2xl font-bold text-gray-900">{analyses.length}</p>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <p className="text-gray-500 text-sm">Avg Health Score</p>
              <p className="text-2xl font-bold text-green-600">
                {analyses.length === 0 ? '—' : (analyses.reduce((acc, a) => acc + a.healthScore, 0) / analyses.length).toFixed(1)}
              </p>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <p className="text-gray-500 text-sm">Avg Confidence</p>
              <p className="text-2xl font-bold text-cyan-600">
                {analyses.length === 0 ? '—' : `${(analyses.reduce((acc, a) => acc + a.confidence, 0) / analyses.length).toFixed(1)}%`}
              </p>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <p className="text-gray-500 text-sm">Highly Repairable</p>
              <p className="text-2xl font-bold text-emerald-600">
                {analyses.filter(a => a.repairability.includes('Highly')).length}
              </p>
            </div>
          </div>

          {/* Date Filter */}
          <div className="bg-white rounded-xl p-4 shadow-sm mb-6">
            <div className="flex gap-2">
              <button
                onClick={() => setDateFilter('all')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  dateFilter === 'all' ? 'bg-cyan-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All Time
              </button>
              <button
                onClick={() => setDateFilter('week')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  dateFilter === 'week' ? 'bg-cyan-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Last Week
              </button>
              <button
                onClick={() => setDateFilter('month')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  dateFilter === 'month' ? 'bg-cyan-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Last Month
              </button>
              <button
                onClick={() => setDateFilter('year')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  dateFilter === 'year' ? 'bg-cyan-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
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
            <div className="bg-red-50 border border-red-100 rounded-xl p-12 text-center">
              <p className="text-red-600 mb-4">{loadError}</p>
              <button
                onClick={fetchAnalyses}
                className="text-cyan-600 hover:text-cyan-700 font-medium"
              >
                Try again
              </button>
            </div>
          ) : filteredAnalyses.length === 0 ? (
            <div className="bg-white rounded-xl p-12 shadow-sm text-center">
              <p className="text-gray-500 mb-4">No analysis history found</p>
              <button
                onClick={() => navigate('/upload-textile-waste')}
                className="text-cyan-600 hover:text-cyan-700 font-medium"
              >
                Run your first analysis
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fabric Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Confidence
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
                    <tr key={analysis._id} className="hover:bg-gray-50">
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
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`font-medium ${getConfidenceColor(analysis.confidence)}`}>
                          {analysis.confidence.toFixed(2)}%
                        </span>
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
          )}

          {/* Detail Modal */}
          {selectedAnalysis && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-2xl p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
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

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-gray-500 text-sm">Confidence Score</p>
                      <p className={`font-medium text-lg ${getConfidenceColor(selectedAnalysis.confidence)}`}>
                        {selectedAnalysis.confidence.toFixed(2)}%
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-sm">Health Score</p>
                      <p className={`font-medium text-lg ${getHealthScoreColor(selectedAnalysis.healthScore).split(' ')[0]}`}>
                        {selectedAnalysis.healthScore.toFixed(2)}
                      </p>
                    </div>
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
                    className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Close
                  </button>
                  {selectedAnalysis.materialId && (
                    <button
                      onClick={() => {
                        setSelectedAnalysis(null);
                        // Navigate to material details
                      }}
                      className="flex-1 bg-cyan-500 text-white py-2 rounded-lg hover:bg-cyan-600 transition-colors"
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
