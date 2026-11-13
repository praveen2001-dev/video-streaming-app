import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { env } from './config/env.js';
import routes from './routes/index.js';
import { errorHandler } from './middlewares/error.middleware.js';
import { ApiError } from './utils/ApiError.js';

const app = express();

// Security Headers (allow cross-origin for video streams & thumbnails)
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

// CORS configuration
app.use(
  cors({
    origin: env.CLIENT_URL,
    credentials: true,
  })
);

// Rate limiter for general API requests
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  message: { success: false, message: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', limiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health Check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Main API Routes
app.use('/api', routes);

// 404 Catch-all handler
app.use((req, res, next) => {
  next(new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`));
});

// Central Error Handler
app.use(errorHandler);

export default app;
