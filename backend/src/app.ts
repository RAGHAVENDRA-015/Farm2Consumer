import express, { Application, Request, Response, NextFunction } from 'express';
import path from 'path';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './config/env';
import apiRouter from './routes';
import { apiLimiter } from './middleware/rateLimit.middleware';
import { errorHandler } from './middleware/error.middleware';
import { ApiError } from './utils/apiError';
import { sendSuccess } from './utils/response';

import { prisma } from './config/database';

const app: Application = express();

// Trust proxy for rate limiter & real client IP behind load balancers/reverse proxies
app.set('trust proxy', 1);

// Security headers (allow cross-origin resources for uploaded images)
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

// Serve uploaded images statically
app.use(
  '/uploads',
  (req, res, next) => {
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    next();
  },
  express.static(path.join(process.cwd(), 'uploads'))
);

// CORS configuration with explicit allowlist
const allowedOrigins = env.CLIENT_URL
  ? env.CLIENT_URL.split(',').map((u) => u.trim())
  : ['http://localhost:5173'];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl)
      if (!origin) return callback(null, true);

      if (
        allowedOrigins.includes(origin) ||
        (env.NODE_ENV !== 'production' &&
          (origin.startsWith('http://localhost') || origin.startsWith('http://127.0.0.1')))
      ) {
        return callback(null, true);
      }

      return callback(new Error('Blocked by CORS policy'));
    },
    credentials: true,
  })
);

// Body Parsers (1MB limit to protect against payload DoS)
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Logging
if (env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Rate Limiting
app.use(env.API_PREFIX, apiLimiter);

// Root & Health Checks
app.get('/', (_req: Request, res: Response) => {
  return sendSuccess(res, {
    service: 'FarmLink Backend API',
    status: 'ONLINE',
    apiDocs: `${env.API_PREFIX}`,
    health: '/health',
  });
});

app.get('/health', async (_req: Request, res: Response) => {
  let dbStatus = 'UP';
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch {
    dbStatus = 'DOWN';
  }

  const isHealthy = dbStatus === 'UP';
  res.status(isHealthy ? 200 : 503).json({
    success: isHealthy,
    data: {
      status: isHealthy ? 'UP' : 'DEGRADED',
      database: dbStatus,
      timestamp: new Date().toISOString(),
      service: 'FarmLink API Backend',
      environment: env.NODE_ENV,
    },
  });
});

// API Routes
app.use(env.API_PREFIX, apiRouter);

// 404 Not Found Handler
app.use((req: Request, _res: Response, next: NextFunction) => {
  next(ApiError.notFound(`Endpoint ${req.method} ${req.originalUrl} not found`, 'ENDPOINT_NOT_FOUND'));
});

// Global Centralized Error Middleware
app.use(errorHandler);

export default app;
