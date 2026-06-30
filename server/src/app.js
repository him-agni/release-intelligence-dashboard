import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';
import deploymentRoutes from './routes/deploymentRoutes.js';
import webhookRoutes from './routes/webhookRoutes.js';

dotenv.config();

const app = express();
const allowedOrigins = (process.env.CLIENT_ORIGIN || 'http://localhost:5173,http://localhost:5174')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin) || /^http:\/\/localhost:\d+$/.test(origin)) {
        return callback(null, true);
      }

      return callback(new Error(`CORS blocked origin: ${origin}`));
    }
  })
);

app.use(
  express.json({
    limit: '1mb',
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    }
  })
);

app.get('/health', (_req, res) => {
  res.json({
    ok: true,
    dataMode: process.env.DATA_MODE || 'mock',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    dataMode: process.env.DATA_MODE || 'mock',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

const requireLiveDatabase = async (_req, res, next) => {
  if ((process.env.DATA_MODE || '').trim() !== 'live') {
    return next();
  }

  await connectDatabase();

  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({ error: 'Database unavailable. Live tracking requires MongoDB persistence.' });
  }

  return next();
};

app.use(['/api/deployments', '/webhooks', '/api/webhooks'], requireLiveDatabase);
app.use('/api/deployments', deploymentRoutes);
app.use('/webhooks', webhookRoutes);
app.use('/api/webhooks', webhookRoutes);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const clientDistPath = path.resolve(__dirname, '../../client/dist');

app.use(express.static(clientDistPath));

app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/') || req.path.startsWith('/webhooks/')) {
    return res.status(404).json({ error: 'Not found.' });
  }

  return res.sendFile(path.join(clientDistPath, 'index.html'), (error) => {
    if (error) next(error);
  });
});

app.use((err, _req, res, _next) => {
  if (err.message?.startsWith('CORS blocked origin')) {
    return res.status(403).json({ error: 'Origin not allowed.' });
  }

  if (err.name === 'CastError') {
    return res.status(400).json({ error: 'Invalid identifier.' });
  }

  if (err.name === 'ValidationError') {
    return res.status(400).json({ error: err.message });
  }

  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({ error: 'Malformed JSON request body.' });
  }

  if (err.statusCode && err.statusCode >= 400 && err.statusCode < 500) {
    return res.status(err.statusCode).json({ error: err.message });
  }

  console.error(err);
  return res.status(500).json({
    error: 'Internal server error.',
    detail: process.env.NODE_ENV === 'production' ? undefined : err.message
  });
});

export const connectDatabase = async () => {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    console.warn('MONGODB_URI is not set. API will run without persistence.');
    return;
  }

  if (mongoose.connection.readyState === 1 || mongoose.connection.readyState === 2) {
    return;
  }

  try {
    await mongoose.connect(uri);
    console.log('Connected to MongoDB');
  } catch (error) {
    console.warn(`MongoDB connection failed: ${error.message}`);
  }
};

export default app;
