const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
  
    OrderDate: {
        type: Date,
        required: true,
    },
  Quantity: {
        type: Number,
        required: true,
    },
    Status: {
        type: Number,
        required: true,
    },
    ProductName: {//so the order will be list the proudts name 
        type: Number,
        required: true,
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    },
});

const Order = mongoose.model('Order', OrderSchema);
module.exports = Order;