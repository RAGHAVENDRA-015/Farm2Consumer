import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './config/env';
import apiRouter from './routes';
import { apiLimiter } from './middleware/rateLimit.middleware';
import { errorHandler } from './middleware/error.middleware';
import { ApiError } from './utils/apiError';
import { sendSuccess } from './utils/response';

const app: Application = express();

// Security headers
app.use(helmet());

// CORS configuration
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl) or matching client URLs
      if (!origin || origin.startsWith('http://localhost') || origin === env.CLIENT_URL) {
        callback(null, true);
      } else {
        callback(null, true); // Permissive in development
      }
    },
    credentials: true,
  })
);

// Body Parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

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

app.get('/health', (_req: Request, res: Response) => {
  return sendSuccess(res, {
    status: 'UP',
    timestamp: new Date().toISOString(),
    service: 'FarmLink API Backend',
    environment: env.NODE_ENV,
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
