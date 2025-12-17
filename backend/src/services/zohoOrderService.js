const axios = require("axios");
const ZohoOrder = require("../models/amazonOrders");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../../.env") });

const ORG_ID = process.env.ZOHO_ORG_ID;
const ZOHO_CLIENT_ID = process.env.ZOHO_CLIENT_ID;
const ZOHO_CLIENT_SECRET = process.env.ZOHO_CLIENT_SECRET;
const ZOHO_REFRESH_TOKEN = process.env.ZOHO_REFRESH_TOKEN;

let ACCESS_TOKEN = process.env.ZOHO_ACCESS_TOKEN || "";

// ---------- Helpers ----------
async function refreshAccessToken() {
  try {
    const res = await axios.post("https://accounts.zoho.in/oauth/v2/token", null, {
      params: {
        refresh_token: ZOHO_REFRESH_TOKEN,
        client_id: ZOHO_CLIENT_ID,
        client_secret: ZOHO_CLIENT_SECRET,
        grant_type: "refresh_token",
      },
    });
    ACCESS_TOKEN = res.data?.access_token;
    console.log("🔑 New Zoho Access Token generated.");
    return ACCESS_TOKEN;
  } catch (err) {
    console.error("❌ Token refresh failed:", err.response?.data || err.message);
    throw err;
  }
}

/**
 * Helper to make Zoho API calls with auto-refresh + retry
 */
async function zohoRequest(url, options = {}, retry = true) {
  try {
    const res = await axios.get(url, {
      headers: { Authorization: `Zoho-oauthtoken ${ACCESS_TOKEN}` },
      ...options,
    });
    return res.data;
  } catch (err) {
    if (err.response?.status === 401 && retry) {
      console.log("🔄 Unauthorized. Refreshing token and retrying...");
      // await refreshAccessToken();
      return zohoRequest(url, options, false);
    }
    if (err.response?.status === 429) {
      console.log("⏳ Rate limit hit, waiting 5s...");
      await new Promise((resolve) => setTimeout(resolve, 5000));
      return zohoRequest(url, options, retry);
    }
    throw err;
  }
}

// ---------- Orders ----------
async function fetchAllZohoOrders() {
  let allOrders = [];
  let page = 1;

  while (true) {
    const data = await zohoRequest("https://www.zohoapis.in/inventory/v1/salesorders", {
      params: {
        organization_id: ORG_ID,
        page,
        per_page: 200,
        filter_by: "Status.All",
      },
    });

    const orders = data.salesorders || [];
    if (!orders.length) break;

    console.log(`Found ${orders.length} orders on page ${page}`);

    allOrders.push(...orders);

    if (!data.page_context?.has_more_page) break;
    page++;
    await new Promise((resolve) => setTimeout(resolve, 300));
  }

  return allOrders;
}

async function fetchOrderDetails(orderId) {
  const data = await zohoRequest(
    `https://www.zohoapis.in/inventory/v1/salesorders/${orderId}`,
    { params: { organization_id: ORG_ID } }
  );
  return data.salesorder || null;
}

// ---------- Sales Returns ----------
async function fetchSalesReturns(orderId = null) {
  let allReturns = [];
  let page = 1;

  while (true) {
    const data = await zohoRequest("https://www.zohoapis.in/inventory/v1/salesreturns", {
      params: {
        organization_id: ORG_ID,
        salesorder_id: orderId || undefined,
        page,
        per_page: 200,
      },
    });

    const returns = data.salesreturns || [];
    console.log(`Found ${returns.length} returns on page ${page}`);
    if (!returns.length) break;

    allReturns.push(...returns);

    if (!data.page_context?.has_more_page) break;
    page++;
    await new Promise((resolve) => setTimeout(resolve, 300));
  }

  return allReturns;
}

// ---------- Main Sync ----------
async function fetchAndSaveZohoOrders() {
  try {
    console.log("🔍 Fetching all orders from Zoho...");
    const orders = await fetchAllZohoOrders();

    if (!orders.length) {
      console.log("ℹ️ No orders found in Zoho.");
      return;
    }
    console.log(`✅ Found ${orders.length} orders in Zoho.`);

    console.log("🔍 Fetching sales returns...");
    await fetchSalesReturns();
    console.log("✅ Sales returns fetched successfully.");

    let synced = 0;
    for (const summary of orders) {
      const details = await fetchOrderDetails(summary.salesorder_id);
      if (!details?.salesorder_id) {
        console.warn("⚠️ Skipping order with missing ID:", summary.salesorder_number);
        continue;
      }

      const orderData = {
        id: details.salesorder_id,
        salesorder_number: details.salesorder_number,
        reference_number: details.reference_number,
        marketplace_order_id: details.marketplace_so_id,
        sales_channel: details.sales_channel,
        customer_id: details.customer_id,
        customer_name: details.customer_name,
        status: details.status,
        date: details.date,
        created_time: details.created_time,
        last_modified_time: details.last_modified_time,
        shipment_date: details.shipment_date,
        delivery_date: details.delivery_date,
        currency_code: details.currency_code,
        total: details.total,
        sub_total: details.sub_total,
        shipping_charge: details.shipping_charge,
        discount: details.discount,
        tax_total: details.tax_total,
        balance: details.balance,
        billing_address: details.billing_address,
        shipping_address: details.shipping_address,
        line_items: (details.line_items || []).map((item) => ({
          name: item.name,
          sku: item.sku,
          quantity: Number(item.quantity || 0),
          rate: Number(item.rate || 0),
          price: Number(item.price || item.rate || 0),
        })),
        packages: (details.packages || []).map((pkg) => ({
          package_number: pkg.package_number,
          tracking_number: pkg.tracking_number,
          carrier: pkg.carrier,
          shipped_date: pkg.shipped_date,
          delivery_date: pkg.delivery_date,
        })),
        invoices: (details.invoices || []).map((inv) => ({
          invoice_number: inv.invoice_number,
          status: inv.status,
          amount: inv.amount,
          date: inv.date,
        })),
        payments: (details.payments || []).map((pay) => ({
          payment_mode: pay.payment_mode,
          amount: pay.amount,
          date: pay.date,
        })),
        source: "zoho",
        notes: details.notes,
        terms: details.terms,
      };

      await ZohoOrder.updateOne(
        { id: orderData.id },
        { $set: orderData },
        { upsert: true }
      );

      console.log("✅ Saved order:", details.salesorder_number);
      synced++;
    }

    console.log(`✅ Synced ${synced} orders from Zoho.`);
  } catch (err) {
    console.error("❌ Orders sync failed:", err.response?.data || err.message);
  }
}

module.exports = {
  fetchAndSaveZohoOrders,
  fetchSalesReturns,
};
