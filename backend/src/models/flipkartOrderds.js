const mongoose = require("mongoose");

const flipkartOrderSchema = new mongoose.Schema(
  {
    flipkart_order_id: { type: String, unique: true, required: true }, 
    order_status: { type: String }, // e.g., Shipped
    total_amount: { type: String }, // OrderTotal.Amount
    currency_code: { type: String }, // OrderTotal.CurrencyCode
    purchase_date: { type: Date }, // PurchaseDate
    last_update_date: { type: Date }, // LastUpdateDate
    payment_method: { type: String }, // PaymentMethod

    buyer_info: {
      email: { type: String }, // BuyerInfo.BuyerEmail
      // You can add more fields here if needed later
    },

    shipping_address: {
      city: { type: String },
      state_or_region: { type: String },
      postal_code: { type: String },
      country_code: { type: String },
    },

    earliest_ship_date: { type: Date }, // EarliestShipDate
    earliest_delivery_date: { type: Date }, // EarliestDeliveryDate

    line_items: [
      {
        asin: { type: String },
        title: { type: String },
        quantity: { type: Number },
        price: { type: String },
      },
    ],

    source: { type: String, enum: ["flipkart"], default: "flipkart" },
    message: { type: String, default: "" },
  },
  { timestamps: true }
);

flipkartOrderSchema.index({ purchase_date: -1 });

module.exports = mongoose.model("FlipkartOrder", flipkartOrderSchema);
