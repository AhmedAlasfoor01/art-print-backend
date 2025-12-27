const multer = require('multer')
const { CloudinaryStorage } = require('multer-storage-cloudinary')
const cloudinary = require('./cloudinary')

const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => ({
    folder: "marketplace-listings",
    resource_type: "image",
    format: "webp", 
    transformation: [
      { width: 900, height: 900, crop: "limit" }, 
      { quality: "auto" }, 
      { fetch_format: "auto" }, 
    ],
  }),
});

module.exports = multer({ storage });



