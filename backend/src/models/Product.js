// models/Product.js
const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  // ⚠️ No unique index on these
  asin: { type: String, default: null, sparse: true },
  amazon_order_id: { type: String, unique: true, sparse: true }, // link to Amazon order
  woocommerce_order_id: { type: String, sparse: true }, // link to WooCommerce order

  name: String,
  price: String,
  description: { type: String, default: "Incomplete product data" },
  short_description: String,
  sku: String,
  stock_quantity: Number,
  images: [{ src: String }],
  categories: [{ id: Number, name: String }],
  title: String,
  author_name: { type: String, default: "Unknown" },
  publisher: { type: String, default: "" },
  pages: { type: Number, default: 0 },
  item_weight: { type: String, default: "" },
  dimensions: { type: String, default: "" },
  bindingSize: [{ type: String }],
  country_of_origin: String,
  packer: String,
  generic_name: String,
  unspsc_code: { type: String, default: "" },
  message: { type: String, default: "" },
  source: {
    type: [String],
    enum: ["woocommerce", "amazon", "kindle", "custom"],
    required: true
  },
  status: {
    type: String,
    enum: ['Verified', 'Pending', 'Declined'],
    default: 'Pending'
  }
}, { timestamps: true });

module.exports = mongoose.model("Product", productSchema);
