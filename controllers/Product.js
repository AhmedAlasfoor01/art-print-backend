const express = require('express');
const router = express.Router();
const Order = require('../models/Order');//i forget to import the order model into the routes:fixed
const Product = require('../models/Product');
const verifyToken = require('../middleware/verify-token');

const upload = require('../config/multer');
const cloudinary = require('../config/cloudinary');

// Get all products for the logged-in user
router.get('/', async (req, res) => {
  try {
    const Products = await Product.find({ userId: req.user._id });
    res.json(Products);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// Create a new product with image upload
router.post('/', upload.single('image'), async (req, res) => {
  try {
    const { ProductName, Category, Price, Size, Quantity } = req.body;
    
    // Check if image was uploaded
    if (!req.file) {
      return res.status(400).json({ error: 'Product image is required' });
    }

    // Extract image data from Cloudinary response
    const imageData = {
      url: req.file.path,
      cloudinary_id: req.file.filename,

    };

    const newProduct = new Product({
      userId: req.user._id,
      ProductName,
      Category,
      Price,
      Size,
      Quantity,
      image: imageData
    });
    
    const saveProduct = await newProduct.save();
    res.json(saveProduct);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create product' });
  }
});

// Get(select) single product by ID
router.get('/:ProductId', async (req, res) => {
  try {
    const product = await Product.findOne({
      _id: req.params.ProductId,
      userId: req.user._id
    });
    if (!product) {
      return res.status(404).json({ error: 'product not found' });
    }
    res.json(product);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

// Update product by ID with optional image upload
router.put('/:productId', upload.single('image'), async (req, res) => {
  try {
    const { ProductName, Category, Price, Size, Quantity } = req.body;

    const product = await Product.findById(req.params.productId);
    if (!product) return res.status(404).json({ error: 'Product not found' });

    if (!product.userId.equals(req.user._id)) {
      return res.status(403).json({ error: 'Permission denied' });
    }

    const updateData = {
      ProductName,
      Category,
      Price,
      Size,
      Quantity
    };

    // If a new image is uploaded, delete the old one from Cloudinary and update with new image
    if (req.file) {
      // Delete old image from Cloudinary if it exists
      if (product.image && product.image.cloudinary_id) {
        try {
          await cloudinary.uploader.destroy(product.image.cloudinary_id);
        } catch (cloudinaryErr) {
          console.error('Error deleting old image from Cloudinary:', cloudinaryErr);
          // Continue even if deletion fails
        }
      }

      // Add new image data
      updateData.image = {
        url: req.file.path,
        cloudinary_id: req.file.filename,
    
      };
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.productId,
      updateData,
      { new: true }
    );

    res.json(updatedProduct);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update product' });
  }
});

// Delete product by ID and remove image from Cloudinary
router.delete('/:productId', async (req, res) => {
  try {
    const product = await Product.findById(req.params.productId);
    if (!product) return res.status(404).json({ error: 'Product not found' });

    if (!product.userId.equals(req.user._id)) {
      return res.status(403).json({ error: 'Permission denied' });
    }

    // Delete image from Cloudinary if it exists
    if (product.image && product.image.cloudinary_id) {
      try {
        await cloudinary.uploader.destroy(product.image.cloudinary_id);
      } catch (cloudinaryErr) {
        console.error('Error deleting image from Cloudinary:', cloudinaryErr);
        // Continue with product deletion even if image deletion fails
      }
    }

    // Delete all images from the images array if they exist
    if (product.images  > 0) {
      try {
        const deletePromises = product.images
          .filter(img => img.cloudinary_id)
          .map(img => cloudinary.uploader.destroy(img.cloudinary_id));
        await Promise.all(deletePromises);
      } catch (cloudinaryErr) {
        console.error('Error deleting images array from Cloudinary:', cloudinaryErr);
      }
    }

    await product.deleteOne();
    res.json({ message: 'Product deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete product' });
  }
});



module.exports = router;