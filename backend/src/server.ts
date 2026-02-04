import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import { config } from './config';
import connectDB from './database';
import { globalErrorHandler, notFound } from './middleware/errorHandler';

// Import routes
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import deviceRoutes from './routes/devices';
import departmentRoutes from './routes/departments';
import assignmentRoutes from './routes/assignments';
import auditLogRoutes from './routes/auditLogs';
import locationRoutes from './routes/locations';
import categoryRoutes from './routes/categories';
import configurationRoutes from './routes/configuration';

const app = express();

// Trust proxy
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: config.security.helmetContentSecurityPolicy,
  crossOriginEmbedderPolicy: false,
}));

// CORS
app.use(cors({
  origin: config.cors.origin,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// Compression
app.use(compression());

// Cookie parsing
app.use(cookieParser());

// Logging
if (config.nodeEnv === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Body parsing with enhanced security
app.use(express.json({ 
  limit: '10mb',
  verify: (req, res, buf) => {
    // Basic JSON bomb protection
    if (buf.length > 10 * 1024 * 1024) { // 10MB
      throw new Error('Request entity too large');
    }
  }
}));
app.use(express.urlencoded({ 
  extended: true, 
  limit: '10mb',
  parameterLimit: 100 // Limit number of parameters
}));

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Asset Guardian API is running',
    timestamp: new Date().toISOString(),
    environment: config.nodeEnv,
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/devices', deviceRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/audit-logs', auditLogRoutes);
app.use('/api/locations', locationRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/configuration', configurationRoutes);

// 404 handler
app.use(notFound);

// Global error handler
app.use(globalErrorHandler);

// Start server
const startServer = async () => {
  try {
    // Connect to database
    await connectDB();

    const PORT = config.port;
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT} in ${config.nodeEnv} mode`);
      console.log(`📋 API Health Check: http://localhost:${PORT}/api/health`);
      
      if (config.nodeEnv === 'development') {
        console.log(`🔧 Frontend should connect to: http://localhost:${PORT}/api`);
      }
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (err: Error) => {
  console.error('🔥 UNHANDLED PROMISE REJECTION:', err.name, err.message);
  console.log('💥 Shutting down...');
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err: Error) => {
  console.error('🔥 UNCAUGHT EXCEPTION:', err.name, err.message);
  console.log('💥 Shutting down...');
  process.exit(1);
});

startServer();

export default app;