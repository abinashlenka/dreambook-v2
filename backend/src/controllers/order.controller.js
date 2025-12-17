const { Book } = require("../models/book.model");
const AmazonOrders = require("../models/amazonOrders");
const WoocommerceOrders = require("../models/woocommerceOrders");
const FlipkartOrder = require("../models/flipkartOrderds");

// =====================================================
// Helper: Fetch and merge orders for a book or all books
// =====================================================
const fetchMergedOrders = async (bookTitle = null, startDate = null, endDate = null) => {
  const amazonFilter = {};
  const wooFilter = {};
  const FlipkartFilter={};

  if (bookTitle) {
    const escapedTitle = bookTitle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const titleRegex = new RegExp(escapedTitle, "i");
    amazonFilter["line_items"] = { $elemMatch: { title: titleRegex } };
    wooFilter["line_items"] = { $elemMatch: { title: titleRegex } };
    FlipkartFilter["line_items"] = { $elemMatch: { title: titleRegex } };
  }

  if (startDate && endDate) {
    amazonFilter.purchase_date = { $gte: startDate, $lte: endDate };
    wooFilter.purchase_date = { $gte: startDate, $lte: endDate };
    FlipkartFilter.purchase_date = { $gte: startDate, $lte: endDate };
  }

  const [amazonOrders, wooOrdersRaw,FlipkartOrd] = await Promise.all([
    AmazonOrders.find(amazonFilter).lean(),
    WoocommerceOrders.find(wooFilter).lean(),
    FlipkartOrder.find(FlipkartFilter).lean(),
  ]);

  const merged = [];

  const normalizeOrder = (order, source) => {
    const line_items = (order.line_items || []).map((item) => ({
      title: item.title?.trim().toLowerCase() || "",
      quantity: Number(item.quantity) || 0,
      price: parseFloat(item.price || 0),
      platform: source,
    }));

    if (!line_items.length) return null;

    const createdAt =
      order.purchase_date instanceof Date
        ? order.purchase_date
        : new Date(order.purchase_date);

    const lastUpdate = order.last_update_date
      ? new Date(order.last_update_date)
      : createdAt;

    return {
      source,
      status: (order.order_status || "").toLowerCase().trim(),
      createdAt,
      lastUpdate,
      line_items,
      total: parseFloat(order.total_amount || 0),
    };
  };

  amazonOrders.forEach((order) => {
    const normalized = normalizeOrder(order, "amazon");
    if (normalized) merged.push(normalized);
  });

  wooOrdersRaw.forEach((order) => {
    const normalized = normalizeOrder(order, "dream");
    if (normalized) merged.push(normalized);
  });
  FlipkartOrd.forEach((order) => {
    const normalized = normalizeOrder(order, "flipkart");
    if (normalized) merged.push(normalized);
  });

  return merged;
};

// ===============================
// GET ALL ORDERS
// ===============================
const getOrders = async (req, res) => {
  try {
    const { source } = req.query;
    let orders = await fetchMergedOrders();

    if (source) {
      orders = orders.filter((o) => o.source === source.toLowerCase());
    }

    if (!orders.length) {
      return res
        .status(200)
        .json({ status: true, data: [], message: "No orders found" });
    }

    res.status(200).json({ status: true, data: orders });
  } catch (error) {
    console.error("❌ Error fetching orders:", error);
    res.status(500).json({ status: false, message: "Error fetching orders" });
  }
};

// ===============================
// GET ORDERS BY BOOK NAME
// ===============================
const getOrdersByName = async (req, res) => {
  try {
    const { name, bookId } = req.params;

    const orders = await fetchMergedOrders(name);

    const book = await Book.findOne({
      _id: bookId,
      title: { $regex: new RegExp(`^${name}$`, "i") },
    }).select("title platforms");

    res.status(200).json({ status: true, orders, book });
  } catch (error) {
    console.error("❌ Error fetching orders by name:", error);
    res
      .status(500)
      .json({ status: false, message: "Server error while fetching orders" });
  }
};

// =====================================================
// GET ROYALTY DETAILS (final corrected total logic)
// =====================================================
const getRoyaltyDetails = async (req, res) => {
  try {
    const { name, bookId } = req.params;
    const { month, year } = req.query;

    const now = new Date();
    const filterMonth = month ? parseInt(month, 10) : now.getMonth() + 1;
    const filterYear = year ? parseInt(year, 10) : now.getFullYear();

    const startDate = new Date(filterYear, filterMonth - 1, 1);
    const endDate = new Date(filterYear, filterMonth, 0, 23, 59, 59, 999);

    const book = await Book.findById(bookId).select("title platforms author lastRoyaltyPayDate lastRoyaltyPaidForMonth lastRoyaltyPaidForYear");

    const platformsMap = {};
    const requiredPlatforms = ["amazon", "dream", "flipkart"];

    if (book && Array.isArray(book.platforms)) {
      for (const p of book.platforms) {
        if (!p || !p.platform) continue;
        platformsMap[p.platform.toLowerCase()] = {
          platform: p.platform.toLowerCase(),
          royalty: Number(p.royalty) || 0,
        };
      }
    }

    for (const p of requiredPlatforms) {
      if (!platformsMap[p]) platformsMap[p] = { platform: p, royalty: 0 };
    }

    const results = {};
    const isAuthor =
      book && book.author
        ? req.user && req.user._id.toString() === book.author.toString()
        : false;

    for (const key of Object.keys(platformsMap)) {
      results[key] = {
        royaltyPerCopy: platformsMap[key].royalty,
        totalQuantity: 0,
        confirmedQuantity: 0,
        totalRoyalty: 0,
        pendingQuantity: 0,
        pendingRoyalty: 0,
        returnedQuantity: 0,
        returnedRoyalty: 0,
        earnings: 0,
      };
    }

    const TEN_DAYS_MS = 10 * 24 * 60 * 60 * 1000;
    const orders = await fetchMergedOrders(name, startDate, endDate);

    const normalize = (str) =>
      str?.toLowerCase().replace(/\s+/g, " ").trim() || "";
    const bookTitleNorm = normalize(name);

    for (const order of orders) {
  for (const item of order.line_items || []) {
    if (!item || !item.title) continue;

    const itemTitleNorm = normalize(item.title);
    if (!itemTitleNorm.includes(bookTitleNorm)) continue;

    const platformKey = item.platform || "dream";
    if (!results[platformKey]) {
      results[platformKey] = {
        royaltyPerCopy: 0,
        totalQuantity: 0,
        confirmedQuantity: 0,
        totalRoyalty: 0,
        pendingQuantity: 0,
        pendingRoyalty: 0,
        returnedQuantity: 0,
        returnedRoyalty: 0,
        earnings: 0,
      };
    }

    const royaltyPerCopy = Number(platformsMap[platformKey]?.royalty || 0);
    const qty = Number(item.quantity) || 1;
    const lineTotal = parseFloat(item.price || 0) * qty;
    const status = (order.status || "").toLowerCase().trim();
    const orderAge = new Date() - new Date(order.lastUpdate || order.createdAt);

    // 🧮 Count quantity always (unless it's corrupted data)
    results[platformKey].totalQuantity += qty;

    // ===============================
    // ✅ Status Handling with Payment Logic
    // ===============================
    
    // Check for cancelled/returned status FIRST (highest priority)
    if (["canceled", "cancelled", "refunded", "returned"].includes(status)) {
      // 🔄 Returned / Cancelled
      results[platformKey].returnedQuantity += qty;
      results[platformKey].returnedRoyalty += qty * royaltyPerCopy;
    }
    // Then check for completed orders
    else if (["completed", "shipped", "delivered"].includes(status)) {
      if (orderAge > TEN_DAYS_MS) {
        // ✅ Confirmed - Check if this order should be excluded due to payment
        let shouldIncludeRoyalty = true;
        
        if (book && book.lastRoyaltyPayDate && 
            book.lastRoyaltyPaidForMonth >= filterMonth && 
            book.lastRoyaltyPaidForYear >= filterYear) {
          
          const paymentDate = new Date(book.lastRoyaltyPayDate);
          const orderDate = new Date(order.createdAt);
          
          // Only include orders placed AFTER the payment date
          shouldIncludeRoyalty = orderDate > paymentDate;
        }
        
        if (shouldIncludeRoyalty) {
          results[platformKey].confirmedQuantity += qty;
          results[platformKey].totalRoyalty += qty * royaltyPerCopy;
          
          if (isAuthor) {
            results[platformKey].earnings += qty * royaltyPerCopy;
          } else {
            results[platformKey].earnings += lineTotal;
          }
        }
      } else {
        // ⏳ Pending (less than 10 days)
        results[platformKey].pendingQuantity += qty;
        results[platformKey].pendingRoyalty += qty * royaltyPerCopy;
      }
    } else {
      // 🕓 Other pending-like statuses
      results[platformKey].pendingQuantity += qty;
      results[platformKey].pendingRoyalty += qty * royaltyPerCopy;
    }
  }
}


    // ===============================
    // ✅ Combine Totals
    // ===============================
    const summary = Object.values(results).reduce(
      (acc, curr) => {
        acc.totalQuantity += curr.totalQuantity;
        acc.confirmedQuantity += curr.confirmedQuantity;
        acc.totalRoyalty += curr.totalRoyalty;
        acc.pendingQuantity += curr.pendingQuantity;
        acc.pendingRoyalty += curr.pendingRoyalty;
        acc.returnedQuantity += curr.returnedQuantity;
        acc.returnedRoyalty += curr.returnedRoyalty;
        acc.earnings += curr.earnings || 0;
        return acc;
      },
      {
        totalQuantity: 0,
        confirmedQuantity: 0,
        totalRoyalty: 0,
        pendingQuantity: 0,
        pendingRoyalty: 0,
        returnedQuantity: 0,
        returnedRoyalty: 0,
        earnings: 0,
      }
    );

    // ✅ Add total royalty to pay (only confirmed royalties, not subtracting returned)
    // totalRoyalty already contains only confirmed orders, so no need to subtract returned
    const totalRoyaltyToPay = summary.totalRoyalty;

    // Check payment status for this book and month/year
    const isPaid = book && book.lastRoyaltyPayDate && 
                   book.lastRoyaltyPaidForMonth >= filterMonth && 
                   book.lastRoyaltyPaidForYear >= filterYear;

    res.set("Cache-Control", "no-store, no-cache, must-revalidate, private");
    res.status(200).json({
      book: book?.title || name,
      month: filterMonth,
      year: filterYear,
      platforms: results,
      summary: {
        ...summary,
        totalRoyaltyToPay:
          totalRoyaltyToPay < 0 ? 0 : parseFloat(totalRoyaltyToPay.toFixed(2)),
      },
      paymentStatus: {
        isPaid: isPaid,
        lastPaymentDate: book?.lastRoyaltyPayDate ? book.lastRoyaltyPayDate.toISOString() : null,
        paidForMonth: book?.lastRoyaltyPaidForMonth || null,
        paidForYear: book?.lastRoyaltyPaidForYear || null
      }
    });
  } catch (error) {
    console.error("❌ Error fetching royalty details:", error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  getOrders,
  getOrdersByName,
  getRoyaltyDetails,
};
