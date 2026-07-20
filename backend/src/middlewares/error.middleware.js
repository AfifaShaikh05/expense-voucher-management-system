const multer = require('multer');

/**
 * Centralized error handling middleware for Express.
 * Catches errors thrown or passed to next(err) and formats them into a standardized JSON response.
 */
const errorHandler = (err, req, res, next) => {
  // Intercept Multer specific errors (e.g. file too large)
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'File is too large. Max size allowed is 2MB.' });
    }
    return res.status(400).json({ message: `Upload error: ${err.message}` });
  }

  // Intercept our custom file type error from the Multer fileFilter
  if (err.message === 'INVALID_FILE_TYPE') {
    return res.status(400).json({ message: 'Invalid file type. Only JPEG, JPG, and PNG are allowed.' });
  }

  // Log the full error stack to the console for internal debugging
  console.error(err.stack);

  // Determine the status code: use err.statusCode if present, otherwise default to 500
  const statusCode = err.statusCode || 500;

  // Determine the error message
  const message = err.message || 'Internal Server Error';

  // Return a clean JSON response (never leak the stack trace to the client in production)
  res.status(statusCode).json({
    message
  });
};

module.exports = { errorHandler };
