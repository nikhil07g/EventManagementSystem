const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

// Enhanced CORS configuration to support multiple dev origins and production
const DEFAULT_ALLOWED_ORIGINS = [
  /^https?:\/\/localhost(:\d+)?$/,
  /^https?:\/\/127\.0\.0\.1(:\d+)?$/,
  /^https?:\/\/10\./,
  /^https?:\/\/192\.168\./,
  /^https:\/\/.*\.onrender\.com$/,  // Allow Render.com domains
];

const extraAllowedOrigins = (process.env.CORS_ALLOWED_ORIGINS || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, Postman)
    if (!origin) {
      return callback(null, true);
    }

    const isDefaultAllowed = DEFAULT_ALLOWED_ORIGINS.some((pattern) => pattern.test(origin));
    const isExplicitlyAllowed = extraAllowedOrigins.includes(origin);

    if (isDefaultAllowed || isExplicitlyAllowed) {
      return callback(null, true);
    }

    console.warn(`⚠️ CORS blocked from origin: ${origin}`);
    return callback(new Error(`CORS blocked from origin: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

const PORT = process.env.PORT || 4000;
const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI;

if (!MONGO_URI) {
  console.warn('MONGODB_URI not set. Set MONGODB_URI in .env or environment to connect to MongoDB.');
}

// Connect to MongoDB
mongoose
  .connect(MONGO_URI || 'mongodb://localhost:27017/ad-a-venue', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 10000,
  })
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err.message);
    console.error('Full error:', err);
  });

// Routes
const eventsRouter = require('./routes/events');
const bookingsRouter = require('./routes/bookings');
const authRouter = require('./routes/auth');

app.use('/api/events', eventsRouter);
app.use('/api/bookings', bookingsRouter);
app.use('/api/auth', authRouter);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`✅ Server listening on port ${PORT}`);
  console.log(`Health endpoint: http://localhost:${PORT}/api/health`);
});

// Global error handlers
process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});

