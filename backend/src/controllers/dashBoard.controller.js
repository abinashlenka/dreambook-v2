const catchAsync = require('../utils/catchAsync');
const AmazonOrders = require('../models/amazonOrders');
const WoocommerceOrders = require('../models/woocommerceOrders');
const { Book } = require('../models/book.model');
const { User } = require("../models/user.model");
const { model } = require('mongoose');
const { computeTopRatedAuthors } = require("../helpers/computeAuthors");
const logger = require('../config/logger');


// =========================
// ✅ 1. Optimized Dashboard Stats API
// =========================
const getDashboardStats = catchAsync(async (req, res) => {
  try {
    // 1. Fetch all books with authors and platforms
    const books = await Book.find(
      {
        author: { $exists: true, $ne: null },
        title: { $exists: true, $ne: "" },
        platforms: { $exists: true, $ne: [] }
      },
      "title author platforms"
    )
      .populate("author", "name email")
      .lean();

    if (!books.length) {
      return res.status(200).json({
        status: true,
        data: {
          totalBooks: 0,
          totalAuthors: 0,
          totalSales: 0,
          totalRoyalty: "₹0.00",
          platformEarnings: "₹0.00",
        },
        message: "No books found with author, title, and platforms",
      });
    }

    // Prepare lookup map: book title + platform → royalty
    const bookPlatformMap = {};
    books.forEach(book => {
      book.platforms.forEach(p => {
        bookPlatformMap[`${book.title.toLowerCase().trim()}_${p.platform}`] = p.royalty || 0;
      });
    });

    // 2. Aggregate all orders
    const orderAgg = await Order.aggregate([
      { $unwind: "$line_items" },
      {
        $project: {
          source: {
            $cond: [{ $eq: ["$source", "woocommerce"] }, "dream", "$source"], // normalize
          },
          name: { $toLower: { $trim: { input: "$line_items.name" } } },
          quantity: "$line_items.quantity",
          total: { $toDouble: { $ifNull: ["$total", 0] } },
        },
      },
      {
        $group: {
          _id: { name: "$name", source: "$source" },
          totalQty: { $sum: "$quantity" },
          totalEarnings: { $sum: "$total" },
        },
      },
    ]);

    // 3. Calculate global totals
    let totalRoyalty = 0;
    let totalSales = 0;
    let totalEarnings = 0;

    orderAgg.forEach(o => {
      const key = `${o._id.name}_${o._id.source}`;
      if (bookPlatformMap[key]) {
        const qty = o.totalQty;
        const royalty = bookPlatformMap[key];

        totalSales += qty;
        totalRoyalty += royalty * qty;
        totalEarnings += o.totalEarnings;
      }
    });

    // 4. Send admin-level response
    res.status(200).json({
      status: true,
      data: {
        totalBooks: books.length,
        totalAuthors: new Set(books.map(b => b.author?._id.toString())).size,
        totalSales,
        platformEarnings: `₹${totalEarnings.toFixed(2)}`,
        totalRoyalty: `₹${totalRoyalty.toFixed(2)}`,
      },
    });
  } catch (error) {
    logger.error("❌ Error fetching admin dashboard stats:", error);
    res.status(500).json({
      status: false,
      message: "Error fetching dashboard stats",
    });
  }
});


// =========================
// ✅ 2. Optimized Sales Report API
// =========================
const getSalesReport = catchAsync(async (req, res) => {
  const { month, year } = req.query;

  // 1. Validate inputs
  if (!month || isNaN(month) || month < 1 || month > 12) {
    return res.status(400).json({ status: false, message: "Valid month (1-12) is required" });
  }

  if (!year || isNaN(year) || year.toString().length !== 4) {
    return res.status(400).json({ status: false, message: "Valid year (YYYY) is required" });
  }

  const monthNum = Number(month);
  const yearNum = Number(year);

  const startDate = new Date(yearNum, monthNum - 1, 1);
  const endDate = new Date(yearNum, monthNum, 0, 23, 59, 59, 999);

  // 2. Fetch all books with authors and platforms
  const books = await Book.find(
    {
      author: { $exists: true, $ne: null },
      title: { $exists: true, $ne: "" },
      platforms: { $exists: true, $ne: [] },
    },
    "title author platforms"
  )
    .populate("author", "name email role")
    .lean();

  if (!books.length) {
    return res.status(200).json({
      status: true,
      filter: { month, year },
      data: {
        totalBooks: 0,
        totalAuthors: 0,
        platforms: {
          dream: { totalSales: 0, totalRoyalty: "₹0.00", pending: {}, returned: {} },
          amazon: { totalSales: 0, totalRoyalty: "₹0.00", pending: {}, returned: {} },
        },
      },
    });
  }

  // 3. Prepare lookup map for royalties
  const bookPlatformMap = {};
  const bookTitlesSet = new Set();

  books.forEach(book => {
    const title = book.title.toLowerCase().trim();
    bookTitlesSet.add(title);
    book.platforms.forEach(p => {
      bookPlatformMap[`${title}_${p.platform}`] = p.royalty || 0;
    });
  });

  // 4. Aggregate orders
  const orderAgg = await Order.aggregate([
    { $match: { createdAt: { $gte: startDate, $lte: endDate } } },
    { $unwind: "$line_items" },
    {
      $project: {
        source: { $cond: [{ $eq: ["$source", "woocommerce"] }, "dream", "$source"] }, // normalize woo
        name: { $toLower: { $trim: { input: "$line_items.name" } } },
        quantity: "$line_items.quantity",
        status: "$status",
        date_created: "$date_created"
      },
    },
    { $match: { name: { $in: Array.from(bookTitlesSet) } } },
    {
      $group: {
        _id: { name: "$name", source: "$source", status: "$status" },
        totalQty: { $sum: "$quantity" },
        minDate: { $min: "$date_created" }, // earliest created date for filtering
      },
    },
  ]);

  // 5. Initialize platform stats
  const platforms = {
    dream: { totalSales: 0, totalRoyalty: 0, pending: { totalQty: 0, totalRoyalty: 0 }, returned: { totalQty: 0, totalRoyalty: 0 } },
    amazon: { totalSales: 0, totalRoyalty: 0, pending: { totalQty: 0, totalRoyalty: 0 }, returned: { totalQty: 0, totalRoyalty: 0 } },
  };
  console.log("orderAgg", orderAgg);

  // 6. Apply 10-day policy + calculate stats
  orderAgg.forEach(o => {
    const orderDate = new Date(o.minDate);
    const cutoffDate = new Date(orderDate);
    cutoffDate.setDate(orderDate.getDate() + 10);

    const platform = o._id.source === "amazon" ? "amazon" : "dream";
    const key = `${o._id.name}_${platform}`;
    const qty = o.totalQty;
    const royalty = bookPlatformMap[key] || 0;

    if (cutoffDate > endDate) {
      // still within 10-day window → force pending
      platforms[platform].pending.totalQty += qty;
      platforms[platform].pending.totalRoyalty += royalty * qty;
    } else {
      // outside 10-day window → use real status
      if (o._id.status === "completed" || o._id.status === "delivered") {
        platforms[platform].totalSales += qty;
        platforms[platform].totalRoyalty += royalty * qty;
      }
      else if (o._id.status === "pending") {
        platforms[platform].pending.totalQty += qty;
        platforms[platform].pending.totalRoyalty += royalty * qty;
      } else if (o._id.status === "returned") {
        platforms[platform].returned.totalQty += qty;
        platforms[platform].returned.totalRoyalty += royalty * qty;
      }
    }
  });

  // 7. Build final response
  const report = {
    totalBooks: books.length,
    totalAuthors: new Set(books.map(b => b.author?._id.toString())).size,
    platforms: {
      dream: {
        totalSales: platforms.dream.totalSales,
        totalRoyalty: `₹${platforms.dream.totalRoyalty.toFixed(2)}`,
        pending: {
          totalQty: platforms.dream.pending.totalQty,
          totalRoyalty: `₹${platforms.dream.pending.totalRoyalty.toFixed(2)}`
        },
        returned: {
          totalQty: platforms.dream.returned.totalQty,
          totalRoyalty: `₹${platforms.dream.returned.totalRoyalty.toFixed(2)}`
        }
      },
      amazon: {
        totalSales: platforms.amazon.totalSales,
        totalRoyalty: `₹${platforms.amazon.totalRoyalty.toFixed(2)}`,
        pending: {
          totalQty: platforms.amazon.pending.totalQty,
          totalRoyalty: `₹${platforms.amazon.pending.totalRoyalty.toFixed(2)}`
        },
        returned: {
          totalQty: platforms.amazon.returned.totalQty,
          totalRoyalty: `₹${platforms.amazon.returned.totalRoyalty.toFixed(2)}`
        }
      }
    }
  };

  res.status(200).json({
    status: true,
    filter: { month, year },
    data: report,
  });
});


const getAuthorDashboard = catchAsync(async (req, res) => {
  try {
    const { id } = req.params; // Author ID

    // 1. Fetch author details
    const author = await User.findById(id).select("name email role");
    if (!author || author.role !== "author") {
      return res.status(404).json({ status: false, message: "Author not found" });
    }

    // 2. Fetch all books with platforms (only bookId + platforms)
    const books = await Book.find({ author: id }).select("title platforms").lean();

    if (!books.length) {
      return res.status(200).json({
        status: true,
        data: {
          author: { id: author._id, name: author.name, email: author.email },
          totalBooks: 0,
          totalRoyalty: "₹0.00",
          totalSales: 0,
        },
      });
    }

    // Prepare lookup map for book title → platforms (for royalty)
    const bookPlatformMap = {};
    books.forEach(book => {
      book.platforms.forEach(p => {
        bookPlatformMap[`${book.title.toLowerCase().trim()}_${p.platform}`] = p.royalty || 0;
      });
    });

    // 3. Use aggregation on Orders directly
    const orderAgg = await Order.aggregate([
      { $unwind: "$line_items" },
      {
        $project: {
          source: {
            $cond: [{ $eq: ["$source", "woocommerce"] }, "dream", "$source"],
          },
          name: { $toLower: { $trim: { input: "$line_items.name" } } },
          quantity: "$line_items.quantity",
        },
      },
      {
        $group: {
          _id: { name: "$name", source: "$source" },
          totalQty: { $sum: "$quantity" },
        },
      },
    ]);

    // 4. Match with books
    let totalRoyalty = 0;
    let totalSales = 0;

    orderAgg.forEach(o => {
      const key = `${o._id.name}_${o._id.source}`;
      if (bookPlatformMap[key]) {
        const qty = o.totalQty;
        const royalty = bookPlatformMap[key];

        totalSales += qty;
        totalRoyalty += royalty * qty;
      }
    });

    // 5. Send response
    res.status(200).json({
      status: true,
      data: {

        totalBooks: books.length,
        totalRoyalty: `₹${totalRoyalty.toFixed(2)}`,
        totalSales,
      },
    });
  } catch (error) {
    logger.error("❌ Error fetching author dashboard data:", error);
    res.status(500).json({
      status: false,
      message: "Error fetching author dashboard data",
    });
  }
});


const getAuthorSalesReport = catchAsync(async (req, res) => {
  const { month, year } = req.query;
  const authorId = req.user._id;

  if (!month || isNaN(month) || month < 1 || month > 12) {
    return res.status(400).json({ status: false, message: "Valid month (1-12) is required" });
  }

  if (!year || isNaN(year) || year.toString().length !== 4) {
    return res.status(400).json({ status: false, message: "Valid year (YYYY) is required" });
  }

  const monthNum = Number(month);
  const yearNum = Number(year);

  const startDate = new Date(yearNum, monthNum - 1, 1);
  const endDate = new Date(yearNum, monthNum, 0, 23, 59, 59, 999);

  // 🔹 Fetch author
  const author = await User.findById(authorId).select("name email role");
  if (!author || author.role !== "author") {
    return res.status(404).json({ status: false, message: "Author not found" });
  }

  // 🔹 Fetch books of author
  const books = await Book.find({ author: authorId }).select("title platforms").lean();
  if (!books.length) {
    return res.status(200).json({
      status: true,
      data: {
        totalBooks: 0,
        platforms: {},
      },
    });
  }

  // 🔹 Map book+platform → royalty
  const bookPlatformMap = {};
  const bookTitlesSet = new Set();
  books.forEach(book => {
    const title = book.title.toLowerCase().trim();
    bookTitlesSet.add(title);
    book.platforms.forEach(p => {
      bookPlatformMap[`${title}_${p.platform}`] = p.royalty || 0;
    });
  });

  // 🔹 Fetch all orders in given month
  const orders = await Order.find({
    createdAt: { $gte: startDate, $lte: endDate },
  }).lean();

  // 🔹 Group stats per platform
  const platformStats = {};

  for (const order of orders) {
    const platform = order.source === "woocommerce" ? "dream" : order.source;
    const orderDate = new Date(order.createdAt);

    for (const item of order.line_items) {
      const name = item.name.toLowerCase().trim();
      if (!bookTitlesSet.has(name)) continue; // skip if not this author's book

      const qty = item.quantity;
      const royaltyPerBook = bookPlatformMap[`${name}_${platform}`] || 0;
      const totalRoyaltyForItems = qty * royaltyPerBook;

      // ensure platform key exists
      if (!platformStats[platform]) {
        platformStats[platform] = {
          totalSales: 0,
          totalRoyalty: 0,
          pending: { totalQty: 0, totalRoyalty: 0 },
          returned: { totalQty: 0, totalRoyalty: 0 },
        };
      }

      // 🔹 Apply 10-day return policy
      const tenDaysAfter = new Date(orderDate);
      tenDaysAfter.setDate(orderDate.getDate() + 10);

      if (order.status === "returned") {
        platformStats[platform].returned.totalQty += qty;
        platformStats[platform].returned.totalRoyalty += totalRoyaltyForItems;
      } else if (order.status === "completed" || order.status === "delivered") {
        if (new Date() < tenDaysAfter) {
          // Still within 10-day return window → pending
          platformStats[platform].pending.totalQty += qty;
          platformStats[platform].pending.totalRoyalty += totalRoyaltyForItems;
        } else {
          // Beyond 10 days → confirmed sales
          platformStats[platform].totalSales += qty;
          platformStats[platform].totalRoyalty += totalRoyaltyForItems;
        }
      }
    }
  }

  // 🔹 Format royalty as currency
  for (const p in platformStats) {
    platformStats[p].totalRoyalty = `₹${platformStats[p].totalRoyalty.toFixed(2)}`;
    platformStats[p].pending.totalRoyalty = `₹${platformStats[p].pending.totalRoyalty.toFixed(2)}`;
    platformStats[p].returned.totalRoyalty = `₹${platformStats[p].returned.totalRoyalty.toFixed(2)}`;
  }

  res.status(200).json({
    status: true,
    filter: { month, year, authorId },
    data: {
      totalBooks: books.length,
      platforms: platformStats,
    },
  });
});





module.exports = {
  getDashboardStats,
  getSalesReport,
  getAuthorDashboard,
  getAuthorSalesReport,
  
};








