const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
  
  Product:{
    type:mongoose.Schema.Types.ObjectId,
    ref:"Product",//refrencing the product into the order model 
    required:true,

  },
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
        type: String,
        required: true,
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    },
});

const Order = mongoose.model('Order', OrderSchema);
module.exports = Order;