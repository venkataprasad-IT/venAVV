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

// Connect to Cloudinary
await connectCloudinary();

// Enable CORS for frontend
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true
  })
);

// Clerk authentication middleware
app.use(clerkMiddleware());

// Home route
app.get('/', (req, res) => {
  res.send('Server is live 🚀');
});

// Test endpoint
app.get('/api/test', (req, res) => {
  res.json({
    success: true,
    message: 'Server is working!',
    timestamp: new Date().toISOString()
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    timestamp: new Date().toISOString()
  });
});

// AI Routes
app.use('/api/ai', aiRouter);

// User Routes
app.use('/api/user', userRouter);

// Global error handler
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

// Use Vercel's PORT or fallback to 3000 for local
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`✅ Server is running at http://localhost:${PORT}`);
});
