import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';

import connectDB from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import materialRoutes from './routes/materialRoutes.js';
import sellerRoutes from './routes/sellerRoutes.js';
import aiRoutes from './routes/aiRoutes.js';
import marketplaceRoutes from './routes/marketplaceRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import { notFound, errorHandler } from './middleware/errorMiddleware.js';
import { checkMlServiceHealth } from './utils/mlClient.js';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

await connectDB();

const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN?.split(',') || 'http://localhost:5173',
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
}

// Serve uploaded images (analysis photos, listing photos) statically.
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

app.get('/api/health', async (req, res) => {
  const mlOnline = await checkMlServiceHealth();
  res.json({ status: 'ok', mlService: mlOnline ? 'online' : 'offline' });
});

app.use('/api/auth', authRoutes);
app.use('/api/materials', materialRoutes);
app.use('/api/seller', sellerRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/marketplace', marketplaceRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/notifications', notificationRoutes);

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`[server] TexCycle AI backend running on port ${PORT} (${process.env.NODE_ENV || 'development'})`);
});
