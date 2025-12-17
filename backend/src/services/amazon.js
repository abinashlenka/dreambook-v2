// // services/amazon.js
// const moment = require("moment");
// const SellingPartnerAPI = require("amazon-sp-api");
// const Product = require("../models/Product");
// const AmazonOrder = require("../models/amazonOrders.js");

// const amazonRefreshToken = process.env.AMAZON_REFRESH_TOKEN;
// const amazonClientId = process.env.AMAZON_CLIENT_ID;
// const amazonClientSecret = process.env.AMAZON_CLIENT_SECRET;

// // Initialize the Amazon SP-API client
// const spClient = new SellingPartnerAPI({
//   region: "eu", // Use "eu" for India
//   refresh_token: amazonRefreshToken,
//   credentials: {
//     SELLING_PARTNER_APP_CLIENT_ID: amazonClientId,
//     SELLING_PARTNER_APP_CLIENT_SECRET: amazonClientSecret
//   }
// });


// const formatDateTime = (date) => {
//   return date ? moment(date).format("DD-MM-YYYY hh:mm A") : "";
// };


// // Fetch all Amazon orders (handles pagination)
// const fetchAmazonOrders = async () => {
//   try {
//     console.log("🔍 Fetching Amazon orders (with pagination)...");

//     let allOrders = [];
//     let nextToken = null;
//     let page = 1;

//     do {
//       const params = nextToken
//         ? {
//             operation: "getOrders",
//             endpoint: "orders",
//             query: { NextToken: nextToken },
//           }
//         : {
//             operation: "getOrders",
//             endpoint: "orders",
//             query: {
//               MarketplaceIds: ["A21TJRUUN4KGV"],
//               CreatedAfter: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
//               IncludeOrderItems: true,
//             },
//           };

//       const response = await spClient.callAPI(params);

//       if (response.Orders && Array.isArray(response.Orders)) {
//         allOrders = allOrders.concat(response.Orders);
//         console.log(`📦 Page ${page}: ${response.Orders.length} orders fetched (total: ${allOrders.length})`);
//       } else {
//         console.warn(`⚠️ Page ${page}: No Orders found.`);
//       }

//       nextToken = response.NextToken || null;
//       page++;

//     } while (nextToken);

//     console.log(`✅ Finished fetching. Total Orders: ${allOrders.length}`);
//     return allOrders;

//   } catch (error) {
//     console.error("❌ Error fetching Amazon orders:", error);
//     return [];
//   }
// };

// const saveAmazonOrders = async (orders) => {
//   try {
//     for (let order of orders) {
//       const lineItems = order.OrderItems && Array.isArray(order.OrderItems)
//         ? order.OrderItems.map(item => ({
//             asin: item.ASIN,
//             title: item.Title,
//             quantity: item.QuantityOrdered,
//             price: item.ItemPrice?.Amount || "0.00"
//           }))
//         : [];

//       await AmazonOrder.findOneAndUpdate(
//         { amazon_order_id: order.AmazonOrderId },
//         {
//           amazon_order_id: order.AmazonOrderId,
//           order_status: order.OrderStatus,
//           total_amount: order.OrderTotal?.Amount || "0.00",
//           currency_code: order.OrderTotal?.CurrencyCode || "USD",
//           purchase_date: formatDateTime(order.PurchaseDate),
//           last_update_date: formatDateTime(order.LastUpdateDate || new Date()),
//           payment_method: order.PaymentMethod || "",
//           buyer_info: {
//             email: order.BuyerInfo?.BuyerEmail || "",
//           },
//           shipping_address: {
//             city: order.ShippingAddress?.City || "",
//             state_or_region: order.ShippingAddress?.StateOrRegion || "",
//             postal_code: order.ShippingAddress?.PostalCode || "",
//             country_code: order.ShippingAddress?.CountryCode || "",
//           },
//           earliest_ship_date: formatDateTime(order.EarliestShipDate),
//           earliest_delivery_date: formatDateTime(order.EarliestDeliveryDate),
//           line_items: lineItems,
//           source: "amazon",
//           message: ""
//         },
//         { upsert: true, new: true }
//       );

//       console.log(`✅ Amazon Order ID ${order.AmazonOrderId} saved/updated in MongoDB.`);
//     }
//   } catch (error) {
//     console.error("❌ Error saving Amazon orders:", error);
//   }
// };

// // Fetch Amazon products using ASINs from orders
// const fetchAmazonProducts = async () => {
//   try {
//     console.log("🔍 Fetching Amazon products...");

//     // First, fetch Amazon orders
//     const orders = await fetchAmazonOrders();
//     console.log("📦 Sample Order Structure:", JSON.stringify(orders[0], null, 2));

//     if (!orders || !Array.isArray(orders)) {
//       console.error("❌ No orders found or orders is not an array.");
//       return;
//     }

//     // Extract unique ASINs from the orders
//     const asins = [];
//     for (let order of orders) {
//       try {
//         const orderItems = await spClient.callAPI({
//           operation: "getOrderItems",
//           endpoint: "orders",
//           path: { orderId: order.AmazonOrderId }
//         });

//         if (orderItems.OrderItems && Array.isArray(orderItems.OrderItems)) {
//           for (let item of orderItems.OrderItems) {
//             if (item.ASIN) {
//               asins.push(item.ASIN);
//             } else {
//               console.warn("⚠️ Missing ASIN in OrderItem:", item);
//             }
//           }
//         } else {
//           console.warn("⚠️ Missing or invalid OrderItems in order:", order.AmazonOrderId);
//         }
//       } catch (error) {
//         console.error(`❌ Error fetching order items for order ${order.AmazonOrderId}:`, error);
//       }
//     }

//     console.log(`🔍 Found ${asins.length} ASINs in orders.`);
//     // Remove duplicates
//     const uniqueAsins = [...new Set(asins)];

//     // Fetch product details for each ASIN and save to MongoDB
//     for (let asin of uniqueAsins) {
//       try {
//         const product = await spClient.callAPI({
//           operation: "getCatalogItem",
//           endpoint: "catalogItems",
//           path: { asin },
//           query: {
//             marketplaceIds: ["A21TJRUUN4KGV"],
//             includedData: "summaries,images,attributes"
//           }
//         });

//         console.log("📦 Product Response for ASIN:", asin, JSON.stringify(product, null, 2));

//         // Extract author and item_name safely from attributes
//         const attributes = product.attributes || {};
//         const author =
//           attributes.author && Array.isArray(attributes.author)
//             ? attributes.author[0].value
//             : "Unknown";

//         const itemName =
//           attributes.item_name && Array.isArray(attributes.item_name)
//             ? attributes.item_name[0].value
//             : product.summaries?.[0]?.itemName || "No title available";

//         // Extract image URL
//         let imageUrl = "";
//         if (product.images?.[0]?.images?.length > 0) {
//           const mainImage =
//             product.images[0].images.find(img => img.variant === "MAIN") ||
//             product.images[0].images[0];
//           imageUrl = mainImage.link;
//         }

//         // Fetch product price
//         const price = await fetchProductPrice(asin);

//         // Save product in MongoDB
//         await Product.findOneAndUpdate(
//           { id: asin },
//           {
//             id: asin,
//             asin: asin,
//             name: itemName,
//             author_name: author,
//             price: price,
//             description:
//               attributes.product_description?.[0]?.value ||
//               product.summaries?.[0]?.itemName ||
//               "No description available",
//             short_description: attributes.item_type_name?.[0]?.value || "No short description available",
//             stock_quantity: 0,
//             images: imageUrl ? [{ src: imageUrl }] : [],
//             date_modified: new Date().toISOString(),
//             created_date: new Date().toISOString(),
//             source: "amazon"
//           },
//           { upsert: true }
//         );

//         console.log(`✅ Amazon Product ID ${asin} saved/updated in MongoDB.`);
//       } catch (error) {
//         console.error(`❌ Error fetching product details for ASIN ${asin}:`, error);
//       }
//     }

//   } catch (error) {
//     console.error("❌ Error fetching Amazon products:", error);
//   }
// };

// // Fetch product price from Amazon SP-API
// const fetchProductPrice = async (asin) => {
//   try {
//     const response = await spClient.callAPI({
//       operation: "getItemOffers",
//       endpoint: "productPricing",
//       query: {
//         MarketplaceId: "A21TJRUUN4KGV",
//         ItemCondition: "New"
//       },
//       path: { Asin: asin }
//     });
//     return response.Offers[0]?.ListingPrice?.Amount || "0.00";
//   } catch (error) {
//     console.error(`❌ Error fetching price for ASIN ${asin}:`, error);
//     return "0.00";
//   }
// };

// module.exports = {
//   fetchAmazonOrders,
//   saveAmazonOrders,
//   fetchAmazonProducts,
//   fetchProductPrice
// };



// // services/amazon.js
// const moment = require("moment");
// const SellingPartnerAPI = require("amazon-sp-api");
// const Product = require("../models/Product");
// const AmazonOrder = require("../models/amazonOrders.js");

// const amazonRefreshToken = process.env.AMAZON_REFRESH_TOKEN;
// const amazonClientId = process.env.AMAZON_CLIENT_ID;
// const amazonClientSecret = process.env.AMAZON_CLIENT_SECRET;

// // Initialize the Amazon SP-API client
// const spClient = new SellingPartnerAPI({
//   region: "eu", // Use "eu" for India
//   refresh_token: amazonRefreshToken,
//   credentials: {
//     SELLING_PARTNER_APP_CLIENT_ID: amazonClientId,
//     SELLING_PARTNER_APP_CLIENT_SECRET: amazonClientSecret
//   }
// });

// // Format date to readable format
// const formatDateTime = (date) => {
//   return date ? moment(date).format("DD-MM-YYYY hh:mm A") : "";
// };

// // Fetch all Amazon orders (with pagination)
// const fetchAmazonOrders = async () => {
//   try {
//     console.log("🔍 Fetching Amazon orders...");

//     let allOrders = [];
//     let nextToken = null;
//     let page = 1;

//     do {
//       const params = nextToken
//         ? {
//             operation: "getOrders",
//             endpoint: "orders",
//             query: { NextToken: nextToken }
//           }
//         : {
//             operation: "getOrders",
//             endpoint: "orders",
//             query: {
//               MarketplaceIds: ["A21TJRUUN4KGV"],
//               CreatedAfter: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
//               IncludeOrderItems: true
//             }
//           };

//       const response = await spClient.callAPI(params);

//       if (response.Orders && Array.isArray(response.Orders)) {
//         allOrders = allOrders.concat(response.Orders);
//         console.log(`📦 Page ${page}: ${response.Orders.length} orders fetched (total: ${allOrders.length})`);
//       } else {
//         console.warn(`⚠️ Page ${page}: No Orders found.`);
//       }

//       nextToken = response.NextToken || null;
//       page++;
//     } while (nextToken);

//     console.log(`✅ Finished fetching. Total Orders: ${allOrders.length}`);
//     return allOrders;
//   } catch (error) {
//     console.error("❌ Error fetching Amazon orders:", error);
//     return [];
//   }
// };

// // Fetch product price from Amazon SP-API
// const fetchProductPrice = async (asin) => {
//   try {
//     const response = await spClient.callAPI({
//       operation: "getItemOffers",
//       endpoint: "productPricing",
//       query: {
//         MarketplaceId: "A21TJRUUN4KGV",
//         ItemCondition: "New"
//       },
//       path: { Asin: asin }
//     });
//     return response.Offers?.[0]?.ListingPrice?.Amount || "0.00";
//   } catch (error) {
//     console.error(`❌ Error fetching price for ASIN ${asin}:`, error);
//     return "0.00";
//   }
// };

// // Main function: fetch orders, products, and save everything
// const fetchAndSaveAmazonOrdersAndProducts = async () => {
//   try {
//     const orders = await fetchAmazonOrders();
//     if (!orders.length) return console.warn("⚠️ No orders found.");

//     const allAsins = new Set();

//     // Save orders with line items
//     for (let order of orders) {
//       let orderItemsResponse;
//       try {
//         orderItemsResponse = await spClient.callAPI({
//           operation: "getOrderItems",
//           endpoint: "orders",
//           path: { orderId: order.AmazonOrderId }
//         });
//       } catch (err) {
//         console.error(`❌ Failed to fetch items for order ${order.AmazonOrderId}:`, err);
//         continue;
//       }

//       const lineItems = (orderItemsResponse?.OrderItems || []).map(item => {
//         if (item.ASIN) allAsins.add(item.ASIN);
//         return {
//           asin: item.ASIN,
//           title: item.Title,
//           quantity: item.QuantityOrdered,
//           price: item.ItemPrice?.Amount || "0.00"
//         };
//       });

//       await AmazonOrder.findOneAndUpdate(
//         { amazon_order_id: order.AmazonOrderId },
//         {
//           amazon_order_id: order.AmazonOrderId,
//           order_status: order.OrderStatus,
//           total_amount: order.OrderTotal?.Amount || "0.00",
//           currency_code: order.OrderTotal?.CurrencyCode || "USD",
//           purchase_date: formatDateTime(order.PurchaseDate),
//           last_update_date: formatDateTime(order.LastUpdateDate || new Date()),
//           payment_method: order.PaymentMethod || "",
//           buyer_info: { email: order.BuyerInfo?.BuyerEmail || "" },
//           shipping_address: {
//             city: order.ShippingAddress?.City || "",
//             state_or_region: order.ShippingAddress?.StateOrRegion || "",
//             postal_code: order.ShippingAddress?.PostalCode || "",
//             country_code: order.ShippingAddress?.CountryCode || ""
//           },
//           earliest_ship_date: formatDateTime(order.EarliestShipDate),
//           earliest_delivery_date: formatDateTime(order.EarliestDeliveryDate),
//           line_items: lineItems,
//           source: "amazon",
//           message: ""
//         },
//         { upsert: true, new: true }
//       );

//       console.log(`✅ Order ${order.AmazonOrderId} saved with ${lineItems.length} items`);
//     }

//     // Save products
//     for (let asin of allAsins) {
//       try {
//         const product = await spClient.callAPI({
//           operation: "getCatalogItem",
//           endpoint: "catalogItems",
//           path: { asin },
//           query: { marketplaceIds: ["A21TJRUUN4KGV"], includedData: "summaries,images,attributes" }
//         });

//         const attributes = product.attributes || {};
//         const author = attributes.author?.[0]?.value || "Unknown";
//         const itemName = attributes.item_name?.[0]?.value || product.summaries?.[0]?.itemName || "No title";
//         const imageUrl = product.images?.[0]?.images?.find(img => img.variant === "MAIN")?.link || "";

//         const price = await fetchProductPrice(asin);

//         await Product.findOneAndUpdate(
//           { id: asin },
//           {
//             id: asin,
//             asin,
//             name: itemName,
//             author_name: author,
//             price,
//             description: attributes.product_description?.[0]?.value || "No description",
//             short_description: attributes.item_type_name?.[0]?.value || "No short description",
//             stock_quantity: 0,
//             images: imageUrl ? [{ src: imageUrl }] : [],
//             date_modified: new Date().toISOString(),
//             created_date: new Date().toISOString(),
//             source: "amazon"
//           },
//           { upsert: true }
//         );

//         console.log(`✅ Product ${asin} saved`);
//       } catch (err) {
//         console.error(`❌ Failed to save product ${asin}:`, err);
//       }
//     }

//     console.log("✅ All orders and products processed successfully.");

//   } catch (error) {
//     console.error("❌ Error in fetching/saving Amazon orders/products:", error);
//   }
// };

// module.exports = {
//   fetchAmazonOrders,
//   fetchProductPrice,
//   fetchAndSaveAmazonOrdersAndProducts
// };



// services/amazon.js
const moment = require("moment");
const SellingPartnerAPI = require("amazon-sp-api");
const Product = require("../models/Product");
const AmazonOrder = require("../models/amazonOrders.js");
const { syncBookFromExternalSource } = require("./syncBookFromSource.js");

const amazonRefreshToken = process.env.AMAZON_REFRESH_TOKEN;
const amazonClientId = process.env.AMAZON_CLIENT_ID;
const amazonClientSecret = process.env.AMAZON_CLIENT_SECRET;

// Initialize the Amazon SP-API client
const spClient = new SellingPartnerAPI({
  region: "eu",
  refresh_token: amazonRefreshToken,
  credentials: {
    SELLING_PARTNER_APP_CLIENT_ID: amazonClientId,
    SELLING_PARTNER_APP_CLIENT_SECRET: amazonClientSecret
  }
});

// Format date to readable format
const formatDateTime = (date) => (date ? moment(date).format("DD-MM-YYYY hh:mm A") : "");

// Fetch all Amazon orders (with pagination)
const fetchAmazonOrders = async () => {
  try {
    console.log("🔍 Fetching Amazon orders...");
    let allOrders = [];
    let nextToken = null;
    let page = 1;

    do {
      const params = nextToken
        ? { operation: "getOrders", endpoint: "orders", query: { NextToken: nextToken } }
        : { operation: "getOrders", endpoint: "orders", query: { MarketplaceIds: ["A21TJRUUN4KGV"], CreatedAfter: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), IncludeOrderItems: true } };

      const response = await spClient.callAPI(params);
      if (response.Orders && Array.isArray(response.Orders)) {
        allOrders = allOrders.concat(response.Orders);
        console.log(`📦 Page ${page}: ${response.Orders.length} orders fetched (total: ${allOrders.length})`);
      }
      nextToken = response.NextToken || null;
      page++;
    } while (nextToken);

    console.log(`✅ Finished fetching. Total Orders: ${allOrders.length}`);
    return allOrders;
  } catch (error) {
    console.error("❌ Error fetching Amazon orders:", error);
    return [];
  }
};

// Fetch product price from Amazon SP-API
const fetchProductPrice = async (asin) => {
  try {
    const response = await spClient.callAPI({
      operation: "getItemOffers",
      endpoint: "productPricing",
      query: { MarketplaceId: "A21TJRUUN4KGV", ItemCondition: "New" },
      path: { Asin: asin }
    });
    return response.Offers?.[0]?.ListingPrice?.Amount || "0.00";
  } catch (error) {
    console.error(`❌ Error fetching price for ASIN ${asin}:`, error);
    return "0.00";
  }
};

// Main function: fetch orders, products, and save everything
const fetchAndSaveAmazonOrdersAndProducts = async () => {
  try {
    const orders = await fetchAmazonOrders();
    if (!orders.length) return console.warn("⚠️ No orders found.");

    const allAsins = new Set();

    for (let order of orders) {
      let orderItemsResponse;
      try {
        orderItemsResponse = await spClient.callAPI({ operation: "getOrderItems", endpoint: "orders", path: { orderId: order.AmazonOrderId } });
      } catch (err) {
        console.error(`❌ Failed to fetch items for order ${order.AmazonOrderId}:`, err);
        continue;
      }

      const lineItems = (orderItemsResponse?.OrderItems || []).map(item => {
        if (item.ASIN) allAsins.add(item.ASIN);
        return { asin: item.ASIN, title: item.Title, quantity: item.QuantityOrdered, price: item.ItemPrice?.Amount || "0.00" };
      });

      await AmazonOrder.findOneAndUpdate(
        { amazon_order_id: order.AmazonOrderId },
        {
          amazon_order_id: order.AmazonOrderId,
          order_status: order.OrderStatus?.toLowerCase() === "shipped"
            ? "delivered"
            : order.OrderStatus,

          total_amount: order.OrderTotal?.Amount || "0.00",
          currency_code: order.OrderTotal?.CurrencyCode || "USD",
          purchase_date: order.PurchaseDate,
          last_update_date: order.LastUpdateDate || new Date(),
          payment_method: order.PaymentMethod || "",
          buyer_info: { email: order.BuyerInfo?.BuyerEmail || "" },
          shipping_address: {
            city: order.ShippingAddress?.City || "",
            state_or_region: order.ShippingAddress?.StateOrRegion || "",
            postal_code: order.ShippingAddress?.PostalCode || "",
            country_code: order.ShippingAddress?.CountryCode || ""
          },
          earliest_ship_date: order.EarliestShipDate,
          earliest_delivery_date: order.EarliestDeliveryDate,
          line_items: lineItems,
          source: "amazon",
          message: ""
        },
        { upsert: true, new: true }
      );

      console.log(`✅ Order ${order.AmazonOrderId} saved with ${lineItems.length} items`);
    }

    // Save products & sync Book model
    // --- Save products & sync Book model
    for (let asin of allAsins) {
      try {
        const product = await spClient.callAPI({
          operation: "getCatalogItem",
          endpoint: "catalogItems",
          path: { asin },
          query: { marketplaceIds: ["A21TJRUUN4KGV"], includedData: "summaries,images,attributes" }
        });

        const attributes = product.attributes || {};
        const author = attributes.author?.[0]?.value || "Unknown";
        const itemName = attributes.item_name?.[0]?.value || product.summaries?.[0]?.itemName || "No title";
        const imageUrl = product.images?.[0]?.images?.find(img => img.variant === "MAIN")?.link || "";
        const price = await fetchProductPrice(asin);

        // --- Product logic using only 'asin' as identifier ---
        const existingProduct = await Product.findOne({ asin });
        let updatedSources = existingProduct ? (Array.isArray(existingProduct.source) ? existingProduct.source : [existingProduct.source]) : [];
        if (!updatedSources.includes("amazon")) updatedSources.push("amazon");

        await Product.findOneAndUpdate(
          { asin }, // only match by ASIN
          {
            asin,
            name: itemName,
            author_name: author,
            price,
            description: attributes.product_description?.[0]?.value || "No description",
            short_description: attributes.item_type_name?.[0]?.value || "No short description",
            stock_quantity: 0,
            images: imageUrl ? [{ src: imageUrl }] : [],
            source: updatedSources,
            date_modified: new Date().toISOString(),
            created_date: new Date().toISOString()
          },
          { upsert: true }
        );

        console.log(`✅ Product ${asin} saved`);

        // --- Sync Book model ---
        await syncBookFromExternalSource({
          title: itemName,
          price,
          description: attributes.product_description?.[0]?.value || "No description",
          images: imageUrl ? [{ src: imageUrl }] : [],
          bindingSize: [],
        }, "amazon");

      } catch (err) {
        console.error(`❌ Failed to save product ${asin}:`, err);
      }
    }


    console.log("✅ All orders, products, and books processed successfully.");

  } catch (error) {
    console.error("❌ Error in fetching/saving Amazon orders/products:", error);
  }
};

module.exports = {
  fetchAmazonOrders,
  fetchProductPrice,
  fetchAndSaveAmazonOrdersAndProducts
};
