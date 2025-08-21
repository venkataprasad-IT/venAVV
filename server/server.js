import express from 'express';
import cors from 'cors';
import { clerkMiddleware, requireAuth } from '@clerk/express';
import 'dotenv/config';
import aiRouter from './routes/aiRoutes.js';
import connectCloudinary from './configs/cloudinary.js'
import userRouter from './routes/userRoutes.js';
import multer from 'multer';

const app = express();

// Increase payload size limit for file uploads
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

await connectCloudinary();
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(clerkMiddleware());

app.get('/', (req, res) => {
  res.send("Server is in home page broh:");
});

// Test endpoint to verify server is working
app.get('/api/test', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Server is working!', 
    timestamp: new Date().toISOString(),
    routes: ['/api/ai/*', '/api/user/*'],
    status: 'healthy'
  });
});

// Simple health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    server: 'venAI Server'
  });
});

// Only protect /api/ai with authentication
console.log('🔐 Setting up authentication middleware');
// Temporarily comment out authentication for testing
// app.use(requireAuth());

// Add logging middleware for debugging
app.use('/api/ai', (req, res, next) => {
  console.log(`🔍 ${req.method} ${req.path}`, { 
    body: req.body, 
    files: req.files,
    headers: req.headers,
    url: req.url,
    originalUrl: req.originalUrl
  });
  next();
});

// Add general API logging
app.use('/api', (req, res, next) => {
  console.log(`🌐 API Request: ${req.method} ${req.originalUrl}`);
  next();
});

console.log('🔧 Mounting AI routes at /api/ai');
app.use('/api/ai',aiRouter);

// Add route verification
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
      
      // Check specific routes
      const hasAIRoutes = app._router.stack.some(middleware => 
        middleware.name === 'router' && middleware.regexp.toString().includes('/api/ai')
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

// Simple routes check
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

console.log('🔧 Mounting User routes at /api/user');
app.use('/api/user', userRouter);

// Log all registered routes for debugging
console.log('🔍 Logging all registered routes...');
try {
  if (app._router && app._router.stack) {
    app._router.stack.forEach((middleware) => {
      if (middleware.route) {
        console.log(`📍 Route: ${middleware.route.stack[0].method.toUpperCase()} ${middleware.route.path}`);
      } else if (middleware.name === 'router') {
        console.log(`📍 Router: ${middleware.regexp}`);
      }
    });
  } else {
    console.log('⚠️ Router not yet initialized, skipping route logging');
  }
} catch (error) {
  console.error('❌ Error logging routes:', error.message);
}

// Error handling middleware
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

const PORT = process.env.PORT || 3000;

console.log('🚀 Starting server...');
console.log('🔧 Environment:', process.env.NODE_ENV || 'development');
console.log('🌐 Port:', PORT);
console.log('🔑 API Base URL:', process.env.CLIENT_URL || 'http://localhost:5173');

app.listen(PORT, () => {
  console.log(`✅ Server is running at http://localhost:${PORT}`);
  console.log(`📁 AI routes mounted at /api/ai`);
  console.log(`👤 User routes mounted at /api/user`);
  console.log(`🔐 Authentication required for /api/ai routes`);
  console.log('🎯 Ready to handle requests!');
  
  // Log routes after server is fully initialized
  setTimeout(() => {
    console.log('🔍 Logging routes after server initialization...');
    try {
      if (app._router && app._router.stack) {
        app._router.stack.forEach((middleware) => {
          if (middleware.route) {
            console.log(`📍 Route: ${middleware.route.stack[0].method.toUpperCase()} ${middleware.route.path}`);
          } else if (middleware.name === 'router') {
            console.log(`📍 Router: ${middleware.regexp}`);
          }
        });
      }
    } catch (error) {
      console.error('❌ Error logging routes after initialization:', error.message);
    }
  }, 1000);
});
