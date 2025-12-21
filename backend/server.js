const express = require('express');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const cors = require('cors');
const crypto = require('crypto');
require('dotenv').config();

const { supabase, supabaseAdmin } = require('./config/supabase');

const app = express();

// Trust proxy - required for rate limiting behind proxies/load balancers
app.set('trust proxy', 1);

// ============================================
// SECURITY & PERFORMANCE MIDDLEWARE
// ============================================

// Security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

// Gzip compression
app.use(compression({
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  },
  level: 6, // Balance between compression and CPU
  threshold: 1024, // Only compress responses > 1KB
}));

// CORS with credentials
const corsOrigin = process.env.NODE_ENV === 'production' 
  ? process.env.CLIENT_URL 
  : (process.env.CLIENT_URL || 'http://localhost:3000');

if (process.env.NODE_ENV === 'production' && !corsOrigin) {
  console.error('FATAL: CLIENT_URL must be set in production');
  process.exit(1);
}

app.use(cors({
  origin: corsOrigin,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Body parser with limits
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ============================================
// RATE LIMITING
// ============================================

// General API rate limit: 100 requests per 15 minutes
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      error: 'Too many requests',
      message: 'Please slow down and try again later.',
      retryAfter: req.rateLimit.resetTime
    });
  }
});

// Auth endpoints: stricter rate limit (5 per 15 minutes)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  skipSuccessfulRequests: true,
});

// Search endpoints: moderate limit (30 per minute)
const searchLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
});

app.use('/api/', apiLimiter);
app.use('/api/auth', authLimiter);
app.use('/api/search', searchLimiter);

// ============================================
// REQUEST LOGGING & MONITORING
// ============================================

// Performance monitoring middleware
app.use((req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    
    // Log slow requests (> 1 second)
    if (duration > 1000) {
      console.warn(`[SLOW REQUEST] ${req.method} ${req.path} took ${duration}ms`);
    }
    
    // Log errors
    if (res.statusCode >= 500) {
      console.error(`[ERROR] ${req.method} ${req.path} - Status: ${res.statusCode}`);
    }
  });
  
  next();
});

// Request ID for tracing
app.use((req, res, next) => {
  req.id = crypto.randomBytes(8).toString('hex');
  res.setHeader('X-Request-ID', req.id);
  next();
});

// ============================================
// HEALTH CHECK & MONITORING
// ============================================

app.get('/health', async (req, res) => {
  try {
    // Check Supabase connection
    const { data, error } = await supabase
      .from('profiles')
      .select('count')
      .limit(1)
      .single();
    
    if (error && error.code !== 'PGRST116') {
      throw error;
    }
    
    const memUsage = process.memoryUsage();
    res.json({
      success: true,
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV,
      database: 'connected',
      memory: {
        used: Math.round(memUsage.heapUsed / 1024 / 1024),
        total: Math.round(memUsage.heapTotal / 1024 / 1024),
        rss: Math.round(memUsage.rss / 1024 / 1024)
      },
      services: {
        auth: 'operational',
        database: 'connected',
        ai: process.env.OPENAI_API_KEY ? 'configured' : 'not_configured'
      }
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message,
      services: {
        database: 'disconnected'
      }
    });
  }
});

// Metrics endpoint
app.get('/metrics', (req, res) => {
  const mem = process.memoryUsage();
  
  res.json({
    uptime: process.uptime(),
    memory: {
      rss: Math.round(mem.rss / 1024 / 1024),
      heapTotal: Math.round(mem.heapTotal / 1024 / 1024),
      heapUsed: Math.round(mem.heapUsed / 1024 / 1024),
      external: Math.round(mem.external / 1024 / 1024),
    },
    cpu: process.cpuUsage(),
    platform: process.platform,
    nodeVersion: process.version,
  });
});

// API Documentation endpoint
app.get('/api/docs', (req, res) => {
  res.json({
    success: true,
    title: 'Book Club API Documentation',
    version: '2.0.0',
    baseUrl: process.env.API_URL || 'http://localhost:' + (process.env.PORT || 5000),
    database: 'Supabase (PostgreSQL)',
    authentication: {
      type: 'Bearer Token (JWT)',
      location: 'Authorization header',
      example: 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      description: 'Obtain token from /api/auth/login endpoint'
    },
    endpoints: {
      system: {
        health: { method: 'GET', path: '/health', description: 'Server health check with service status', auth: false },
        metrics: { method: 'GET', path: '/metrics', description: 'Performance metrics and resource usage', auth: false },
        docs: { method: 'GET', path: '/api/docs', description: 'This documentation', auth: false }
      },
      authentication: {
        register: { method: 'POST', path: '/api/auth/register', description: 'Create new user account', auth: false },
        login: { method: 'POST', path: '/api/auth/login', description: 'Authenticate and get JWT token', auth: false },
        logout: { method: 'POST', path: '/api/auth/logout', description: 'Invalidate current session', auth: true },
        profile: { method: 'GET', path: '/api/auth/profile', description: 'Get authenticated user profile', auth: true }
      },
      books: {
        list: { method: 'GET', path: '/api/books', description: 'List all books', auth: false, query: ['page', 'limit', 'search', 'genre'] },
        get: { method: 'GET', path: '/api/books/:id', description: 'Get book details', auth: false },
        reviews: { method: 'GET', path: '/api/books/:id/reviews', description: 'Get book reviews', auth: false }
      },
      booklist: {
        myList: { method: 'GET', path: '/api/booklist/my-booklist', description: 'Get user\'s personal reading list', auth: true },
        addBook: { method: 'POST', path: '/api/booklist/add', description: 'Add book to reading list', auth: true },
        updateStatus: { method: 'PUT', path: '/api/booklist/:bookId', description: 'Update book reading status', auth: true },
        removeBook: { method: 'DELETE', path: '/api/booklist/:bookId', description: 'Remove book from list', auth: true }
      },
      diary: {
        entries: { method: 'GET', path: '/api/diary', description: 'List reading diary entries', auth: true },
        create: { method: 'POST', path: '/api/diary', description: 'Create new diary entry', auth: true },
        update: { method: 'PUT', path: '/api/diary/:id', description: 'Update diary entry', auth: true }
      },
      challenges: {
        list: { method: 'GET', path: '/api/challenges', description: 'List active reading challenges', auth: false },
        join: { method: 'POST', path: '/api/challenges/:id/join', description: 'Join a challenge', auth: true },
        progress: { method: 'GET', path: '/api/challenges/:id/progress', description: 'Get challenge progress', auth: true }
      },
      achievements: {
        catalog: { method: 'GET', path: '/api/achievements/catalog', description: 'List all achievements', auth: false },
        userAchievements: { method: 'GET', path: '/api/achievements/my-achievements', description: 'Get user achievements', auth: true }
      },
      streaks: {
        current: { method: 'GET', path: '/api/streaks/my-streak', description: 'Get current reading streak', auth: true },
        update: { method: 'POST', path: '/api/streaks/update', description: 'Update reading streak', auth: true }
      },
      goals: {
        list: { method: 'GET', path: '/api/reading-goals', description: 'List reading goals', auth: true },
        create: { method: 'POST', path: '/api/reading-goals', description: 'Create reading goal', auth: true }
      },
      characters: {
        list: { method: 'GET', path: '/api/prebuilt-characters', description: 'List prebuilt AI characters', auth: false },
        chat: { method: 'POST', path: '/api/prebuilt-characters/:id/chat', description: 'Chat with AI character', auth: true }
      }
    },
    errorHandling: {
      validationError: { code: 'validation_error', status: 400, description: 'Request validation failed' },
      authError: { code: 'auth_error', status: 401, description: 'Authentication required or failed' },
      databaseError: { code: 'database_error', status: 400, description: 'Database operation failed' },
      notFoundError: { code: 'not_found', status: 404, description: 'Resource not found' },
      serverError: { code: 'internal_error', status: 500, description: 'Internal server error' }
    },
    rateLimit: {
      general: '100 requests per 15 minutes',
      auth: '5 attempts per 15 minutes',
      search: '30 requests per minute'
    },
    security: {
      https: process.env.NODE_ENV === 'production',
      csrfProtection: 'Supabase JWT-based',
      corsOrigins: process.env.CLIENT_URL || '*',
      requestIdTracking: 'X-Request-ID header',
      secureCookie: process.env.NODE_ENV === 'production'
    },
    contactInfo: {
      support: 'support@bookclub.example.com',
      issues: 'github.com/your-org/book-club/issues'
    }
  });
});

// ============================================
// ROUTES
// ============================================

// Root route
app.get('/', (req, res) => {
  res.json({
    success: true,
    status: 'running',
    message: 'Book Club API with Supabase',
    version: '2.0.0',
    database: 'Supabase (PostgreSQL)',
    documentation: '/api/docs',
    quickStart: {
      docs: 'GET /api/docs',
      register: 'POST /api/auth/register',
      login: 'POST /api/auth/login',
      books: 'GET /api/books',
      health: 'GET /health'
    }
  });
});

// Auth routes (Supabase-optimized)
const authRoutes = require('./routes/auth.supabase');
app.use('/api/auth', authRoutes);

// Booklist routes
const booklistRoutes = require('./routes/booklist');
app.use('/api/booklist', booklistRoutes);

// Books routes (Supabase-optimized)
const booksRoutes = require('./routes/books');
app.use('/api/books', booksRoutes);

// Diary routes
const diaryRoutes = require('./routes/diary');
app.use('/api/diary', diaryRoutes);

// Fine-tune routes (AI Character/Author Chat)
const fineTuneRoutes = require('./routes/fineTune');
app.use('/api/fine-tune', fineTuneRoutes);

// Pre-built Characters routes
const prebuiltCharactersRoutes = require('./routes/prebuiltCharacters');
app.use('/api/prebuilt-characters', prebuiltCharactersRoutes);

// Reading Goals routes
const readingGoalsRoutes = require('./routes/readingGoals');
app.use('/api/reading-goals', readingGoalsRoutes);

// Challenges routes
const challengesRoutes = require('./routes/challenges');
app.use('/api/challenges', challengesRoutes);

// Achievements routes
const achievementsRoutes = require('./routes/achievements');
app.use('/api/achievements', achievementsRoutes);

// Streaks routes
const streaksRoutes = require('./routes/streaks');
app.use('/api/streaks', streaksRoutes);

// ============================================
// ERROR HANDLING
// ============================================

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'not_found',
    message: `Endpoint not found`,
    details: {
      method: req.method,
      path: req.path,
      hint: 'Check the API documentation for valid endpoints'
    },
    requestId: req.id
  });
});

// Global error handler
app.use((err, req, res, next) => {
  const errorId = req.id;
  const errorMessage = err.message || 'Internal Server Error';
  const showDetails = process.env.NODE_ENV !== 'production';
  
  // Log error internally (sanitized - no sensitive data)
  console.error(`[ERROR ${errorId}]`, {
    message: errorMessage,
    status: err.status || 500,
    method: req.method,
    path: req.path
  });
  
  // Supabase errors
  if (err.code) {
    return res.status(400).json({
      success: false,
      error: 'database_error',
      message: showDetails ? errorMessage : 'A database error occurred',
      ...(showDetails && { code: err.code }),
      requestId: errorId,
      help: 'If this problem persists, please contact support'
    });
  }
  
  // Validation errors
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      error: 'validation_error',
      message: errorMessage,
      requestId: errorId,
      details: err.details || []
    });
  }
  
  // Default error - never expose internal details in production
  res.status(err.status || 500).json({
    success: false,
    error: 'internal_error',
    message: showDetails ? errorMessage : 'An unexpected error occurred',
    requestId: errorId,
    ...(showDetails && { stack: err.stack }),
    help: 'Please reference the requestId in support communications'
  });
});

// ============================================
// GRACEFUL SHUTDOWN
// ============================================

const server = app.listen(process.env.PORT || 5000, () => {
  console.log(`🚀 Server running on port ${process.env.PORT || 5000}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔒 Security: Helmet enabled`);
  console.log(`⚡ Compression: Enabled`);
  console.log(`🛡️  Rate limiting: Active`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, closing server gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, closing server gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

module.exports = app;
