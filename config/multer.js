const multer = require('multer')
const { CloudinaryStorage } = require('multer-storage-cloudinary')
const cloudinary = require('./cloudinary')
//Multer = Handles file uploads from the user's browser to your server
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'marketplace-listings',
    allowed_formats: ['jpg', 'jpeg', 'png']
  }
})

module.exports = multer({ storage: storage })