const httpStatus = require('http-status');
const ApiError = require('../utils/ApiError');
const mongoose = require('mongoose');
const FlipkartOrder = require('../models/flipkartOrderds');
const catchAsync = require('../utils/catchAsync');
const { syncBookFromExternalSource } = require("../services/syncBookFromSource");
// ✅ Make sure this import path is correct

// 🧭 Helper: Parse various date formats
const parseDateOrEmpty = (d) => {
  if (!d || d === "") return null;
  if (d.includes("/")) {
    const [day, month, year] = d.split("/").map(Number);
    return new Date(year, month - 1, day);
  }
  const parsed = new Date(d);
  return isNaN(parsed.getTime()) ? null : parsed;
};

// 🧹 Helper: Clean strings
const cleanString = (value) => {
  if (!value || typeof value !== "string") return "";
  return value.replace(/^"+|"+$/g, "").trim();
};

const addFlipkartOrders = catchAsync(async (req, res) => {
  const { data } = req.body;

  console.log("📊 Total records received:", data?.length || 0);

  if (!Array.isArray(data) || data.length === 0) {
    return res.status(400).json({
      success: false,
      message: "No Flipkart data received",
    });
  }

  const mappedOrders = [];

  for (const o of data) {
    const isReturn =
      !!(o.return_id && o.return_id.trim() !== "" &&
        o.return_type && o.return_type.trim() !== "" &&
        o.return_reason && o.return_reason.trim() !== "");

    // console.log("Processing record:", isReturn ? "Return" : "Order");
    // 🧠 Determine order_status for returns
    let orderStatus = "";

    if (isReturn) {
      const status = (o.return_status || "").toLowerCase();
      // console.log("come in returns")

      if (status === "completed") {
        orderStatus = "returned"; // ✅ completed → returned
      } else {
        orderStatus = status || "returned";
      }
    } else {
      const status = (o.order_item_status || "").toLowerCase();

      if (status === "return_requested") {
        orderStatus = "returned"; // ✅ RETURN_REQUESTED → returned
      } else {
        orderStatus = status;
      }
    }


    // 🧾 Item details
    const item = {
      asin: cleanString(o.sku),
      title: cleanString(o.product_title),
      quantity: Number(o.quantity) || 1,
      price: cleanString(o.price),
    };

    // 🧠 Build the order object
    const orderObj = {
      flipkart_order_id: o.order_item_id || o.order_id || o.return_id || "",
      order_status: orderStatus,
      total_amount: o.total_amount || "",
      currency_code: "INR",
      purchase_date: parseDateOrEmpty(
        o.order_date || o.return_approval_date || o.return_requested_date
      ),
      last_update_date: parseDateOrEmpty(
        o.order_delivery_date ||
        o.return_completion_date ||
        o.return_complete_by_date ||
        o.deliver_by_date
      ),
      payment_method: o.payment_method || o.return_result || "",
      buyer_info: { email: o.buyer_email || "" },
      shipping_address: {
        city: o.city || "",
        state_or_region: o.state || "",
        postal_code: o.pincode || "",
        country_code: "IN",
      },
      earliest_ship_date: parseDateOrEmpty(o.dispatch_by_date),
      earliest_delivery_date: parseDateOrEmpty(o.deliver_by_date),
      line_items: [item],
      source: "flipkart",
      fulfilment_type: o.fulfilment_type || "",
      fsn: o.fsn || "",
      reverse_logistics_tracking_id: o.reverse_logistics_tracking_id || "",
      return_details: isReturn
        ? {
          return_id: o.return_id || "",
          return_type: o.return_type || "",
          return_reason: o.return_reason || "",
          return_sub_reason: o.return_sub_reason || "",
          return_result: o.return_result || "",
          return_status: o.return_status || "",
          return_completion_date: parseDateOrEmpty(o.return_completion_date),
          return_completion_breach: o.return_completion_breach || "",
          return_completion_sla: o.return_completion_sla || "",
          return_completion_type: o.return_completion_type || "",
          return_expectation: o.return_expectation || "",
          return_cancellation_reason: o.return_cancellation_reason || "",
          final_condition_of_returned_product:
            o.final_condition_of_returned_product || "",
          detailed_pv_output: o.detailed_pv_output || "",
          primary_pv_output: o.primary_pv_output || "",
          tech_visit_by_date: parseDateOrEmpty(o.tech_visit_by_date),
          tech_visit_completion_datetime: parseDateOrEmpty(
            o.tech_visit_completion_datetime
          ),
          tech_visit_sla: o.tech_visit_sla || "",
          tech_visit_completion_breach:
            o.tech_visit_completion_breach || "",
        }
        : null,
      message: isReturn
        ? `${o.return_reason || ""} - ${o.return_sub_reason || ""}`
        : o.message || "",
    };

    mappedOrders.push(orderObj);

    // 🧩 --- Sync Book with Dream / WooCommerce ---
    try {
      const imageSrc = o.image_url || "";

      await syncBookFromExternalSource(
        {
          title: cleanString(o.product_title),
          price: item.price,
          description: "",
          images: imageSrc ? [{ src: imageSrc }] : [],
          bindingSize: [],
          platforms: [{ platform: "flipkart", royalty: 0 }],
        },
        "flipkart"
      );

      // console.log(`✅ Synced product: ${o.product_title}`);
    } catch (err) {
      console.error(`⚠️ Book sync failed for ${o.product_title}:`, err.message);
    }
  }

  // 🧠 Save or update (avoid duplicates)
  const savedOrders = [];
  for (const order of mappedOrders) {
    const updated = await FlipkartOrder.findOneAndUpdate(
      { flipkart_order_id: order.flipkart_order_id },
      order,
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    savedOrders.push(updated);
  }

  return res.status(200).json({
    success: true,
    message: `✅ ${savedOrders.length} Flipkart records saved successfully`,
    count: savedOrders.length,
  });
});

const getLatestFlipkartOrderMonth = catchAsync(async (req, res) => {
  // Find the latest purchase_date
  const latestOrder = await FlipkartOrder.findOne()
    .sort({ purchase_date: -1 })
    .select("purchase_date")
    .lean(); // Only return the date field

  if (!latestOrder || !latestOrder.purchase_date) {
    return res.status(404).json({ message: "No Flipkart order data found" });
  }

  // Format as "Mon YYYY" (e.g., "Sep 2025")
  const date = new Date(latestOrder.purchase_date);
  const formatted = date.toLocaleString("en-US", {
    month: "short",
    year: "numeric",
  });

  console.log("Latest Flipkart Order Month:", formatted);

  return res.status(200).json({
    latestMonth: formatted,
  });
});


module.exports = { addFlipkartOrders, getLatestFlipkartOrderMonth };
