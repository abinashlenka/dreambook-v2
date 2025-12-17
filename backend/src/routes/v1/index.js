const express = require('express');
const router = express.Router();

const userRoute = require('./user.route');
const authRoute = require('./auth.route');
const bookRoute = require('./book.route');
// const wooCommerceRoutes = require('../../services/woocommerce');
const woocommerceRoutes = require("./woocommerce.route"); // ✅ NEW LINE ADDED
// const amazonRoutes = require('../../services/amazon');
const amazonRoutes = require("./amazon.route"); // ✅ Correct Path
const orderRoutes = require("./orders.route"); // ✅ Add this line
const dashBoardRoutes = require('./dashBoard.routes');
const notificationRoutes = require('./notificationRoutes');
const bookAssignRoutes = require('./bookAssign.route');
const flipkartRoutes = require('./flipkart.routes');

// Flipkart routes
router.use('/flipkart', flipkartRoutes);

// Book Assignment routes
router.use('/book-assign', bookAssignRoutes);

// Notification routes
router.use('/notifications', notificationRoutes);

// Define the dashboard route
router.use('/dashboard', dashBoardRoutes);



router.use('/auth', authRoute);
router.use('/users', userRoute);
router.use('/books', bookRoute);
router.use("/woocommerce", woocommerceRoutes);
router.use("/amazon", amazonRoutes);
router.use("/orders", orderRoutes); // ✅ Register orders route

module.exports = router;
