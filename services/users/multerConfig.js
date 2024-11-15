const multer = require("multer");
const path = require("path");

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "/uploads"); // Folder to store files
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

// File upload filter (optional)
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed!"), false);
  }
};

// Set up multer middleware
const upload = multer({
  storage,
  fileFilter,
}).fields([
  { name: "profileImage", maxCount: 1 },
  { name: "profileBackground", maxCount: 1 },
]);

module.exports = upload;
