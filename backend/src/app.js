const express = require('express');
const cors = require('cors');

// Initialize the Express application
const app = express();

// --- Middlewares ---

// Enable Cross-Origin Resource Sharing (CORS) for all origins during development
app.use(cors());

// Parse incoming requests with JSON payloads (replaces body-parser)
app.use(express.json());

// Serve uploaded files statically so they can be accessed via URL (e.g., http://localhost:5000/uploads/...)
app.use('/uploads', express.static(require('path').join(__dirname, '../uploads')));

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
