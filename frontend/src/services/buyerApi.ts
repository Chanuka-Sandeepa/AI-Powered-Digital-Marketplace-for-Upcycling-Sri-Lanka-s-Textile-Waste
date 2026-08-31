import API from './api';

export interface MarketplaceListing {
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
  sustainabilityScore?: number;
  createdAt: string;
}

export interface BrowseFilters {
  category?: string;
  search?: string;
  district?: string;
  minPrice?: number;
  maxPrice?: number;
  limit?: number;
}

// Browse the marketplace. Same underlying endpoint the public homepage
// uses (GET /materials), extended here with the buyer-facing filters
// (district, price range) added specifically for this browse experience.
export const browseMarketplace = async (filters: BrowseFilters = {}): Promise<MarketplaceListing[]> => {
  const response = await API.get('/materials', { params: { status: 'available', ...filters } });
  return response.data;
};

export const getListingDetail = async (id: string): Promise<MarketplaceListing> => {
  const response = await API.get(`/materials/${id}`);
  return response.data;
};

export const submitInquiry = async (materialId: string, message: string) => {
  const response = await API.post(`/materials/${materialId}/inquire`, { message });
  return response.data;
};

export interface MyInquiryRecord {
  _id: string;
  material: { _id: string; title: string; imageUrl?: string; price: number; status: string; quantity: number; category: string } | null;
  seller: { name: string; email: string } | null;
  message: string;
  status: 'open' | 'responded' | 'closed';
  createdAt: string;
}

export interface MyInquiriesResponse {
  inquiries: MyInquiryRecord[];
  page: number;
  pages: number;
  total: number;
}

export const getMyInquiries = async (page = 1, limit = 20): Promise<MyInquiriesResponse> => {
  const response = await API.get('/materials/my-inquiries', { params: { page, limit } });
  return response.data;
};

// Traceability and scenario comparison (same endpoints the seller side
// uses) - a buyer reviewing a listing should be able to see the same
// transparency data before deciding whether to inquire.
export const getListingTraceability = async (id: string) => {
  const response = await API.get(`/materials/${id}/traceability`);
  return response.data;
};

export const getListingScenarios = async (id: string) => {
  const response = await API.get(`/materials/${id}/scenarios`);
  return response.data;
};

// ---------------------------------------------------------------------
// Checkout / orders.
// ---------------------------------------------------------------------

export interface DeliveryAddress {
  fullName: string;
  phone: string;
  addressLine: string;
  city: string;
  district: string;
  postalCode?: string;
}

export interface CheckoutItem {
  materialId: string;
  quantityKg: number;
}

export const checkout = async (items: CheckoutItem[], deliveryAddress: DeliveryAddress, paymentMethod: 'card' | 'cash') => {
  const response = await API.post('/orders/checkout', { items, deliveryAddress, paymentMethod });
  return response.data;
};

export interface OrderRecord {
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
  deliveryAddress: DeliveryAddress;
  paymentMethod: 'card' | 'cash';
  paymentStatus: 'pending' | 'paid';
  orderStatus: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  seller: { name: string; email: string } | null;
  createdAt: string;
}

export interface MyOrdersResponse {
  orders: OrderRecord[];
  page: number;
  pages: number;
  total: number;
  totalSpent: number;
}

export const getMyOrders = async (page = 1, limit = 20): Promise<MyOrdersResponse> => {
  const response = await API.get('/orders/my-orders', { params: { page, limit } });
  return response.data;
};

// Downloads the PDF receipt for an order. Uses a blob response (not a
// plain <a href>) because the endpoint requires an Authorization header -
// a normal link click can't attach that, so the file has to be fetched
// through the authenticated API client first, then handed to the browser
// as a local blob URL to trigger the actual download.
export const downloadReceipt = async (orderId: string): Promise<void> => {
  const response = await API.get(`/orders/${orderId}/receipt`, { responseType: 'blob' });
  const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `TexCycleAI-Receipt-${orderId}.pdf`);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

