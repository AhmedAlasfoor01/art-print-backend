const mongoose = require('mongoose');
//the model of the image embeded whenever i need the image it will embde the image from here
const imageSchema = new mongoose.Schema({
  url: { 
    type: String, 
    required: true 
  },
  cloudinary_id: { 
    type: String, 
    required: true 
  },

}, { _id: false }); 
//the model of the product 
const ProductSchema = new mongoose.Schema({
    ProductName: {
        type: String,
        required: true,
    },
   Category: {
        type: String,
        required: true,
    },
  Price: {
        type: Number,
        required: true,
    },
    Size: {
        type: Number,
        required: true,
    },
    Quantity: {
        type: Number,
        required: true,
    },
  
 
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    },
      image: {
    type: imageSchema,  //  Using the imageSchema from above
    required: [true, 'Product image is required']
  },
  
  images: [imageSchema],  // Array of images using imageSchema because it embeded
  
  inStock: {
    type: Boolean,
    default: true
  },
  tags: [String],
  
 
}, {
  timestamps: true
});




const Product = mongoose.model('Product', ProductSchema);
module.exports = Product;