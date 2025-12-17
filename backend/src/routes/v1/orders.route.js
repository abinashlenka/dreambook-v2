const express = require("express");
const router = express.Router();
const { getOrders, getOrdersByName,getRoyaltyDetails } = require("../../controllers/order.controller");
const { firebaseAuth } = require('../../middlewares/firebaseAuth');

// GET /orders → Fetch all orders (with optional ?source= filter)
router.get("/", getOrders);

// GET /orders/by-name/:name/:bookId → Fetch orders by product name
router.get("/by-name/:name/:bookId",firebaseAuth("All"), getOrdersByName);
router.get("/get-royalty/:name/:bookId",firebaseAuth("All"), getRoyaltyDetails);

module.exports = router;
