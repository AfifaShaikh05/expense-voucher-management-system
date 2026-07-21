const multer = require('multer');
const fs = require('fs');
const crypto = require('crypto');
const { uploadDir } = require('../config/uploads');

// 1. Ensure the upload directory exists
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// 2. Configure Disk Storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename: {uuid}-{originalname}
    const uniqueId = crypto.randomUUID();
    // Sanitize original filename to remove spaces or weird characters
    const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, '_');
    cb(null, `${uniqueId}-${sanitizedName}`);
  }
});

// 3. File filter (Images only: jpg, jpeg, png)
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true); // Accept file
  } else {
    // Pass a custom error message
    cb(new Error('INVALID_FILE_TYPE'), false); // Reject file
  }
};

// 4. Initialize multer instance
const upload = multer({
  storage,
  limits: {
    fileSize: 2 * 1024 * 1024 // 2MB max file size
  },
  fileFilter
});

// 5. Export single file upload middleware
const uploadSignature = upload.single('signature');

module.exports = { uploadSignature };
