import API from './api.js';

export interface ReviewRecord {
  _id: string;
  rating: number;
  comment: string;
  reviewerRole: 'buyer' | 'seller';
  materialTitle: string;
  createdAt: string;
  reviewer: { name: string; role: string; avatar?: string } | null;
  reviewee: { name: string; role: string; avatar?: string } | null;
}

export const getTopReviews = async (): Promise<ReviewRecord[]> => {
  const response = await API.get('/reviews/top');
  return response.data.reviews || [];
};

export const createOrderReview = async (orderId: string, rating: number, comment: string) => {
  const response = await API.post(`/reviews/orders/${orderId}`, { rating, comment });
  return response.data as ReviewRecord;
};
