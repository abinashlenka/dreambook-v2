const mongoose = require("mongoose");

const woocommerceOrderSchema = new mongoose.Schema(
  {
    woocommerce_order_id: { type: String, unique: true, required: true }, // WooCommerce order ID
    order_status: { type: String }, // e.g., completed, processing
    total_amount: { type: String }, // total
    currency_code: { type: String }, // currency (e.g., INR)
    purchase_date: { type: Date }, // date_created
    last_update_date: { type: Date }, // date_modified
    payment_method: { type: String }, // payment_method_title

    buyer_info: {
      email: { type: String }, // billing.email
      name: { type: String },  // billing.first_name + last_name
      phone: { type: String }, // billing.phone
    },

    shipping_address: {
      city: { type: String },
      state_or_region: { type: String },
      postal_code: { type: String },
      country_code: { type: String },
    },

    line_items: [
      {
        title: { type: String }, // line_items.name
        quantity: { type: Number }, // line_items.quantity
        price: { type: String }, // line_items.price
        image: { type: String }, // line_items.image.src
      },
    ],

    tracking_info: {
      provider: { type: String },
      tracking_number: { type: String },
      date_shipped: { type: Date },
    },

    source: { type: String, enum: ["woocommerce"], default: "woocommerce" },
    message: { type: String, default: "" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Woocommerce", woocommerceOrderSchema);
