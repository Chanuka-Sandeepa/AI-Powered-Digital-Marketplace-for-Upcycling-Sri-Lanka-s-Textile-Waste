import API from './api';

export interface SellerStats {
  totalListings: number;
  availableListings: number;
  pendingListings: number;
  soldListings: number;
  totalQuantity: number;
  totalValue: number;
  revenue: number;
  recentListings: any[];
}

export interface SellerMaterialsResponse {
  materials: any[];
  page: number;
  pages: number;
  total: number;
}

export interface PerformanceData {
  categoryData: Record<string, number>;
  statusData: Record<string, number>;
  dailyData: Array<{ date: string; count: number }>;
}

export interface ActivityItem {
  type: 'sale' | 'listing';
  title: string;
  status: string;
  quantity: number;
  price: number;
  date: Date;
}

export interface AIAnalysisResult {
  fabricType: string;
  confidence: number;
  defectArea: number;
  healthScore: number;
  repairability: string;
  remainingLifespan: number;
}

// analyzeTextileWaste also returns the URLs the uploaded photos were saved
// under, so the frontend can attach them to the published listing -
// that's what makes "re-run AI analysis" on an existing listing possible.
export interface AIAnalysisResultWithImages extends AIAnalysisResult {
  images: string[];
}

export interface AnalysisRecord extends AIAnalysisResult {
  _id: string;
  analyzedAt: string;
  images: string[];
  materialId?: string;
}

export interface AnalysisHistoryResponse {
  analyses: AnalysisRecord[];
  total: number;
}

export interface SustainabilityMetric {
  _id: string;
  period: string;
  wasteDiverted: number;
  co2Saved: number;
  waterSaved: number;
  energySaved: number;
  materialsRecycled: number;
  revenueGenerated: number;
  createdAt: string;
}

export interface SustainabilityResponse {
  metrics: SustainabilityMetric[];
  total: number;
}

export interface SellerProfile {
  name: string;
  email: string;
  phone?: string;
  bio?: string;
  avatar?: string;
  memberSince?: string;
  totalListings?: number;
  totalSales?: number;
  totalRevenue?: number;
  averageRating?: number | null;
  responseRate?: number | null;
}

export interface CompanyInfo {
  companyName: string;
  businessType: string;
  registrationNumber: string;
  taxId: string;
  address: string;
  city: string;
  country: string;
  postalCode: string;
  phone: string;
  website: string;
}

// Get seller dashboard statistics
export const getSellerStats = async (): Promise<SellerStats> => {
  const response = await API.get('/seller/stats');
  return response.data;
};

// Get seller's materials with pagination
export const getSellerMaterials = async (
  status?: string,
  page: number = 1,
  limit: number = 10
): Promise<SellerMaterialsResponse> => {
  const params: any = { page, limit };
  if (status) params.status = status;
  const response = await API.get('/seller/materials', { params });
  return response.data;
};

// Get seller performance data for charts
export const getSellerPerformance = async (
  period: number = 30
): Promise<PerformanceData> => {
  const response = await API.get('/seller/performance', { params: { period } });
  return response.data;
};

// Get seller activity history
export const getSellerActivity = async (limit: number = 10): Promise<ActivityItem[]> => {
  const response = await API.get('/seller/activity', { params: { limit } });
  return response.data;
};

// Analyze textile waste using AI
export const analyzeTextileWaste = async (images: File[]): Promise<AIAnalysisResultWithImages> => {
  const formData = new FormData();
  images.forEach((image) => {
    formData.append('images', image);
  });

  const response = await API.post('/ai/analyze', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

// Get AI analysis history
export const getAIAnalysisHistory = async (
  dateFilter?: string
): Promise<AnalysisHistoryResponse> => {
  const params: any = {};
  if (dateFilter) params.dateFilter = dateFilter;
  const response = await API.get('/ai/history', { params });
  return response.data;
};

export interface SustainabilityGradeResult {
  grade: string; // 'A+' | 'A' | 'B' | 'C' | 'D'
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
}

export interface GradePreviewPayload {
  fabricType: string;
  weightKg: number;
  healthScore: number;
  repairability: string;
  condition?: string;
  district?: string;
  province?: string;
  industryType?: string;
}

// Runs the real ML sustainability grading pipeline (XGBoost regressor +
// classifier) without creating a listing - used to show the actual grade
// during the AI upload wizard's review step, before publishing.
export const previewSustainabilityGrade = async (
  payload: GradePreviewPayload
): Promise<SustainabilityGradeResult> => {
  const response = await API.post('/ai/grade', payload);
  return response.data;
};

// Get sustainability metrics
export const getSustainabilityMetrics = async (
  timeRange: string = 'month'
): Promise<SustainabilityResponse> => {
  const response = await API.get('/seller/sustainability', { params: { timeRange } });
  return response.data;
};

// Get seller profile
export const getSellerProfile = async (): Promise<SellerProfile> => {
  const response = await API.get('/seller/profile');
  return response.data;
};

// Update seller profile
export const updateSellerProfile = async (profile: Partial<SellerProfile>): Promise<SellerProfile> => {
  const response = await API.put('/seller/profile', profile);
  return response.data;
};

// Get company information
export const getCompanyInfo = async (): Promise<CompanyInfo> => {
  const response = await API.get('/seller/company');
  return response.data;
};

// Update company information
export const updateCompanyInfo = async (company: Partial<CompanyInfo>): Promise<CompanyInfo> => {
  const response = await API.put('/seller/company', company);
  return response.data;
};

export interface NewMaterialPayload {
  title: string;
  category: string;
  condition?: string;
  quantity: number;
  bundles?: number;
  price: number;
  location: string;
  district?: string;
  province?: string;
  industryType?: string;
  description: string;
  imageUrl?: string;
  images?: string[];
  // AI analysis fields (optional) - when present, the backend also runs the
  // ML sustainability grading pipeline and stores the result on the listing.
  fabricType?: string;
  confidence?: number;
  defectArea?: number;
  healthScore?: number;
  repairability?: string;
  remainingLifespan?: number;
}

// Publish a new listing (used by the AI upload wizard once analysis is complete)
export const createMaterial = async (payload: NewMaterialPayload) => {
  const response = await API.post('/materials', payload);
  return response.data;
};

// Edit an existing listing. If `category` is changed on a listing that has
// AI analysis attached, the backend treats it as a fabric-type correction:
// it updates aiAnalysis.fabricType and re-runs sustainability grading so
// the CO2/water/energy numbers stay consistent with the corrected type.
export const updateMaterial = async (id: string, payload: Partial<NewMaterialPayload> & { status?: string }) => {
  const response = await API.put(`/materials/${id}`, payload);
  return response.data;
};

// Re-runs sustainability grading for an already-published listing using
// its currently-stored AI analysis. Useful after the ml-service's grading
// logic or model files change - existing listings don't re-grade
// automatically, since grading only runs on create/edit.
export const regradeMaterial = async (id: string) => {
  const response = await API.post(`/materials/${id}/regrade`);
  return response.data;
};

// Re-runs the AI fabric/defect analysis (not just sustainability grading)
// using this listing's stored photos, then re-grades sustainability against
// the fresh results. Needed because aiAnalysis is only ever computed once
// at publish time - a listing published before a model improvement stays
// stuck with old numbers until this is called. Only works for listings
// that have stored photo URLs (material.images) - see backend for details.
export const reanalyzeMaterial = async (id: string) => {
  const response = await API.post(`/materials/${id}/reanalyze`);
  return response.data;
};

// ---------------------------------------------------------------------
// Traceability (FR-15) and circular-action scenario comparison (FR-07).
// ---------------------------------------------------------------------

export interface TraceabilityEventRecord {
  _id: string;
  eventType:
    | 'Listed' | 'AIAnalyzed' | 'Reanalyzed' | 'SustainabilityGraded'
    | 'Regraded' | 'MarketplaceAnalyzed' | 'StatusChanged' | 'Sold';
  actor?: { name: string } | null;
  details: Record<string, unknown>;
  createdAt: string;
}

export const getMaterialTraceability = async (id: string): Promise<{ materialId: string; events: TraceabilityEventRecord[] }> => {
  const response = await API.get(`/materials/${id}/traceability`);
  return response.data;
};

export interface CircularScenario {
  action: 'Reuse' | 'Recycle' | 'Discard';
  feasible: boolean;
  co2SavedKg: number;
  waterSavedLiters: number;
  energySavedKwh: number;
  landfillDivertedKg: number;
  environmentalCostCo2Kg?: number;
  description: string;
}

export interface ScenarioComparisonResult {
  scenarios: CircularScenario[];
  recommendedAction: 'Reuse' | 'Recycle';
  recommendationReason: string;
}

export const getMaterialScenarios = async (id: string): Promise<ScenarioComparisonResult> => {
  const response = await API.get(`/materials/${id}/scenarios`);
  return response.data;
};

// ---------------------------------------------------------------------
// Marketplace intelligence: price prediction, demand prediction, and
// buyer recommendation.
// ---------------------------------------------------------------------

export interface BuyerRecommendation {
  buyerType: string;
  matchScore: number;
}

export interface MarketplaceAnalysisResult {
  predictedPricePerKg: number;
  demandLevel: 'Low' | 'Medium' | 'High';
  demandConfidence: number;
  demandDistribution: Record<string, number>;
  recommendedBuyers: BuyerRecommendation[];
  marketplaceTrend: 'Decreasing' | 'Increasing' | 'Stable';
  marketplaceTrendConfidence: number;
  marketplaceTrendDistribution: Record<string, number>;
  listingWillSell: boolean;
  listingSuccessProbability: number;
  estimatedSalesTimeDays: number;
}

export interface MarketplaceAnalysisByMaterialPayload {
  materialId: string;
}

export interface MarketplaceAnalysisRawPayload {
  fabricType: string;
  weightKg: number;
  healthScore: number;
  defectArea?: number;
  remainingLifespan?: number;
  repairability?: string;
  condition?: string;
  district?: string;
  industryType?: string;
  sustainability?: {
    circularityScore?: number;
    recyclabilityScore?: number;
    carbonReductionPercent?: number;
    waterReductionPercent?: number;
    co2SavedKg?: number;
    waterSavedLiters?: number;
  };
}

// Runs the price -> demand -> buyer-recommendation cascade. Pass either
// { materialId } for an existing listing, or the raw analysis fields
// directly (used by the upload wizard before a listing exists).
export const analyzeMarketplace = async (
  payload: MarketplaceAnalysisByMaterialPayload | MarketplaceAnalysisRawPayload
): Promise<MarketplaceAnalysisResult> => {
  const response = await API.post('/marketplace/analyze', payload);
  return response.data;
};

export interface MarketplacePredictionRecord {
  _id: string;
  material?: { _id: string; title: string; imageUrl?: string; status: string } | null;
  fabricType: string;
  weightKg: number;
  healthScore: number;
  defectArea: number;
  condition: string;
  district: string;
  industryType: string;
  predictedPricePerKg: number;
  demandLevel: 'Low' | 'Medium' | 'High';
  demandConfidence: number;
  recommendedBuyers: BuyerRecommendation[];
  marketplaceTrend?: 'Decreasing' | 'Increasing' | 'Stable';
  listingWillSell?: boolean;
  listingSuccessProbability?: number;
  estimatedSalesTimeDays?: number;
  createdAt: string;
}

export interface MarketplaceHistoryResponse {
  predictions: MarketplacePredictionRecord[];
  page: number;
  pages: number;
  total: number;
}

export const getMarketplaceHistory = async (page = 1, limit = 20): Promise<MarketplaceHistoryResponse> => {
  const response = await API.get('/marketplace/history', { params: { page, limit } });
  return response.data;
};

// ---------------------------------------------------------------------
// Order fulfillment - the seller side of the buyer's checkout/orders flow.
// ---------------------------------------------------------------------

export interface SellerOrderRecord {
  _id: string;
  orderCode: string;
  materialTitle: string;
  materialImageUrl?: string;
  quantityKg: number;
  pricePerKg: number;
  subtotal: number;
  deliveryFee: number;
  totalAmount: number;
  estimatedDeliveryDate?: string;
  deliveryAddress: {
    fullName: string; phone: string; addressLine: string; city: string; district: string; postalCode?: string;
  };
  paymentMethod: 'card' | 'cash';
  paymentStatus: 'pending' | 'paid';
  orderStatus: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  buyer: { name: string; email: string } | null;
  createdAt: string;
}

export interface SellerOrdersResponse {
  orders: SellerOrderRecord[];
  page: number;
  pages: number;
  total: number;
}

export const getSellerOrders = async (page = 1, limit = 20): Promise<SellerOrdersResponse> => {
  const response = await API.get('/orders/seller-orders', { params: { page, limit } });
  return response.data;
};

export const updateOrderStatus = async (orderId: string, orderStatus: string) => {
  const response = await API.put(`/orders/${orderId}/status`, { orderStatus });
  return response.data;
};

