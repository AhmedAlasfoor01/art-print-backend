const express = require('express');
const router = express.Router();
const Order = require('../models/Order');//i forget to import the order model into the routes:fixed
const Product = require('../models/Product');
const verifyToken = require('../middleware/verify-token');

const upload = require('../config/multer');
const cloudinary = require('../config/cloudinary');



router.get('/', async (req, res) => {
  try {
    const products = await Product.find({ userId: req.user._id });
    res.json(products);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});


router.post('/', (req, res) => {
  upload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'images', maxCount: 10 },
  ])(req, res, async (err) => {
    if (err) {
      console.error("UPLOAD ERROR:", err);
      return res.status(400).json({
        error: err.message || JSON.stringify(err) || "Upload failed"
      });
    }

    try {
      const { ProductName, Category, Price, Size, Quantity } = req.body;

      if (!ProductName || !Category || !Price || !Size || !Quantity) {
        return res.status(400).json({
          error: "Missing required fields: ProductName, Category, Price, Size, Quantity"
        });
      }

      if (!req.files || (!req.files['image'] && !req.files['images'])) {
        return res.status(400).json({ error: 'At least one product image is required' });
      }

      const productData = {
        userId: req.user._id,
        ProductName,
        Category,
        Price,
        Size,
        Quantity
      };

      if (req.files['image']) {
        productData.image = {
          url: req.files['image'][0].path,
          cloudinary_id: req.files['image'][0].filename,
        };
      }

      if (req.files['images']) {
        productData.images = req.files['images'].map(file => ({
          url: file.path,
          cloudinary_id: file.filename,
        }));
      }

      const newProduct = new Product(productData);
      const saved = await newProduct.save();

      res.status(201).json(saved);

    } catch (e) {
      console.error("CREATE PRODUCT ERROR:", e);
      res.status(500).json({
        error: e.message || "Failed to create product"
      });
    }
  });
});


// Update product
router.put('/:productId', (req, res) => {
  upload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'images', maxCount: 10 },
  ])(req, res, async (err) => {
    if (err) {
      console.error("UPLOAD ERROR:", err);
      return res.status(400).json({
        error: err.message || JSON.stringify(err) || "Upload failed"
      });
    }

    try {
      const { ProductName, Category, Price, Size, Quantity } = req.body;

      const product = await Product.findById(req.params.productId);
      if (!product) return res.status(404).json({ error: 'Product not found' });

      if (!product.userId.equals(req.user._id)) {
        return res.status(403).json({ error: 'Permission denied' });
      }

      const updateData = { ProductName, Category, Price, Size, Quantity };

      if (req.files && req.files['image']) {
        if (product.image && product.image.cloudinary_id) {
          try {
            await cloudinary.uploader.destroy(product.image.cloudinary_id);
          } catch (cloudinaryErr) {
            console.error('Error deleting old image:', cloudinaryErr);
          }
        }

        updateData.image = {
          url: req.files['image'][0].path,
          cloudinary_id: req.files['image'][0].filename,
        };
      }

      if (req.files && req.files['images']) {
        const newImages = req.files['images'].map(file => ({
          url: file.path,
          cloudinary_id: file.filename,
        }));
        updateData.images = [...(product.images || []), ...newImages];
      }

      const updated = await Product.findByIdAndUpdate(
        req.params.productId,
        updateData,
        { new: true }
      );

      res.json(updated);

    } catch (e) {
      console.error("UPDATE PRODUCT ERROR:", e);
      res.status(500).json({ error: e.message || "Failed to update product" });
    }
  });
});


// Delete a specific image from product's images array
// NOTE: This route must come before /:productId route to avoid route conflicts
router.delete('/:productId/images/:imageId', async (req, res) => {
  try {
    const product = await Product.findById(req.params.productId);
    if (!product) return res.status(404).json({ error: 'Product not found' });

    if (!product.userId.equals(req.user._id)) {
      return res.status(403).json({ error: 'Permission denied' });
    }

    // Find the image to delete
    const imageToDelete = product.images.find(
      img => img.cloudinary_id === req.params.imageId
    );

    if (!imageToDelete) {
      return res.status(404).json({ error: 'Image not found' });
    }

    // Delete image from Cloudinary
    try {
      await cloudinary.uploader.destroy(imageToDelete.cloudinary_id);
    } catch (cloudinaryErr) {
      console.error('Error deleting image from Cloudinary:', cloudinaryErr);
      // Continue even if deletion fails
    }

    // Remove image from array
    product.images = product.images.filter(
      img => img.cloudinary_id !== req.params.imageId
    );
    await product.save();

    res.json({ message: 'Image deleted successfully', product });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete image' });
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
    // FIXED: Changed from product.images > 0 to product.images.length > 0
    if (product.images && product.images.length > 0) {
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