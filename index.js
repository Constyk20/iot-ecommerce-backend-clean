require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

const app = express();

// Connect to MongoDB
connectDB();

// ========================================
// CORS Configuration - More Permissive for Development
// ========================================
const corsOptions = {
  origin: '*', // Allow all origins (restrict in production)
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'x-auth-token', 'Authorization'],
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

// Handle preflight requests - FIX: Use regex instead of '*'
app.use((req, res, next) => {
  if (req.method === 'OPTIONS') {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, x-auth-token, Authorization');
    res.header('Access-Control-Allow-Credentials', 'true');
    return res.status(200).json({});
  }
  next();
});

// ========================================
// Request Logging Middleware (Debug)
// ========================================
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  console.log('Headers:', req.headers);
  if (req.body && Object.keys(req.body).length > 0) {
    console.log('Body:', req.body);
  }
  next();
});

// ========================================
// Body Parser Middleware
// ========================================
// IMPORTANT: Webhook route needs raw body, so it comes first
// Webhook MUST come BEFORE express.json() — raw body needed for Stripe
app.post('/webhook', 
  express.raw({ type: 'application/json' }), 
  require('./webhook')
);

// Now add JSON and URL-encoded parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ========================================
// API Routes
// ========================================
app.use('/api/auth', require('./routes/auth'));
app.use('/api/products', require('./routes/products'));
app.use('/api/subscription', require('./routes/subscription'));
app.use('/api/iot', require('./routes/iot'));

// Backward compatibility - devices route
app.use('/api/devices', require('./routes/iot'));

// ========================================
// Health Check & Info Routes
// ========================================
app.get('/', (req, res) => {
  res.json({ 
    message: '🚀 IoT eCommerce Backend is LIVE!',
    status: 'running',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      products: '/api/products',
      subscription: '/api/subscription',
      devices: '/api/iot',
      webhook: '/webhook'
    },
    timestamp: new Date().toISOString()
  });
});

// API status endpoint
app.get('/api', (req, res) => {
  res.json({ 
    status: 'ok',
    message: 'API is working',
    availableRoutes: [
      'POST /api/auth/register',
      'POST /api/auth/login',
      'GET /api/auth/validate',
      'GET /api/products',
      'GET /api/subscription/status',
      'POST /api/subscription/create-checkout',
      'GET /api/iot/devices',
      'POST /api/iot/device',
      'POST /api/iot/control'
    ]
  });
});

// Test route for debugging
app.post('/api/test', (req, res) => {
  res.json({
    message: 'Test endpoint working',
    receivedBody: req.body,
    receivedHeaders: req.headers
  });
});

// ========================================
// 404 Handler - Catch all undefined routes
// ========================================
app.use((req, res, next) => {
  console.log(`❌ 404 - Route not found: ${req.method} ${req.path}`);
  res.status(404).json({ 
    msg: 'Route not found',
    message: `Cannot ${req.method} ${req.path}`,
    availableEndpoints: [
      'GET /',
      'GET /api',
      'POST /api/auth/register',
      'POST /api/auth/login',
      'GET /api/products',
      'GET /api/subscription/status',
      'GET /api/iot/devices'
    ]
  });
});

// ========================================
// Global Error Handler
// ========================================
app.use((err, req, res, next) => {
  console.error('❌ Error occurred:');
  console.error('Path:', req.path);
  console.error('Method:', req.method);
  console.error('Error:', err);
  console.error('Stack:', err.stack);

  // Don't leak error details in production
  const isDevelopment = process.env.NODE_ENV !== 'production';

  res.status(err.status || 500).json({
    msg: 'Server error',
    message: isDevelopment ? err.message : 'An error occurred',
    ...(isDevelopment && { 
      error: err.message,
      stack: err.stack,
      path: req.path
    })
  });
});

// ========================================
// Start Server
// ========================================
const PORT = process.env.PORT || 5000;

app.listen(PORT, '0.0.0.0', () => {
  console.log('='.repeat(50));
  console.log('🚀 IoT eCommerce Backend Server Started!');
  console.log('='.repeat(50));
  console.log(`📍 Port: ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Local: http://localhost:${PORT}`);
  
  if (process.env.RENDER_EXTERNAL_URL) {
    console.log(`🔗 External: ${process.env.RENDER_EXTERNAL_URL}`);
  } else {
    console.log(`🔗 External: https://your-app.onrender.com`);
  }
  
  console.log('='.repeat(50));
  console.log('📡 Available Routes:');
  console.log('   GET  / (Health check)');
  console.log('   GET  /api (API status)');
  console.log('   POST /api/auth/register');
  console.log('   POST /api/auth/login');
  console.log('   GET  /api/auth/validate');
  console.log('   GET  /api/products');
  console.log('   GET  /api/subscription/status');
  console.log('   POST /api/subscription/create-checkout');
  console.log('   GET  /api/iot/devices');
  console.log('   POST /api/iot/device');
  console.log('   POST /api/iot/control');
  console.log('='.repeat(50));
  console.log('💡 MQTT Simulator Active');
  console.log('   → Check console when controlling devices');
  console.log('='.repeat(50));
});

// ========================================
// Graceful Shutdown
// ========================================
process.on('SIGTERM', () => {
  console.log('⚠️  SIGTERM signal received: closing HTTP server');
  app.close(() => {
    console.log('✅ HTTP server closed');
    process.exit(0);
  });
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise);
  console.error('Reason:', reason);
  // Don't exit in production, just log
});

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  console.error('Stack:', error.stack);
  // Exit gracefully
  process.exit(1);
});

module.exports = app;