const express = require('express');
const router = express.Router();
const upload = require('../config/multer')
const cloudinary = require('../config/cloudinary');


const Product= require('../models/Product');

// Get all orders for the logged-in user
router.get('/', async (req, res) => { // I haved deleted the router.get for the report because this route is gonna get the order and if the customer doen't have any order it will show res.status(500)
  try {
    const orders = await order.find({ userId: req.user._id });
    res.json(order);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// Create a new order
exports.createorder = async (req, res) => {
  try {
    const { items, shippingAddress} = req.body;
    
    // Calculate total amount
    let totalAmount = 0;
    const orderItems = [];

    for (const item of items) {
      const product = await Product.findById(item.productId);
      
      if (!product) {
        return res.status(404).json({
          success: false,
          error: `Product ${item.productId} not found`
        });
      }

      // Check stock
      if (product.Quantity < item.quantity) {
        return res.status(400).json({
          success: false,
          error: `Not enough stock for ${product.ProductName}`//we use the dollard sign to embed the ProductName
        });
      }

      orderItems.push({
        product: product._id,
        quantity: item.quantity,
        size: item.size,
        price: product.Price
      });

      totalAmount += product.Price * item.quantity;

      // Update product quantity
      product.Quantity -= item.quantity;
      await product.save();
    }

    // Create order
    const order = await order.create({
      user: req.user.userId, 
      items: orderItems,
      totalAmount,
      shippingAddress,
      
    });

    // Populate product details before sending response
    const populatedorder = await order.findById(order._id)
      .populate('user', ) // Populate user info
      .populate('items.product'); // Populate product details

    res.status(201).json({
      success: true,
      data: populatedorder
    });

  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// Get all orders for logged-in user
exports.getUserorders = async (req, res) => {
  try {
    const orders = await order.find({ user: req.user.userId })
      .populate('items.product') // Populate product details
      

    res.json({
      success: true,
      count: orders.length,
      data: orders
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Get single order by ID
exports.getorderById = async (req, res) => {
  try {
    const order = await order.findById(req.params.id)
      .populate('user' ) // Populate user with specific fields
      .populate({
        path: 'items.product',
        select: 'ProductName Category Price image' // ⬅️ Select specific fields
      });

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'order not found'
      });
    }

    // Check if user owns this order
    if (!order) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to view this order'
      });
    }

    res.json({
      success: true,
      data: order
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Get all orders (Admin only)
exports.getAllorders = async (req, res) => {
  try {
    const orders = await order.find()
      .populate('user')
      .populate({
        path: 'items.product',
        select: 'ProductName Price image Category'
      })
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: orders.length,
      data: orders
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Update order status (Admin only)
exports.updateorderStatus = async (req, res) => {
  try {
    const { orderStatus, paymentStatus } = req.body;

    const order = await order.findByIdAndUpdate(
      req.params.id,
      { orderStatus, paymentStatus },
      { new: true, runValidators: true }
    )
      .populate('user')
      .populate('items.product');

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'order not found'
      });
    }

    res.json({
      success: true,
      data: order
    });

  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// Cancel order
exports.cancelorder = async (req, res) => {
  try {
    const order = await order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'order not found'
      });
    }

    // Check if user owns this order
    if (order.user.toString() !== req.user.userId) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized'
      });
    }

    // Can only cancel if not shipped
    if (order.orderStatus === 'shipped' || order.orderStatus === 'delivered') {
      return res.status(400).json({
        success: false,
        error: 'Cannot cancel shipped or delivered orders'
      });
    }

    // Restore product quantities
    for (const item of order.items) {
      const product = await Product.findById(item.product);
      if (product) {
        product.Quantity += item.quantity;
        await product.save();
      }
    }

    order.orderStatus = 'cancelled';
    await order.save();

    const populatedorder = await order.findById(order._id)
      .populate('user')
      .populate('items.product');

    res.json({
      success: true,
      message: 'order cancelled successfully',
      data: populatedorder
    });

  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};



module.exports = router;


