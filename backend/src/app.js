import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { config } from './config/env.js';
import healthRouter from './routes/health.routes.js';
import trafficRuleRouter from './routes/trafficRule.routes.js';
import challanRouter from './routes/challan.routes.js';
import hazardRouter from './routes/hazard.routes.js';
import safetyRouter from './routes/safety.routes.js';
import emergencyRouter from './routes/emergency.routes.js';
import aiRouter from './routes/ai.routes.js';
import { notFoundHandler } from './middleware/notFound.middleware.js';
import { errorHandler } from './middleware/error.middleware.js';

const app = express();

// 1. Helmet Security Headers
app.use(helmet());

// 2. CORS Configuration (credentials disabled when using wildcard '*')
const isWildcardOrigin = config.corsOrigin === '*';
app.use(cors({
  origin: config.corsOrigin,
  credentials: !isWildcardOrigin
}));

// 3. Global API Rate Limiting Middleware
const apiLimiter = rateLimit({
  windowMs: config.rateLimitWindowMs,
  max: config.rateLimitMax,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next, options) => {
    return res.status(options.statusCode || 429).json({
      success: false,
      message: 'Too many requests, please try again later'
    });
  }
});
app.use('/api', apiLimiter);

// 4. Request Body Size Limits
app.use(express.json({ limit: '16kb' }));
app.use(express.urlencoded({ extended: true, limit: '16kb' }));

// 5. API Routes Registration
app.use('/api', healthRouter);
app.use('/api/rules', trafficRuleRouter);
app.use('/api/challans', challanRouter);
app.use('/api/hazards', hazardRouter);
app.use('/api/safety', safetyRouter);
app.use('/api/emergency', emergencyRouter);
app.use('/api/ai', aiRouter);

// 6. 404 Not Found Handler
app.use(notFoundHandler);

// 7. Centralized Error Middleware
app.use(errorHandler);

export default app;
