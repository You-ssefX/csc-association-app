// /backend/utils/multer.js

/**
 * Multer configuration for handling image uploads.
 *
 * Files are stored in the 'uploads/' directory with a unique filename composed of
 * a timestamp and the original file name. Only files with .jpeg, .jpg, or .png extensions
 * are accepted.
 */

const multer = require('multer');
const path = require('path');

// Regular expression to check allowed file extensions.
const allowedFileTypes = /jpeg|jpg|png/;

// Configure storage settings for multer.
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Ensure that the 'uploads/' directory exists.
    // It's good practice to make this more specific for different types of uploads
    // For profile pictures, you might want 'uploads/profile-pictures/'
    cb(null, 'uploads/'); // <-- For profile pics, consider 'uploads/profile-pictures/'
  },
  filename: (req, file, cb) => {
    // Create a unique file name using the current timestamp and original file name.
    const uniqueName = `<span class="math-inline">\{Date\.now\(\)\}\-</span>{file.originalname}`;
    cb(null, uniqueName);
  },
});

// File filter function to only accept images (JPEG or PNG).
const fileFilter = (req, file, cb) => {
  const fileExtension = path.extname(file.originalname).toLowerCase();
  if (allowedFileTypes.test(fileExtension)) {
    // Accept the file.
    cb(null, true);
  } else {
    // Reject the file with an error.
    cb(new Error('Only JPG and PNG images are allowed'), false);
  }
};

// Create the multer instance with storage and file filtering options.
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 1024 * 1024 * 5 // Set file size limit to 5MB (5 * 1024 * 1024 bytes)
                              // Adjust this value as needed (e.g., 10 for 10MB)
  },
});

module.exports = upload;