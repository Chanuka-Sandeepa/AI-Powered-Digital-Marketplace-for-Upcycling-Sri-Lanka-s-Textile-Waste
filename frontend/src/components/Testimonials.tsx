import { useEffect, useState } from 'react';
import { Star } from 'lucide-react';
import { getTopReviews, type ReviewRecord } from '../services/reviewApi';

const Testimonials = () => {
  const [reviews, setReviews] = useState<ReviewRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getTopReviews()
      .then(setReviews)
      .catch((error) => console.error('Could not load customer feedback:', error))
      .finally(() => setLoading(false));
  }, []);

  return (
    <section id="testimonials" className="w-full border-t border-violet-100 bg-gradient-to-br from-violet-50 via-white to-rose-50 py-24">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-violet-600">Community feedback</p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">Reviews from real transactions</h2>
          <p className="mx-auto mt-4 max-w-xl text-sm text-zinc-500">
            Buyers and sellers can rate their experience after an order is delivered.
          </p>
        </div>

        {loading ? (
          <div className="mt-14 flex justify-center py-12" role="status" aria-label="Loading feedback">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-violet-100 border-t-violet-500" />
          </div>
        ) : reviews.length === 0 ? (
          <div className="mx-auto mt-14 max-w-2xl rounded-2xl border border-violet-100 bg-white/80 p-10 text-center shadow-sm">
            <p className="font-semibold text-zinc-800">No customer reviews yet</p>
            <p className="mt-2 text-sm text-zinc-500">Delivered orders can be rated by both the buyer and the seller. The highest-rated feedback will appear here.</p>
          </div>
        ) : (
          <div className="mt-14 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {reviews.map((review, index) => (
              <article key={review._id} className={`flex flex-col justify-between rounded-2xl border bg-white/90 p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md ${['border-rose-200', 'border-violet-200', 'border-cyan-200', 'border-amber-200', 'border-emerald-200', 'border-fuchsia-200'][index % 6]}`}>
                <div>
                  <div className="flex items-center gap-1" aria-label={`${review.rating} out of 5 stars`}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star key={star} className={`h-4 w-4 ${star <= review.rating ? 'fill-amber-400 text-amber-400' : 'text-zinc-200'}`} />
                    ))}
                    <span className="ml-2 text-xs font-semibold text-zinc-600">{review.rating}.0</span>
                  </div>
                  <p className="mt-4 text-sm leading-relaxed text-zinc-700">“{review.comment}”</p>
                  {review.materialTitle && <p className="mt-3 text-xs font-medium text-violet-700">Order: {review.materialTitle}</p>}
                </div>
                <div className="mt-6 flex items-center gap-3 border-t border-zinc-100 pt-4">
                  {review.reviewer?.avatar ? (
                    <img src={review.reviewer.avatar} alt="" className="h-10 w-10 rounded-full border-2 border-violet-100 object-cover" />
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-violet-100 to-rose-100 text-sm font-bold text-violet-700">
                      {(review.reviewer?.name || '?').slice(0, 1).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="truncate text-xs font-bold text-zinc-900">{review.reviewer?.name || 'TexCycle member'}</p>
                    <p className="mt-0.5 text-[10px] font-medium capitalize text-zinc-500">
                      {review.reviewerRole} reviewing {review.reviewerRole === 'buyer' ? 'seller' : 'buyer'}
                    </p>
                  </div>
                  <span className="ml-auto rounded-full bg-violet-50 px-2.5 py-1 text-[10px] font-semibold capitalize text-violet-700">{review.reviewerRole}</span>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default Testimonials;
