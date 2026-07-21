const multer = require('multer');

// Store uploads in memory so controllers can send buffers to Supabase Storage.
const storage = multer.memoryStorage();

// File filter (Images only: jpg, jpeg, png)
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true); // Accept file
  } else {
    // Pass a custom error message
    cb(new Error('INVALID_FILE_TYPE'), false); // Reject file
  }
};

// Initialize multer instance
const upload = multer({
  storage,
  limits: {
    fileSize: 2 * 1024 * 1024 // 2MB max file size
  },
  fileFilter
});

// Export single file upload middleware
const uploadSignature = upload.single('signature');

module.exports = { uploadSignature };
