// server.js
import express from 'express';
import cors from 'cors';
import { clerkMiddleware /*, requireAuth*/ } from '@clerk/express';
import 'dotenv/config';
import aiRouter from './routes/aiRoutes.js';
import connectCloudinary from './configs/cloudinary.js';
import userRouter from './routes/userRoutes.js';
import multer from 'multer';
import serverless from 'serverless-http';

const app = express();

/**
 * Middleware and payload limits
 */
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

/**
 * CORS
 */
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));

/**
 * Clerk middleware
 */
try {
  app.use(clerkMiddleware());
} catch (err) {
  // If Clerk init fails at runtime, log and continue — Clerk might require env vars set in Vercel.
  console.warn('⚠️ Clerk middleware setup failed:', err && err.message ? err.message : err);
}

/**
 * Safe async initialization (Cloudinary etc.)
 * We perform initialization once and await it before handling requests.
 */
let initError = null;
const initPromise = (async () => {
  try {
    if (typeof connectCloudinary === 'function') {
      await connectCloudinary();
      console.log('✅ Cloudinary connected (or connect function executed).');
    } else {
      console.warn('⚠️ connectCloudinary is not a function — skipping Cloudinary init.');
    }
  } catch (err) {
    initError = err;
    console.error('❌ Error during initialization:', err);
    // don't throw here so serverless still starts; we'll surface errors in /api/health or root if desired
  }
})();

/**
 * Root route and health/test endpoints
 */
app.get('/', (req, res) => {
  // Surface init error if present to help debugging on Vercel
  if (initError) {
    return res.status(500).send(`Server initialization error: ${initError.message || String(initError)}`);
  }
  res.send('Server is live 🚀');
});

app.get('/api/test', async (req, res) => {
  // Ensure init done
  await initPromise;
  if (initError) {
    return res.status(500).json({
      success: false,
      message: 'Server initialization failed',
      error: initError.message || String(initError)
    });
  }
  res.json({
    success: true,
    message: 'Server is working!',
    timestamp: new Date().toISOString(),
    routes: ['/api/ai/*', '/api/user/*'],
    status: 'healthy'
  });
});

app.get('/api/health', async (req, res) => {
  await initPromise;
  res.json({
    status: initError ? 'degraded' : 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    server: 'venAI Server',
    initError: initError ? (initError.message || String(initError)) : undefined
  });
});

/**
 * Optional: temporarily disabled auth for easier testing on Vercel
 * Uncomment to protect /api/ai with Clerk auth:
 */
// app.use(requireAuth());

/**
 * Logging middleware for /api/ai
 */
app.use('/api/ai', (req, res, next) => {
  console.log(`🔍 ${req.method} ${req.path}`, {
    body: req.body,
    files: req.files,
    headers: {
      'content-type': req.headers['content-type'],
      // do not log authentication secrets — only show presence
      auth: req.headers.authorization ? '[REDACTED]' : undefined
    },
    url: req.url,
    originalUrl: req.originalUrl
  });
  next();
});

/**
 * General API logging
 */
app.use('/api', (req, res, next) => {
  console.log(`🌐 API Request: ${req.method} ${req.originalUrl}`);
  next();
});

/**
 * Mount routers (keep existing behavior)
 */
console.log('🔧 Mounting AI routes at /api/ai');
app.use('/api/ai', aiRouter);

console.log('🔧 Mounting User routes at /api/user');
app.use('/api/user', userRouter);

/**
 * /api/routes for debugging registered routes (keeps your previous implementation)
 */
app.get('/api/routes', (req, res) => {
  try {
    const routes = [];
    if (app._router && app._router.stack) {
      app._router.stack.forEach((middleware) => {
        if (middleware.route) {
          routes.push(`${middleware.route.stack[0].method.toUpperCase()} ${middleware.route.path}`);
        } else if (middleware.name === 'router') {
          routes.push(`Router: ${middleware.regexp}`);
        }
      });

      const hasAIRoutes = app._router.stack.some(middleware =>
        middleware.name === 'router' && middleware.regexp && middleware.regexp.toString().includes('/api/ai')
      );

      res.json({
        routes,
        count: routes.length,
        hasAIRoutes,
        timestamp: new Date().toISOString(),
        server: 'venAI Server'
      });
    } else {
      res.json({
        routes: [],
        count: 0,
        hasAIRoutes: false,
        timestamp: new Date().toISOString(),
        server: 'venAI Server',
        message: 'Router not yet initialized'
      });
    }
  } catch (error) {
    console.error('Error in /api/routes:', error);
    res.status(500).json({
      error: 'Failed to get routes',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Simple routes check (keeps your list)
 */
app.get('/api/routes-simple', (req, res) => {
  res.json({
    availableEndpoints: [
      'GET /api/test',
      'GET /api/health',
      'GET /api/routes',
      'POST /api/ai/resume-review',
      'POST /api/ai/generate-article',
      'POST /api/ai/generate-blog-title',
      'POST /api/ai/generate-image',
      'POST /api/ai/remove-image-background',
      'POST /api/ai/remove-image-object'
    ],
    count: 9,
    timestamp: new Date().toISOString(),
    server: 'venAI Server'
  });
});

/**
 * Global error handling (keeps your behavior)
 */
app.use((error, req, res, next) => {
  console.error('Global error handler:', error);

  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ success: false, message: 'File too large. Maximum size is 5MB.' });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({ success: false, message: 'Too many files uploaded.' });
    }
  }

  res.status(500).json({ success: false, message: error.message || 'Internal server error' });
});

/**
 * Export serverless handler for Vercel
 *
 * serverless-http wraps the express app for serverless platforms.
 * We ensure initialization promise resolved before delegating to handler.
 */
const wrappedHandler = serverless(app);

export default async function handler(req, res) {
  // ensure async init finished so routes relying on Cloudinary etc. are ready
  await initPromise;

  // If initialization yielded an error, we still forward the request
  // but you may prefer returning 500 for all requests; currently root/health endpoints surface the error.
  return wrappedHandler(req, res);
}
