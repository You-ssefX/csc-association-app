// /backend/middleware/uploadMiddleware.js

const multer = require('multer');
const path = require('path');
const fs = require('fs');

/**
 * Ensures that a directory exists.
 * Creates the directory recursively if it doesn't exist.
 * @param {string} dir - The directory path.
 */
const ensureDirExists = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

/**
 * File filter for images only.
 * Only accepts files with mimetypes and extensions "jpeg", "jpg", or "png".
 * @param {Object} req - The request object.
 * @param {Object} file - The file object being uploaded.
 * @param {function} cb - The callback function.
 */
const fileFilter = (req, file, cb) => {
  // Extensions et types autorisés : images + vidéos
  const allowedTypes = /jpeg|jpg|png|mp4|mov|avi|mkv/;

  // Vérifie que le type mime et l'extension du fichier sont dans la liste autorisée
  const isValidMimeType = allowedTypes.test(file.mimetype.toLowerCase());
  const isValidExt = allowedTypes.test(path.extname(file.originalname).toLowerCase());

  if (isValidMimeType && isValidExt) {
    cb(null, true); // fichier accepté
  } else {
    cb(new Error('Seules les images (JPG, PNG) et vidéos (MP4, MOV, AVI, MKV) sont autorisées'));
  }
};

/**
 * Helper function to create multer disk storage configurations.
 * @param {string} destinationPath - The directory where files will be stored.
 * @returns {Object} - Multer disk storage configuration.
 */
const createStorage = (destinationPath) =>
  multer.diskStorage({
    destination: (req, file, cb) => {
      ensureDirExists(destinationPath);
      cb(null, destinationPath);
    },
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname);
      // Create a unique filename using current timestamp and a random number.
      const filename = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
      cb(null, filename);
    },
  });

// Create storage configurations for profile pictures and notification images.
const profileStorage = createStorage(path.join(__dirname, '../uploads/profile-pictures')); // Use path.join for robustness
const notificationStorage = createStorage(path.join(__dirname, '../uploads/notification-images')); // Use path.join for robustness

/**
 * Multer middleware instances to handle file uploads:
 * - profileUpload: for profile picture uploads (max 5MB)
 * - notificationUpload: for notification images (max 50MB)
 */
const profileUpload = multer({
  storage: profileStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // <-- INCREASED TO 10MB! (10 * 1024 * 1024 bytes)
  fileFilter,
});

const notificationUpload = multer({
  storage: notificationStorage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit (already set to 50MB)
  fileFilter,
});

module.exports = {
  profileUpload,
  notificationUpload,
};