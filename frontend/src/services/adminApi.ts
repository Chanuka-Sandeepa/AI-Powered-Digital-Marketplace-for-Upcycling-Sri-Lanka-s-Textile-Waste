import API from './api';

export interface AdminOverview {
  totalUsers: number;
  totalBuyers: number;
  totalSellers: number;
  suspendedUsers: number;
  totalMaterials: number;
  availableMaterials: number;
  soldMaterials: number;
  totalInquiries: number;
}

export const getAdminOverview = async (): Promise<AdminOverview> => {
  const response = await API.get('/admin/overview');
  return response.data;
};

export interface AdminUserRecord {
  _id: string;
  name: string;
  email: string;
  role: 'buyer' | 'seller' | 'admin' | 'super_admin';
  accountStatus: 'active' | 'suspended';
  phone?: string;
  createdAt: string;
}

export interface AdminUsersResponse {
  users: AdminUserRecord[];
  page: number;
  pages: number;
  total: number;
}

export const getUsers = async (params: { role?: string; search?: string; page?: number; limit?: number } = {}): Promise<AdminUsersResponse> => {
  const response = await API.get('/admin/users', { params });
  return response.data;
};

// Suspend/reactivate - available to admin (restricted server-side to
// buyer/seller targets only) and super_admin (any target except other
// super_admins).
export const updateUserStatus = async (id: string, accountStatus: 'active' | 'suspended') => {
  const response = await API.put(`/admin/users/${id}/status`, { accountStatus });
  return response.data;
};

// super_admin-only, enforced server-side - the frontend also hides this
// control for plain admin accounts, but the real enforcement is the API.
export const updateUserRole = async (id: string, role: string) => {
  const response = await API.put(`/admin/users/${id}/role`, { role });
  return response.data;
};

// super_admin-only, enforced server-side.
export const deleteUser = async (id: string) => {
  const response = await API.delete(`/admin/users/${id}`);
  return response.data;
};

export interface AdminInquiryRecord {
  _id: string;
  material: { _id: string; title: string; imageUrl?: string; price: number; status: string } | null;
  buyer: { name: string; email: string } | null;
  seller: { name: string; email: string } | null;
  message: string;
  status: 'open' | 'responded' | 'closed';
  createdAt: string;
}

export interface AdminInquiriesResponse {
  inquiries: AdminInquiryRecord[];
  page: number;
  pages: number;
  total: number;
}

export const getAllInquiries = async (page = 1, limit = 20): Promise<AdminInquiriesResponse> => {
  const response = await API.get('/admin/inquiries', { params: { page, limit } });
  return response.data;
};

// Listing (material) oversight - super_admin only in the UI. No new
// backend endpoints needed: GET/PUT/DELETE /materials/:id already let
// admin/super_admin bypass ownership checks (fixed in a previous session),
// and status=all on the list endpoint returns every listing regardless of
// availability.
export interface AdminMaterialRecord {
  _id: string;
  title: string;
  category: string;
  status: 'available' | 'pending' | 'sold';
  price: number;
  quantity: number;
  sellerName: string;
  district?: string;
  imageUrl?: string;
  createdAt: string;
}

export const getAllListings = async (params: { search?: string; status?: string; limit?: number } = {}): Promise<AdminMaterialRecord[]> => {
  const response = await API.get('/materials', { params: { status: 'all', limit: 100, ...params } });
  return response.data;
};

export const updateListingStatus = async (id: string, status: string) => {
  const response = await API.put(`/materials/${id}`, { status });
  return response.data;
};

export const deleteListing = async (id: string) => {
  const response = await API.delete(`/materials/${id}`);
  return response.data;
};
