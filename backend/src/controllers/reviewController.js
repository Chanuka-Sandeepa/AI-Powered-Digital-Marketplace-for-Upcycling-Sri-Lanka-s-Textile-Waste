import asyncHandler from 'express-async-handler';
import Order from '../models/Order.js';
import Review from '../models/Review.js';

export const getTopReviews = asyncHandler(async (_req, res) => {
  const reviews = await Review.find()
    .sort({ rating: -1, createdAt: -1 })
    .limit(6)
    .populate('reviewer', 'name role avatar')
    .populate('reviewee', 'name role avatar')
    .lean();

  res.json({ reviews });
});

export const createOrderReview = asyncHandler(async (req, res) => {
  const rating = Number(req.body.rating);
  const comment = typeof req.body.comment === 'string' ? req.body.comment.trim() : '';

  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    res.status(400);
    throw new Error('Choose a rating from 1 to 5 stars');
  }
  if (comment.length < 5 || comment.length > 1000) {
    res.status(400);
    throw new Error('Feedback must be between 5 and 1000 characters');
  }

  const order = await Order.findById(req.params.orderId);
  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }
  if (order.orderStatus !== 'delivered') {
    res.status(400);
    throw new Error('Feedback can be submitted after the order is delivered');
  }

  let reviewee;
  let reviewerRole;
  if (order.buyer.toString() === req.user._id.toString()) {
    reviewee = order.seller;
    reviewerRole = 'buyer';
  } else if (order.seller.toString() === req.user._id.toString()) {
    reviewee = order.buyer;
    reviewerRole = 'seller';
  } else {
    res.status(403);
    throw new Error('Only the buyer or seller on this order can leave feedback');
  }

  const existing = await Review.findOne({ order: order._id, reviewer: req.user._id });
  if (existing) {
    res.status(409);
    throw new Error('You have already left feedback for this order');
  }

  const review = await Review.create({
    order: order._id,
    reviewer: req.user._id,
    reviewee,
    reviewerRole,
    rating,
    comment,
    materialTitle: order.materialTitle,
  });

  await review.populate([
    { path: 'reviewer', select: 'name role avatar' },
    { path: 'reviewee', select: 'name role avatar' },
  ]);

  res.status(201).json(review);
});
