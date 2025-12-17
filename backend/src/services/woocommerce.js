// services/woocommerce.js
const axios = require("axios");
const WooCommerceOrder = require("../models/woocommerceOrders.js");
const Product = require("../models/Product.js");
const { syncBookFromExternalSource } = require("./syncBookFromSource.js");
const moment = require("moment");
require("dotenv").config({ path: "../.env" });

// WooCommerce credentials
const wooCommerceBaseURL = process.env.WOOCOMMERCE_API_URL;
const wooCommerceConsumerKey = process.env.WOOCOMMERCE_CONSUMER_KEY;
const wooCommerceConsumerSecret = process.env.WOOCOMMERCE_CONSUMER_SECRET;

// ✅ Safe date formatter
const formatDateTime = (date) => {
  if (!date) return "";
  if (!isNaN(date) && date.toString().length === 10) {
    return moment.unix(Number(date)).format("DD-MM-YYYY hh:mm A");
  }
  return moment(date).isValid() ? moment(date).format("DD-MM-YYYY hh:mm A") : "";
};

// 🔹 Helper for API requests
const wooCommerceRequest = async (endpoint, params = {}) => {
  try {
    const response = await axios.get(`${wooCommerceBaseURL}/wp-json/wc/v3/${endpoint}`, {
      headers: {
        Authorization:
          "Basic " +
          Buffer.from(`${wooCommerceConsumerKey}:${wooCommerceConsumerSecret}`).toString("base64"),
      },
      params,
      timeout: 15000,
    });
    return response.data;
  } catch (error) {
    console.error(`❌ Error fetching ${endpoint}:`, error.response ? error.response.data : error.message);
    return [];
  }
};

// 🔹 Fetch WooCommerce orders (last 30 days only)
const fetchOrders = async () => {
  console.log("🔍 Starting to fetch WooCommerce orders (last 30 days only)...");

  try {
    let page = 1;
    let totalFetched = 0;
    let hasMore = true;

    // 🔹 Compute date 30 days ago in ISO format
    const thirtyDaysAgo = moment().subtract(30, "days").toISOString();

    while (hasMore) {
      console.log(`🔄 Fetching orders (Page ${page})...`);

      const orders = await wooCommerceRequest("orders", {
        per_page: 100,
        page,
        after: thirtyDaysAgo,
      });

      if (!orders || orders.length === 0) {
        hasMore = false;
        console.log("✅ No more orders found.");
        break;
      }

      for (const order of orders) {
        // 🧩 Extract line items
        const lineItems = (order.line_items || []).map((item) => ({
          woocommerce_product_id: item.product_id?.toString() || "",
          title: item.name,
          quantity: item.quantity,
          price: item.price?.toString() || "0",
          image: item.image?.src || "",
          description: item.description || "",
        }));

        // 🧩 Buyer info
        const buyerInfo = {
          email: order.billing?.email || "",
          name: `${order.billing?.first_name || ""} ${order.billing?.last_name || ""}`.trim(),
          phone: order.billing?.phone || "",
        };

        // 🧩 Shipping
        const shippingAddress = {
          city: order.shipping?.city || "",
          state_or_region: order.shipping?.state || "",
          postal_code: order.shipping?.postcode || "",
          country_code: order.shipping?.country || "",
        };

        // 🧩 Tracking info
        let tracking = {};
        const trackingMeta = order.meta_data?.find((m) => m.key === "_wc_shipment_tracking_items");
        if (trackingMeta && Array.isArray(trackingMeta.value) && trackingMeta.value.length > 0) {
          const t = trackingMeta.value[0];
          tracking = {
            provider: t.tracking_provider || "",
            tracking_number: t.tracking_number || "",
            date_shipped: t.date_shipped,
          };
        }

        // ✅ Save WooCommerce order
        await WooCommerceOrder.findOneAndUpdate(
          { woocommerce_order_id: order.id.toString() },
          {
            woocommerce_order_id: order.id.toString(),
            order_status: order.status,
            total_amount: order.total,
            currency_code: order.currency,
            purchase_date: order.date_created,
            last_update_date: order.date_modified,
            payment_method: order.payment_method_title,
            buyer_info: buyerInfo,
            shipping_address: shippingAddress,
            line_items: lineItems,
            tracking_info: tracking,
            source: "woocommerce",
            message: "",
          },
          { upsert: true, new: true }
        );

        console.log(`✅ Order ${order.id} saved/updated.`);

        // 🔹 Store/Update each product & book
        for (const item of order.line_items || []) {
          if (!item.name) {
            console.warn("⚠️ Skipping product with missing name:", item);
            continue;
          }

          // 🧠 Step 1: Fetch product details from WooCommerce if product_id exists
          let productDetails = {};
          if (item.product_id) {
            try {
              productDetails = await wooCommerceRequest(`products/${item.product_id}`);
            } catch (err) {
              console.warn(`⚠️ Could not fetch product ${item.product_id}:`, err.message);
            }
          }

          // 📝 Get a proper description
          const description =
            (item.description && item.description.trim()) ||
            (productDetails.description && productDetails.description.trim()) ||
            (productDetails.short_description && productDetails.short_description.replace(/<[^>]+>/g, "").trim()) ||
            "Imported from WooCommerce";

          // 🖼️ Get a safe image URL
          const imageSrc =
            item.image?.src ||
            (Array.isArray(productDetails.images) && productDetails.images.length > 0
              ? productDetails.images[0].src
              : "");

          // --- Product logic ---
          const existingProduct = await Product.findOne({ name: item.name });

          if (existingProduct) {
            let updatedSources = Array.isArray(existingProduct.source)
              ? existingProduct.source
              : [existingProduct.source];
            if (!updatedSources.includes("woocommerce")) updatedSources.push("woocommerce");

            await Product.findByIdAndUpdate(existingProduct._id, {
              price: item.price,
              woocommerce_order_id: order.id?.toString() || "",
              source: updatedSources,
              description,
              $set: imageSrc ? { images: [{ src: imageSrc }] } : {},
            });

            console.log(`🔁 Updated existing product: ${item.name}`);
          } else {
            await Product.create({
              woocommerce_order_id: order.id?.toString() || "",
              name: item.name,
              price: item.price,
              description,
              images: imageSrc ? [{ src: imageSrc }] : [],
              source: ["woocommerce"],
              status: "Pending",
            });

            console.log(`🆕 Created new product: ${item.name}`);
          }

          // --- Book logic ---
          await syncBookFromExternalSource(
            {
              title: item.name,
              price: item.price,
              description,
              images: imageSrc ? [{ src: imageSrc }] : [],
              bindingSize: [],
              platforms: [{ platform: "dream", royalty: 0 }],
            },
            "woocommerce"
          );

          console.log(`Platform: dream\n✅ Book updated from woocommerce: ${item.name}`);
        }
      }

      totalFetched += orders.length;
      page++;
    }

    console.log(`✅ All WooCommerce orders fetched and saved. Total: ${totalFetched}`);
  } catch (error) {
    console.error("❌ Error fetching WooCommerce orders:", error.message);
  }
};

module.exports = { fetchOrders };
