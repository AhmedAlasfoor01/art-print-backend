const dotenv = require('dotenv');
const path = require('path');

dotenv.config();
const express = require('express');

const app = express();
const mongoose = require('mongoose');//for the database 
const cors = require('cors');//connecting the frontend with the backend 
const logger = require('morgan');//for the logging in for the user

const PORT = process.env.PORT || 3000;

// Controllers
const testJwtRouter = require('./controllers/test-jwt.js');
const authCtrl = require('./controllers/auth.js');
const userCtrl = require('./controllers/user.js');
const productCtrl = require('./controllers/Product.js');
const orderCtrl = require('./controllers/Order.js');


// MiddleWare
const verifyToken = require('./middleware/verify-token');

mongoose.connect(process.env.MONGODB_URI);

mongoose.connection.on('connected', () => {
  console.log(`Connected to MongoDB ${mongoose.connection.name}.`);
});

app.use(cors());
app.use(express.json());
app.use(logger('dev'));

app.use(express.static(path.join(__dirname,"public")));//for path so I can use the files in different paths 

// Public
app.use('/auth', authCtrl);
app.use('/test-jwt', testJwtRouter);

// Protected Routes
app.use(verifyToken);
app.use('/user', userCtrl);
app.use('/Order', orderCtrl);
app.use('/Product', productCtrl);


app.listen(PORT, () => {
  console.log('The express app is ready!');
});