

const express = require('express');
const router = express.Router();
const Order = require('../models/Order');//fixed the error importing the order model 
const Product = require('../models/Product');

// Get all orders for the logged-in user
router.get('/', async (req, res) => {
  try {

    const orders = await Order.find({ userId: req.user._id })
      .populate('Product'); // Populate product details
    res.json(orders);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// Create a new order for a single product
router.post('/:productId', async (req, res) => {//ptoduct id id the id that the mongoosedb gives the id to define the product 
  try {
    const { Quantity, Status } = req.body;
    const { productId } = req.params;

   
    if (!Quantity || Status === undefined) {
      return res.status(400).json({ error: 'Quantity and Status are required' });
    }

    // Find the product
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Check if there's enough stock
    if (product.Quantity < Quantity) {
      return res.status(400).json({ 
        error: `Not enough stock. Available: ${product.Quantity}, Requested: ${Quantity}` 
      });
    }

    
    
    const OrderDate = new Date();

    // Create the order
 
    const newOrder = new Order({
      Product: productId, 
      OrderDate: OrderDate, 
      Quantity: Quantity, 
      Status: Status, 
      ProductName: product.ProductName, 
      userId: req.user._id 
    });

    const savedOrder = await newOrder.save();

    // Populate product details before sending response
    const populatedOrder = await Order.findById(savedOrder._id)
      .populate('Product')
      .populate('userId');

    res.status(201).json(populatedOrder);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

// Get single order by ID
router.get('/:orderId', async (req, res) => {
  try {
  
    const order = await Order.findById(req.params.orderId)
      .populate('Product')
      .populate('userId');
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Check if user owns this order
 
    if (!order.userId.equals(req.user._id)) {
      return res.status(403).json({ error: 'Not authorized to view this order' });
    }

    res.json(order);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});


module.exports = router;