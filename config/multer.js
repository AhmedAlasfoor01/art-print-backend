const multer = require('multer')
const { CloudinaryStorage } = require('multer-storage-cloudinary')
const cloudinary = require('./cloudinary')
//Multer = Handles file uploads from the user's browser to your server
const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => ({
    folder: "marketplace-listings",
    resource_type: "image",
    format: "webp", // store as webp (smaller)
    transformation: [
      { width: 900, height: 900, crop: "limit" }, 
      { quality: "auto" }, 
      { fetch_format: "auto" }, 
    ],
  }),
});

module.exports = multer({ storage });