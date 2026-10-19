import { useState } from 'react';
import { Star } from 'lucide-react';
import { createOrderReview } from '../services/reviewApi';

interface OrderReviewFormProps {
  orderId: string;
  reviewerRole: 'buyer' | 'seller';
  revieweeName: string;
  reviewed: boolean;
  onSubmitted: () => void;
}

const OrderReviewForm = ({ orderId, reviewerRole, revieweeName, reviewed, onSubmitted }: OrderReviewFormProps) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (reviewed) {
    return <p className="mt-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">Thanks, your feedback has been submitted.</p>;
  }

  const submitReview = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    if (!rating) {
      setError('Please choose a star rating.');
      return;
    }
    setSubmitting(true);
    try {
      await createOrderReview(orderId, rating, comment);
      onSubmitted();
    } catch (requestError: any) {
      setError(requestError?.response?.data?.message || 'Could not submit your feedback. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={submitReview} className="mt-4 rounded-xl border border-amber-100 bg-amber-50/60 p-4" onClick={(event) => event.stopPropagation()}>
      <h3 className="text-sm font-semibold text-zinc-900">Rate {revieweeName || (reviewerRole === 'buyer' ? 'the seller' : 'the buyer')}</h3>
      <p className="mt-1 text-xs text-zinc-500">Your order was delivered. Share feedback about this transaction.</p>
      <div className="mt-3 flex gap-1" role="group" aria-label="Choose a rating from 1 to 5 stars">
        {[1, 2, 3, 4, 5].map((star) => (
          <button key={star} type="button" aria-label={`${star} star${star === 1 ? '' : 's'}`} onClick={() => setRating(star)} className="rounded p-1 focus:outline-none focus:ring-2 focus:ring-amber-400">
            <Star className={`h-6 w-6 ${star <= rating ? 'fill-amber-400 text-amber-500' : 'text-zinc-300'}`} />
          </button>
        ))}
      </div>
      <label className="mt-3 block text-xs font-medium text-zinc-700" htmlFor={`review-${orderId}`}>Feedback</label>
      <textarea id={`review-${orderId}`} value={comment} onChange={(event) => setComment(event.target.value)} minLength={5} maxLength={1000} required rows={3} placeholder="How did this transaction go?" className="mt-1 w-full resize-y rounded-lg border border-amber-200 bg-white p-3 text-sm outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100" />
      {error && <p role="alert" className="mt-2 text-xs font-medium text-red-600">{error}</p>}
      <button type="submit" disabled={submitting || comment.trim().length < 5 || !rating} className="mt-3 rounded-lg bg-amber-500 px-4 py-2 text-xs font-semibold text-white transition hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-50">
        {submitting ? 'Submitting...' : 'Submit feedback'}
      </button>
    </form>
  );
};

export default OrderReviewForm;
