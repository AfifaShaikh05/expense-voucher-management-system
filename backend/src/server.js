// Load environment variables from .env file
require('dotenv').config();

// Import the configured Express app
const app = require('./app');

// Define the port to run on, defaulting to 5000 if not specified in .env
const PORT = process.env.PORT || 5000;

if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET is required in production');
}

// Start the Express server
const server = app.listen(PORT, () => {
  console.log(`Server is up and running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
});

// Optional: Handle unhandled promise rejections gracefully
// This ensures the app doesn't crash silently and logs the error properly.
process.on('unhandledRejection', (err) => {
  console.error(`Unhandled Rejection: ${err.message}`);
  // In a production app, we would close the server and exit the process here
  // server.close(() => process.exit(1));
});
