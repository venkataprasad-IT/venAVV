import express from 'express';
import cors from 'cors';
import { clerkMiddleware } from '@clerk/express';
import 'dotenv/config';
import aiRouter from './routes/aiRoutes.js';
import connectCloudinary from './configs/cloudinary.js';
import userRouter from './routes/userRoutes.js';
import multer from 'multer';

const app = express();

// Increase payload size limit for file uploads
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Connect to Cloudinary inside an async function for Vercel compatibility
(async () => {
  try {
    await connectCloudinary();
    console.log('✅ Cloudinary connected successfully');
  } catch (error) {
    console.error('❌ Failed to connect to Cloudinary:', error.message);
  }
})();

// Enable CORS for frontend
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
  })
);

// Clerk authentication middleware
app.use(clerkMiddleware());

// Default home route
app.get('/', (req, res) => {
  res.send('Server is live 🚀');
});

// Test endpoint
app.get('/api/test', (req, res) => {
  res.json({
    success: true,
    message: 'Server is working!',
    timestamp: new Date().toISOString(),
    routes: ['/api/ai/*', '/api/user/*'],
    status: 'healthy',
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    server: 'venAI Server',
  });
});

// Debug logging for AI routes
app.use('/api/ai', (req, res, next) => {
  console.log(`🔍 ${req.method} ${req.path}`, {
    body: req.body,
    files: req.files,
    headers: req.headers,
  });
  next();
});

// AI Routes
app.use('/api/ai', aiRouter);

// User Routes
app.use('/api/user', userRouter);

// Route discovery endpoint
app.get('/api/routes', (req, res) => {
  try {
    const routes = [];
    app._router.stack.forEach((middleware) => {
      if (middleware.route) {
        routes.push(
          `${middleware.route.stack[0].method.toUpperCase()} ${middleware.route.path}`
        );
      } else if (middleware.name === 'router') {
        routes.push(`Router: ${middleware.regexp}`);
      }
    });

    res.json({
      routes,
      count: routes.length,
      timestamp: new Date().toISOString(),
      server: 'venAI Server',
    });
  } catch (error) {
    console.error('Error in /api/routes:', error);
    res.status(500).json({
      error: 'Failed to get routes',
      message: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

// Simple route listing
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
      'POST /api/ai/remove-image-object',
    ],
    count: 9,
    timestamp: new Date().toISOString(),
    server: 'venAI Server',
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Global error handler:', error);

  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res
        .status(400)
        .json({ success: false, message: 'File too large. Maximum size is 5MB.' });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res
        .status(400)
        .json({ success: false, message: 'Too many files uploaded.' });
    }
  }

  res
    .status(500)
    .json({ success: false, message: error.message || 'Internal server error' });
});

// Set port for local dev, Vercel will handle it automatically
const PORT = process.env.PORT || 3000;

// Start server locally (Vercel will manage deployment automatically)
app.listen(PORT, () => {
  console.log(`✅ Server is running at http://localhost:${PORT}`);
  console.log('📁 AI routes mounted at /api/ai');
  console.log('👤 User routes mounted at /api/user');
  console.log('🎯 Ready to handle requests!');
});

export default app;
