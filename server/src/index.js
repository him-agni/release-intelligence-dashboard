import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import deploymentRoutes from './routes/deploymentRoutes.js';
import webhookRoutes from './routes/webhookRoutes.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;
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

app.use('/api/deployments', deploymentRoutes);
app.use('/webhooks', webhookRoutes);

app.use((_req, res) => {
  res.status(404).json({ error: 'Not found.' });
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

const connectDatabase = async () => {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    console.warn('MONGODB_URI is not set. API will run without persistence.');
    return;
  }

  try {
    await mongoose.connect(uri);
    console.log('Connected to MongoDB');
  } catch (error) {
    console.warn(`MongoDB connection failed: ${error.message}`);
  }
};

await connectDatabase();

app.listen(port, () => {
  console.log(`Release Intelligence API running on http://localhost:${port}`);
});
