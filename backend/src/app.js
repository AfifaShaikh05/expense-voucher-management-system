const express = require('express');
const cors = require('cors');

// Initialize the Express application
const app = express();

// --- Middlewares ---

const allowedOrigins = (process.env.CORS_ORIGIN || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const isLocalOrigin = (origin) => {
  try {
    const { hostname } = new URL(origin);
    return hostname === 'localhost' || hostname === '127.0.0.1';
  } catch (error) {
    return false;
  }
};

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    if (process.env.NODE_ENV !== 'production' && isLocalOrigin(origin)) {
      return callback(null, true);
    }

    return callback(null, false);
  }
}));

// Parse incoming requests with JSON payloads (replaces body-parser)
app.use(express.json());

// --- Routes ---

// Basic health-check route to verify the server is running
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'Server is running'
  });
});

// Routes
app.use('/api/auth', require('./routes/auth.routes'));

// Other routes will be mounted here later
app.use('/api/vouchers', require('./routes/voucher.routes'));
app.use('/api/director', require('./routes/director.routes'));
app.use('/api/accounts', require('./routes/accounts.routes'));

// --- Error Handling ---
// Must be the LAST middleware added, after all route definitions
const { errorHandler } = require('./middlewares/error.middleware');
app.use(errorHandler);

// Export the app for use in server.js (and testing if needed)
module.exports = app;
