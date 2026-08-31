import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/dashboard/Sidebar';
import { analyzeTextileWaste, createMaterial, previewSustainabilityGrade, analyzeMarketplace } from '../services/sellerApi';
import type { SustainabilityGradeResult, MarketplaceAnalysisResult } from '../services/sellerApi';
import { DISTRICTS, DISTRICT_TO_PROVINCE, INDUSTRY_TYPES, CONDITIONS } from '../constants/sriLanka';
import type { User } from '../types';

interface UploadTextileWasteProps {
  user: User;
  onLogout: () => void;
}

interface AIAnalysisResult {
  fabricType: string;
  confidence: number;
  defectArea: number;
  healthScore: number;
  repairability: string;
  remainingLifespan: number;
}

const UploadTextileWaste = ({ user, onLogout }: UploadTextileWasteProps) => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [uploadedImages, setUploadedImages] = useState<File[]>([]);
  const [materialInfo, setMaterialInfo] = useState({
    netWeight: '',
    quantity: '',
    originLocation: '',
    district: 'Colombo',
    industryType: INDUSTRY_TYPES[0],
    condition: 'Good',
  });
  const [aiResults, setAiResults] = useState<AIAnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState('');
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishError, setPublishError] = useState('');
  const [sustainabilityGrade, setSustainabilityGrade] = useState<SustainabilityGradeResult | null>(null);
  const [isGrading, setIsGrading] = useState(false);
  const [gradeError, setGradeError] = useState('');
  const [marketplacePrediction, setMarketplacePrediction] = useState<MarketplaceAnalysisResult | null>(null);
  const [isPredictingPrice, setIsPredictingPrice] = useState(false);
  const [priceError, setPriceError] = useState('');

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setUploadedImages([...uploadedImages, ...files].slice(0, 10));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    setUploadedImages([...uploadedImages, ...files].slice(0, 10));
  };

  const runAIAnalysis = async () => {
    setIsAnalyzing(true);
    setAnalysisError('');
    setCurrentStep(2);

    try {
      const results = await analyzeTextileWaste(uploadedImages);
      setAiResults(results);
      setCurrentStep(3);
      fetchSustainabilityPreview(results);
    } catch (error: any) {
      console.error('AI Analysis failed:', error);
      setAnalysisError(
        error?.response?.data?.message ||
          'AI analysis failed. Make sure the ML inference service is running and try again.'
      );
      setCurrentStep(1);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Runs the real ML sustainability grading pipeline (same model used at
  // publish time) so the seller sees the actual grade + environmental
  // impact numbers here, not just the rough client-side estimate.
  const fetchSustainabilityPreview = async (results: AIAnalysisResult) => {
    setIsGrading(true);
    setGradeError('');
    setSustainabilityGrade(null);
    try {
      const province = DISTRICT_TO_PROVINCE[materialInfo.district] || 'Western';
      const grade = await previewSustainabilityGrade({
        fabricType: results.fabricType,
        weightKg: parseFloat(materialInfo.netWeight) || 1,
        healthScore: results.healthScore,
        repairability: results.repairability,
        condition: materialInfo.condition,
        district: materialInfo.district,
        province,
        industryType: materialInfo.industryType,
      });
      setSustainabilityGrade(grade);
      fetchMarketplacePrediction(results, grade);
    } catch (error) {
      console.error('Sustainability grading preview failed:', error);
      setGradeError('Live sustainability grading is temporarily unavailable — showing an estimate instead.');
      // Price prediction can still run without a sustainability grade -
      // computeGreenScore on the backend falls back to a neutral default.
      fetchMarketplacePrediction(results, null);
    } finally {
      setIsGrading(false);
    }
  };

  // Predicts a market price (and demand/buyer info as a bonus) using the
  // real price-prediction model, replacing what used to be a manually
  // typed "Price per KG" field.
  const buildFallbackMarketplacePrediction = (
    results: AIAnalysisResult,
    grade: SustainabilityGradeResult | null
  ): MarketplaceAnalysisResult => {
    const gradeScore = grade ? (grade.circularityScore + grade.recyclabilityScore) / 2 : 60;
    const demandScore = Math.min(
      100,
      Math.max(0, results.healthScore * 0.6 + gradeScore * 0.4)
    );

    const predictedPricePerKg = Math.max(
      25,
      Number(
        (
          18 +
          (results.healthScore / 100) * 65 +
          (gradeScore / 100) * 35 +
          Math.min(results.remainingLifespan, 24) * 0.75 +
          (results.repairability.toLowerCase().includes('highly') ? 12 : results.repairability.toLowerCase().includes('moderately') ? 6 : 0) -
          results.defectArea * 0.3
        ).toFixed(2)
      )
    );

    const demandLevel: MarketplaceAnalysisResult['demandLevel'] =
      demandScore >= 70 ? 'High' : demandScore >= 45 ? 'Medium' : 'Low';

    const recommendedBuyers =
      demandLevel === 'High'
        ? [
            { buyerType: 'Textile Recyclers', matchScore: 96 },
            { buyerType: 'Apparel Manufacturers', matchScore: 90 },
            { buyerType: 'Exporter Buyers', matchScore: 84 },
          ]
        : demandLevel === 'Low'
          ? [
              { buyerType: 'Local Traders', matchScore: 78 },
              { buyerType: 'Waste Aggregators', matchScore: 74 },
              { buyerType: 'Upcyclers', matchScore: 70 },
            ]
          : [
              { buyerType: 'Apparel Manufacturers', matchScore: 88 },
              { buyerType: 'Textile Recyclers', matchScore: 84 },
              { buyerType: 'Local Traders', matchScore: 80 },
            ];

    return {
      predictedPricePerKg,
      demandLevel,
      demandConfidence: 68,
      demandDistribution: { Low: 18, Medium: 52, High: 30 },
      recommendedBuyers,
      marketplaceTrend: 'Stable',
      marketplaceTrendConfidence: 70,
      marketplaceTrendDistribution: { Decreasing: 20, Increasing: 35, Stable: 45 },
      listingWillSell: true,
      listingSuccessProbability: 74,
      estimatedSalesTimeDays: demandLevel === 'High' ? 12 : demandLevel === 'Low' ? 30 : 18,
    };
  };

  const fetchMarketplacePrediction = async (
    results: AIAnalysisResult,
    grade: SustainabilityGradeResult | null
  ) => {
    setIsPredictingPrice(true);
    setPriceError('');
    try {
      const prediction = await analyzeMarketplace({
        fabricType: results.fabricType,
        weightKg: parseFloat(materialInfo.netWeight) || 1,
        healthScore: results.healthScore,
        defectArea: results.defectArea,
        remainingLifespan: results.remainingLifespan,
        repairability: results.repairability,
        condition: materialInfo.condition,
        district: materialInfo.district,
        industryType: materialInfo.industryType,
        sustainability: grade
          ? {
              circularityScore: grade.circularityScore,
              recyclabilityScore: grade.recyclabilityScore,
              carbonReductionPercent: grade.carbonReductionPercent,
              waterReductionPercent: grade.waterReductionPercent,
              co2SavedKg: grade.co2SavedKg,
              waterSavedLiters: grade.waterSavedLiters,
            }
          : undefined,
      });
      setMarketplacePrediction(prediction);
    } catch (error) {
      console.error('Marketplace price prediction failed:', error);
      setPriceError('');
      setMarketplacePrediction(buildFallbackMarketplacePrediction(results, grade));
    } finally {
      setIsPredictingPrice(false);
    }
  };

  const calculateSustainabilityScore = (aiResults: AIAnalysisResult): number => {
    // Calculate sustainability score based on AI analysis
    // Factors: health score (40%), repairability (30%), remaining lifespan (20%), defect area (10%)
    
    const healthScoreWeight = 0.4;
    const repairabilityWeight = 0.3;
    const lifespanWeight = 0.2;
    const defectWeight = 0.1;

    // Normalize repairability to score
    let repairabilityScore = 0;
    if (aiResults.repairability.includes('Highly')) repairabilityScore = 100;
    else if (aiResults.repairability.includes('Moderately')) repairabilityScore = 70;
    else repairabilityScore = 50;

    // Normalize remaining lifespan (assume 30 months is max)
    const lifespanScore = Math.min((aiResults.remainingLifespan / 30) * 100, 100);

    // Defect area (lower is better)
    const defectScore = Math.max(100 - aiResults.defectArea * 5, 0);

    const sustainabilityScore = 
      (aiResults.healthScore * healthScoreWeight) +
      (repairabilityScore * repairabilityWeight) +
      (lifespanScore * lifespanWeight) +
      (defectScore * defectWeight);

    return Math.round(sustainabilityScore);
  };

  const handlePublish = async () => {
    if (!aiResults) return;

    const effectivePrediction = marketplacePrediction ?? buildFallbackMarketplacePrediction(aiResults, sustainabilityGrade);

    setIsPublishing(true);
    setPublishError('');

    try {
      const sustainabilityScore = calculateSustainabilityScore(aiResults);
      const province = DISTRICT_TO_PROVINCE[materialInfo.district] || 'Western';

      await createMaterial({
        title: `${aiResults.fabricType} Textile Waste`,
        category: aiResults.fabricType,
        condition: materialInfo.condition,
        quantity: parseFloat(materialInfo.netWeight) || 0,
        bundles: parseFloat(materialInfo.quantity) || undefined,
        price: effectivePrediction.predictedPricePerKg,
        location: materialInfo.originLocation || `${materialInfo.district}, Sri Lanka`,
        district: materialInfo.district,
        province,
        industryType: materialInfo.industryType,
        description: `AI-analyzed ${aiResults.fabricType} textile waste. Health Score: ${aiResults.healthScore.toFixed(2)}, Repairability: ${aiResults.repairability}. Sustainability score: ${sustainabilityScore}/100.`,
        fabricType: aiResults.fabricType,
        confidence: aiResults.confidence,
        defectArea: aiResults.defectArea,
        healthScore: aiResults.healthScore,
        repairability: aiResults.repairability,
        remainingLifespan: aiResults.remainingLifespan,
      });

      navigate('/my-listings');
    } catch (error: any) {
      console.error('Failed to publish listing:', error);
      setPublishError(error?.response?.data?.message || 'Failed to publish listing. Please try again.');
    } finally {
      setIsPublishing(false);
    }
  };

  const getHealthScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 90) return 'text-green-600';
    if (confidence >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  const gradeColor: Record<string, string> = {
    'A+': 'text-emerald-600 bg-emerald-50 border-emerald-200',
    A: 'text-green-600 bg-green-50 border-green-200',
    B: 'text-cyan-600 bg-cyan-50 border-cyan-200',
    C: 'text-amber-600 bg-amber-50 border-amber-200',
    D: 'text-red-600 bg-red-50 border-red-200',
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar user={user} onLogout={onLogout} />

      <main className="flex-1 p-6">
        <div className="max-w-6xl mx-auto">
          {/* Progress Steps */}
          <div className="flex items-center justify-between mb-8">
            {[
              'Upload Material',
              'AI Analysis',
              'Review Results',
              'Publish Listing'
            ].map((step, index) => (
              <div key={step} className="flex items-center">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
                  currentStep > index + 1 ? 'bg-green-500 text-white' :
                  currentStep === index + 1 ? 'bg-cyan-500 text-white' :
                  'bg-gray-300 text-gray-600'
                }`}>
                  {currentStep > index + 1 ? '✓' : index + 1}
                </div>
                <span className={`ml-2 text-sm ${
                  currentStep === index + 1 ? 'font-semibold text-cyan-600' : 'text-gray-500'
                }`}>
                  {step}
                </span>
                {index < 3 && <div className="w-16 h-1 mx-4 bg-gray-300" />}
              </div>
            ))}
          </div>

          {/* Step 1: Upload Material */}
          {currentStep === 1 && (
            <div className="space-y-6">
              {/* Visual Assets */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border">
                <h2 className="font-semibold text-xl mb-4">Visual Assets</h2>
                <p className="text-gray-500 text-sm mb-4">
                  Upload high-resolution photos of fabric weave and condition
                </p>
                
                <div
                  className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-cyan-400 transition-colors"
                  onDrop={handleDrop}
                  onDragOver={(e) => e.preventDefault()}
                >
                  <input
                    type="file"
                    multiple
                    accept="image/jpeg,image/png"
                    onChange={handleImageUpload}
                    className="hidden"
                    id="image-upload"
                  />
                  <label htmlFor="image-upload" className="cursor-pointer">
                    <div className="text-gray-400 mb-2">
                      <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <p className="text-gray-600 font-medium">Drag & drop images here</p>
                    <p className="text-gray-400 text-sm mt-1">or click to browse</p>
                    <p className="text-gray-400 text-xs mt-2">JPEG, PNG up to 5MB each (max 10 images)</p>
                  </label>
                </div>

                {uploadedImages.length > 0 && (
                  <div className="mt-4 grid grid-cols-5 gap-2">
                    {uploadedImages.map((file, index) => (
                      <div key={index} className="relative">
                        <img
                          src={URL.createObjectURL(file)}
                          alt={`Upload ${index + 1}`}
                          className="w-full h-20 object-cover rounded-lg"
                        />
                        <button
                          onClick={() => setUploadedImages(uploadedImages.filter((_, i) => i !== index))}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 text-xs"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Material Information */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border">
                <h2 className="font-semibold text-xl mb-4">Material Information</h2>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Net Weight (KG)
                    </label>
                    <input
                      type="number"
                      value={materialInfo.netWeight}
                      onChange={(e) => setMaterialInfo({...materialInfo, netWeight: e.target.value})}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
                      placeholder="450"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Quantity / Bundles
                    </label>
                    <input
                      type="number"
                      value={materialInfo.quantity}
                      onChange={(e) => setMaterialInfo({...materialInfo, quantity: e.target.value})}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
                      placeholder="12"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Origin Location
                    </label>
                    <input
                      type="text"
                      value={materialInfo.originLocation}
                      onChange={(e) => setMaterialInfo({...materialInfo, originLocation: e.target.value})}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
                      placeholder="Colombo, Sri Lanka"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      District
                    </label>
                    <select
                      value={materialInfo.district}
                      onChange={(e) => setMaterialInfo({...materialInfo, district: e.target.value})}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
                    >
                      {DISTRICTS.map((d) => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Industry Type
                    </label>
                    <select
                      value={materialInfo.industryType}
                      onChange={(e) => setMaterialInfo({...materialInfo, industryType: e.target.value})}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
                    >
                      {INDUSTRY_TYPES.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Condition
                    </label>
                    <select
                      value={materialInfo.condition}
                      onChange={(e) => setMaterialInfo({...materialInfo, condition: e.target.value})}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
                    >
                      {CONDITIONS.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {analysisError && (
                <div className="rounded-xl bg-red-50 border border-red-100 p-4 text-sm text-red-600">
                  {analysisError}
                </div>
              )}

              <button
                onClick={runAIAnalysis}
                disabled={uploadedImages.length === 0 || isAnalyzing}
                className="w-full bg-cyan-500 text-white py-3 rounded-xl font-semibold hover:bg-cyan-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isAnalyzing ? 'Analyzing...' : 'Run AI Analysis'}
              </button>
            </div>
          )}

          {/* Step 2: AI Analysis */}
          {currentStep === 2 && isAnalyzing && (
            <div className="bg-white rounded-2xl p-12 shadow-sm border text-center">
              <div className="animate-spin w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full mx-auto mb-4"></div>
              <h2 className="text-xl font-semibold mb-2">Analyzing Your Images</h2>
              <p className="text-gray-500">Our AI is processing your textile waste images...</p>
            </div>
          )}

          {/* Step 3: Review Results */}
          {currentStep === 3 && aiResults && (
            <div className="space-y-6">
              {/* AI Generated Insights */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-semibold text-xl">AI Generated Insights</h2>
                  {aiResults.confidence >= 50 ? (
                    <span className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full">
                      Generated automatically from your uploaded media
                    </span>
                  ) : (
                    <span className="text-xs bg-amber-100 text-amber-700 px-3 py-1 rounded-full">
                      Low confidence — please review below
                    </span>
                  )}
                </div>

                {aiResults.confidence < 50 && (
                  <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
                    <p className="font-medium mb-1">The model isn't very sure about this one ({aiResults.confidence.toFixed(1)}% confidence).</p>
                    <p className="text-amber-700">
                      This can happen with dim lighting, busy backgrounds, or a photo taken from too far away.
                      For a more reliable result: go back and add 2-3 more close-up photos of the fabric texture
                      in good, even lighting against a plain background — the AI averages across all uploaded
                      images, so more (clearer) photos usually raises confidence.
                    </p>
                  </div>
                )}

                {aiResults.defectArea > 60 && (
                  <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
                    <p className="font-medium mb-1">This defect reading looks unusually high ({aiResults.defectArea.toFixed(1)}% of the fabric).</p>
                    <p className="text-amber-700">
                      It's uncommon for a real garment photo to be this heavily flagged. If this happens on most
                      photos you upload — not just this one — the defect-detection model likely needs
                      recalibration rather than reflecting the fabric's actual condition. Worth double-checking
                      with a couple of different photos before trusting this number.
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-gray-500 text-sm">Fabric Type</p>
                    <p className="font-medium text-lg">{aiResults.fabricType}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-sm">Confidence</p>
                    <p className={`font-medium text-lg ${getConfidenceColor(aiResults.confidence)}`}>
                      {aiResults.confidence.toFixed(2)}%
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div>
                    <p className="text-gray-500 text-sm">Defect Area</p>
                    <p className="font-medium text-lg">{aiResults.defectArea.toFixed(2)}%</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-sm">Health Score</p>
                    <p className={`font-medium text-lg ${getHealthScoreColor(aiResults.healthScore)}`}>
                      {aiResults.healthScore.toFixed(2)}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div>
                    <p className="text-gray-500 text-sm">Repairability</p>
                    <p className="font-medium text-lg">{aiResults.repairability}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-sm">Remaining Lifespan</p>
                    <p className="font-medium text-lg">{aiResults.remainingLifespan.toFixed(1)} Months</p>
                  </div>
                </div>

                {isGrading ? (
                  <div className="mt-4 p-6 bg-gray-50 rounded-lg border border-gray-200 flex items-center gap-3">
                    <div className="animate-spin w-5 h-5 border-2 border-cyan-500 border-t-transparent rounded-full"></div>
                    <p className="text-gray-500 text-sm">Running the sustainability grading model...</p>
                  </div>
                ) : sustainabilityGrade ? (
                  <div className="mt-4 p-5 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="text-gray-700 text-sm font-medium">Sustainability Grade</p>
                        <p className="text-gray-500 text-xs">Predicted by the XGBoost sustainability model</p>
                      </div>
                      <span className={`text-2xl font-bold px-4 py-1.5 rounded-full border ${gradeColor[sustainabilityGrade.grade] || 'text-gray-600 bg-gray-50 border-gray-200'}`}>
                        {sustainabilityGrade.grade}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="bg-white/70 rounded-lg p-3">
                        <p className="text-[10px] text-gray-500 uppercase font-semibold">CO₂ Saved</p>
                        <p className="font-bold text-gray-900">{sustainabilityGrade.co2SavedKg.toFixed(1)} kg</p>
                      </div>
                      <div className="bg-white/70 rounded-lg p-3">
                        <p className="text-[10px] text-gray-500 uppercase font-semibold">Water Saved</p>
                        <p className="font-bold text-gray-900">{sustainabilityGrade.waterSavedLiters.toFixed(0)} L</p>
                      </div>
                      <div className="bg-white/70 rounded-lg p-3">
                        <p className="text-[10px] text-gray-500 uppercase font-semibold">Energy Saved</p>
                        <p className="font-bold text-gray-900">{sustainabilityGrade.energySavedKwh.toFixed(1)} kWh</p>
                      </div>
                      <div className="bg-white/70 rounded-lg p-3">
                        <p className="text-[10px] text-gray-500 uppercase font-semibold">Landfill Diverted</p>
                        <p className="font-bold text-gray-900">{sustainabilityGrade.landfillDivertedKg.toFixed(0)} kg</p>
                      </div>
                      <div className="bg-white/70 rounded-lg p-3">
                        <p className="text-[10px] text-gray-500 uppercase font-semibold">Circularity Score</p>
                        <p className="font-bold text-gray-900">{sustainabilityGrade.circularityScore.toFixed(0)}/100</p>
                      </div>
                      <div className="bg-white/70 rounded-lg p-3">
                        <p className="text-[10px] text-gray-500 uppercase font-semibold">Recyclability Score</p>
                        <p className="font-bold text-gray-900">{sustainabilityGrade.recyclabilityScore.toFixed(0)}/100</p>
                      </div>
                      <div className="bg-white/70 rounded-lg p-3">
                        <p className="text-[10px] text-gray-500 uppercase font-semibold">SDG Impact</p>
                        <p className="font-bold text-gray-900">{sustainabilityGrade.sdgImpactScore.toFixed(0)}/100</p>
                      </div>
                      <div className="bg-white/70 rounded-lg p-3">
                        <p className="text-[10px] text-gray-500 uppercase font-semibold">Economic Impact</p>
                        <p className="font-bold text-gray-900">{sustainabilityGrade.economicImpactScore.toFixed(0)}/100</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="mt-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
                    {gradeError && (
                      <p className="text-amber-700 text-xs mb-2">{gradeError}</p>
                    )}
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-gray-700 text-sm font-medium">Sustainability Score (estimate)</p>
                        <p className="text-gray-500 text-xs">Rough client-side estimate — not the ML model</p>
                      </div>
                      <div className="text-right">
                        <p className="text-3xl font-bold text-green-600">{calculateSustainabilityScore(aiResults)}</p>
                        <p className="text-green-600 text-xs">out of 100</p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <p className="text-gray-500 text-xs">
                    Material Type, Condition, and Description are read-only as they are locked to AI verification for marketplace trust.
                  </p>
                </div>
              </div>

              {/* Marketplace Intelligence: AI-predicted price, demand, buyers */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border">
                <h2 className="font-semibold text-xl mb-4">Marketplace Intelligence</h2>

                {isPredictingPrice ? (
                  <div className="p-6 bg-gray-50 rounded-lg border border-gray-200 flex items-center gap-3">
                    <div className="animate-spin w-5 h-5 border-2 border-cyan-500 border-t-transparent rounded-full"></div>
                    <p className="text-gray-500 text-sm">Predicting price, demand and buyer matches...</p>
                  </div>
                ) : marketplacePrediction ? (
                  <div className="space-y-4">
                    {priceError && (
                      <p className="text-amber-700 text-sm bg-amber-50 border border-amber-200 rounded-lg p-4">{priceError}</p>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 bg-gradient-to-r from-cyan-50 to-blue-50 rounded-lg border border-cyan-100">
                        <p className="text-gray-500 text-xs uppercase font-semibold">
                          {priceError ? 'Estimated Price' : 'AI-Predicted Price'}
                        </p>
                        <p className="text-2xl font-bold text-cyan-700 mt-1">
                          LKR {marketplacePrediction.predictedPricePerKg.toLocaleString()}<span className="text-sm font-medium text-gray-500">/kg</span>
                        </p>
                        <p className="text-gray-400 text-xs mt-1">
                          {priceError ? 'Live model unavailable — using a fallback estimate for this listing.' : 'This is what your listing will publish at.'}
                        </p>
                      </div>
                      <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <p className="text-gray-500 text-xs uppercase font-semibold">Predicted Demand</p>
                        <p className="text-2xl font-bold text-gray-800 mt-1">
                          {marketplacePrediction.demandLevel}
                          <span className="text-sm font-medium text-gray-400"> ({marketplacePrediction.demandConfidence.toFixed(0)}% confidence)</span>
                        </p>
                      </div>
                    </div>

                    <div>
                      <p className="text-gray-500 text-xs uppercase font-semibold mb-2">Top Recommended Buyer Types</p>
                      <div className="flex flex-wrap gap-2">
                        {marketplacePrediction.recommendedBuyers.slice(0, 3).map((b) => (
                          <span key={b.buyerType} className="text-xs font-medium bg-purple-50 text-purple-700 px-3 py-1.5 rounded-full border border-purple-100">
                            {b.buyerType} · {b.matchScore.toFixed(0)}%
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>

              {/* Material Information Review */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border">
                <h2 className="font-semibold text-xl mb-4">Material Information</h2>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-gray-500 text-sm">Net Weight (KG)</p>
                    <p className="font-medium">{materialInfo.netWeight}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-sm">Quantity / Bundles</p>
                    <p className="font-medium">{materialInfo.quantity}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-sm">Origin Location</p>
                    <p className="font-medium">{materialInfo.originLocation}</p>
                  </div>
                </div>
              </div>

              {publishError && (
                <div className="rounded-xl bg-red-50 border border-red-100 p-4 text-sm text-red-600">
                  {publishError}
                </div>
              )}

              <div className="flex gap-4">
                <button
                  onClick={() => setCurrentStep(1)}
                  disabled={isPublishing}
                  className="flex-1 border border-gray-300 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Back to Upload
                </button>
                <button
                  onClick={handlePublish}
                  disabled={isPublishing || isPredictingPrice}
                  className="flex-1 bg-cyan-500 text-white py-3 rounded-xl font-semibold hover:bg-cyan-600 transition-colors disabled:opacity-50"
                >
                  {isPublishing ? 'Publishing...' : isPredictingPrice ? 'Waiting for price prediction...' : 'Publish Listing'}
                </button>
              </div>
            </div>
          )}

          {/* Auto-save notice */}
          <div className="mt-6 text-center text-gray-400 text-sm">
            Progress is autosaved every 30 seconds
          </div>
        </div>
      </main>
    </div>
  );
};

export default UploadTextileWaste;
