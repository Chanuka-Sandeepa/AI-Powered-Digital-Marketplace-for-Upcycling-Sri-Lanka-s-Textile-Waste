export interface User {
  _id: string;
  name: string;
  email: string;
  role: 'buyer' | 'seller' | 'admin' | 'super_admin';
  accountStatus?: 'active' | 'suspended';
  phone?: string;
  bio?: string;
  token?: string;
}

export interface Material {
  _id: string;
  title: string;
  category: string;
  condition: string;
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
  sellerName: string;
  seller?: string;
  status: 'available' | 'pending' | 'sold';
  aiAnalysis?: {
    fabricType: string; confidence: number; defectArea: number; healthScore: number;
    repairability: string; remainingLifespan: number; analyzedAt?: string;
  };
  sustainability?: {
    grade: string; circularityScore: number; recyclabilityScore: number;
    carbonReductionPercent: number; waterReductionPercent: number; co2SavedKg: number;
    waterSavedLiters: number; energySavedKwh: number; landfillDivertedKg: number;
    sdgImpactScore: number; economicImpactScore: number;
  };
  sustainabilityScore?: number;
  createdAt: string;
  updatedAt: string;
}

export interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}
