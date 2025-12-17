const express = require("express");
const router = express.Router();
const { addFlipkartOrders,getLatestFlipkartOrderMonth } = require("../../controllers/flipkartController");
const {firebaseAuth} = require("../../middlewares/firebaseAuth");

// POST 
router.post("/add", firebaseAuth("admin,employee")  , addFlipkartOrders);
// 🕒 GET /api/flipkart/latest-date
router.get("/latest-date", firebaseAuth("admin,employee"), getLatestFlipkartOrderMonth);


module.exports = router;