const catchAsync = require("../../utils/catchAsync");
const AmazonOrders = require('../../models/amazonOrders');
const WoocommerceOrders = require('../../models/woocommerceOrders');
const FlipkartOrder = require('../../models/flipkartOrderds');
const { Book } = require('../../models/book.model');
const { User } = require('../../models/user.model');
const logger = require('../../config/logger');

// ======================================================
// ✅ HELPER: Book matching function (same as admin controller)
// ======================================================
const findMatchingBook = (itemTitle, books) => {
    const normalizedItemTitle = itemTitle.toLowerCase().trim();

    // Try exact match first
    let matchedBook = books.find(b => normalizedItemTitle.includes(b.title.toLowerCase().trim()));

    // If no match, try reverse match (book title includes item title)
    if (!matchedBook) {
        matchedBook = books.find(b => b.title.toLowerCase().trim().includes(normalizedItemTitle));
    }

    return matchedBook;
};

// ======================================================
// ✅ HELPER: Get author books with populated data
// ======================================================
const getAuthorBooksWithDetails = async (authorId) => {
    return await Book.find(
        {
            author: authorId,
            title: { $exists: true, $ne: "" },
            platforms: { $exists: true, $ne: [] }
        },
        "title platforms price lastRoyaltyPayDate lastRoyaltyPaidForMonth lastRoyaltyPaidForYear"
    ).populate("author", "name email").lean();
};

// ======================================================
// ✅ HELPER: Merge author-specific orders (Amazon + WooCommerce) - Enhanced
// ======================================================
const mergeAuthorOrders = async (authorBooks = [], startDate, endDate) => {
    const [amazonOrdersRaw, wooOrdersRaw, FlipkartOrdersRaw] = await Promise.all([
        AmazonOrders.find({ purchase_date: { $gte: startDate, $lte: endDate } }).lean(),
        WoocommerceOrders.find({ purchase_date: { $gte: startDate, $lte: endDate } }).lean(),
        FlipkartOrder.find({ purchase_date: { $gte: startDate, $lte: endDate } }).lean(),
    ]);

    const unifiedOrders = [];
    const parseDate = (str, fallback) => {
        if (!str) return fallback;
        const d = new Date(str);
        return isNaN(d) ? fallback : d;
    };

    // Amazon Orders
    for (const order of amazonOrdersRaw) {
        const filteredItems = [];

        for (const item of order.line_items || []) {
            const matchedBook = findMatchingBook(item.title, authorBooks);
            if (matchedBook) {
                filteredItems.push({
                    title: item.title?.toLowerCase().trim() || '',
                    quantity: item.quantity || 0,
                    price: parseFloat(item.price) || 0,
                });
            }
        }

        if (!filteredItems.length) continue;

        unifiedOrders.push({
            source: 'amazon',
            status: order.order_status?.toLowerCase() || '',
            createdAt: parseDate(order.purchase_date, new Date()),
            lastUpdate: parseDate(order.last_update_date, parseDate(order.purchase_date, new Date())),
            line_items: filteredItems,
            total: parseFloat(order.total_amount) || 0,
        });
    }

    // WooCommerce Orders
    for (const order of wooOrdersRaw) {
        const filteredItems = [];

        for (const item of order.line_items || []) {
            const matchedBook = findMatchingBook(item.title, authorBooks);
            if (matchedBook) {
                filteredItems.push({
                    title: item.title?.toLowerCase().trim() || '',
                    quantity: item.quantity || 0,
                    price: parseFloat(item.price) || 0,
                });
            }
        }

        if (!filteredItems.length) continue;

        unifiedOrders.push({
            source: 'dream', // normalize WooCommerce as "dream"
            status: order.order_status?.toLowerCase() || '',
            createdAt: parseDate(order.purchase_date, new Date()),
            lastUpdate: parseDate(order.last_update_date, parseDate(order.purchase_date, new Date())),
            line_items: filteredItems,
            total: parseFloat(order.total_amount) || 0,
        });
    }
    // Flipkart Orders
    for (const order of FlipkartOrdersRaw) {
        const filteredItems = [];
        for (const item of order.line_items || []) {
            const matchedBook = findMatchingBook(item.title, authorBooks);
            if (matchedBook) {
                filteredItems.push({
                    title: item.title?.toLowerCase().trim() || '',
                    quantity: item.quantity || 0,
                    price: parseFloat(item.price) || 0,
                });
            }
        }
        if (!filteredItems.length) continue;
        unifiedOrders.push({
            source: 'flipkart',
            status: order.order_status?.toLowerCase() || '',
            createdAt: parseDate(order.purchase_date, new Date()),
            lastUpdate: parseDate(order.last_update_date, parseDate(order.purchase_date, new Date())),
            line_items: filteredItems,
            total: parseFloat(order.total_amount) || 0,
        });
    }


    return unifiedOrders;
};

// ======================================================
// ✅ 1. Author Dashboard (total books, total sales, total royalty)
// ======================================================
const getAuthorDashboard = catchAsync(async (req, res) => {
    try {
        const { id } = req.params;

        const author = await User.findById(id).select("name email role");
        if (!author || author.role !== "author") {
            return res.status(404).json({ status: false, message: "Author not found" });
        }

        const books = await getAuthorBooksWithDetails(id);
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

        // Build platform → [{title, royalty}] map for easier matching
        const platformRoyaltyMap = {};
        books.forEach(book => {
            const baseTitle = book.title.toLowerCase();
            book.platforms.forEach(p => {
                if (!platformRoyaltyMap[p.platform]) platformRoyaltyMap[p.platform] = [];
                platformRoyaltyMap[p.platform].push({ title: baseTitle, royalty: p.royalty || 0 });
            });
        });

        // Fetch all orders for these books
        const orders = await mergeAuthorOrders(
            books,
            new Date(0), // from epoch
            new Date()   // to now
        );

        let totalRoyalty = 0;
        let totalSales = 0;
        const now = new Date();

        for (const order of orders) {
            const platform = order.source;
            const list = platformRoyaltyMap[platform] || [];

            // Only consider shipped/completed and after 10 days from lastUpdate
            const tenDaysAfter = new Date(order.lastUpdate);
            tenDaysAfter.setDate(tenDaysAfter.getDate() + 10);

            const isCompleted = order.status === 'shipped' || order.status === 'completed' || order.status === 'delivered' || order.status === 'DELIVERED';
            if (!isCompleted || now < tenDaysAfter) continue;

            for (const item of order.line_items) {
                const matchedBook = findMatchingBook(item.title, books);
                if (!matchedBook) continue;

                const maxRoyalty = Math.max(...matchedBook.platforms.map(p => p.royalty || 0));
                totalRoyalty += maxRoyalty * item.quantity;
                totalSales += item.quantity;
            }
        }

        res.status(200).json({
            status: true,
            data: {
                author: { id: author._id, name: author.name, email: author.email },
                totalBooks: books.length,
                totalRoyalty: `₹${(totalRoyalty || 0).toFixed(2)}`,
                totalSales: totalSales || 0,
            },
        });
    } catch (error) {
        logger.error("❌ Error fetching author dashboard data:", error);
        res.status(500).json({ status: false, message: "Error fetching author dashboard data" });
    }
});


// ======================================================
// ======================================================
// ✅ 2. Author Sales Report (monthly, includes total quantity fix)
// ======================================================
const getAuthorSalesReport = catchAsync(async (req, res) => {
    try {
        const { month, year } = req.query;
        const authorId = req.user._id;

        // 🧩 Validation
        if (!month || isNaN(month) || month < 1 || month > 12)
            return res.status(400).json({ status: false, message: "Valid month (1-12) is required" });

        if (!year || isNaN(year) || year.toString().length !== 4)
            return res.status(400).json({ status: false, message: "Valid year (YYYY) is required" });

        const monthNum = Number(month);
        const yearNum = Number(year);
        const startDate = new Date(yearNum, monthNum - 1, 1);
        const endDate = new Date(yearNum, monthNum, 0, 23, 59, 59, 999);

        const author = await User.findById(authorId).select("name email role");
        if (!author || author.role !== "author") {
            return res.status(404).json({ status: false, message: "Author not found" });
        }

        const books = await getAuthorBooksWithDetails(authorId);

        // Default platform list (Amazon, Dream, Flipkart)
        const knownPlatforms = ["amazon", "dream", "flipkart"];

        // 🧩 Platform → royalty map
        const platformRoyaltyMap = {};
        const allPlatforms = new Set(knownPlatforms);

        books.forEach(book => {
            const baseTitle = book.title.toLowerCase();
            book.platforms.forEach(p => {
                allPlatforms.add(p.platform);
                if (!platformRoyaltyMap[p.platform]) platformRoyaltyMap[p.platform] = [];
                platformRoyaltyMap[p.platform].push({ title: baseTitle, royalty: p.royalty || 0 });
            });
        });

        // 🧩 Fetch all orders (Amazon, Dream/Woo, Flipkart)
        const orders = books.length
            ? await mergeAuthorOrders(books, startDate, endDate)
            : [];

        // 🧩 Initialize platform stats (zero defaults)
        const initStats = () => ({
            totalSales: 0,
            totalRoyalty: 0,
            pending: { totalQty: 0, totalRoyalty: 0 },
            returned: { totalQty: 0, totalRoyalty: 0 },
            totalEarnings: 0,
        });

        const platformStats = {};
        allPlatforms.forEach(p => {
            platformStats[p] = initStats();
        });

        const now = new Date();

        // 🧩 Calculate order stats (if orders exist)
        for (const order of orders) {
            const platform = order.source;
            if (!platformStats[platform]) platformStats[platform] = initStats();

            const tenDaysAfter = new Date(order.lastUpdate);
            tenDaysAfter.setDate(tenDaysAfter.getDate() + 10);
            const orderAge = now - new Date(order.lastUpdate);
            const TEN_DAYS_MS = 10 * 24 * 60 * 60 * 1000;

            const status = (order.status || "").toLowerCase();

            const isCompleted = ["completed", "shipped", "delivered"].includes(status);
            const isCancelled = ["canceled", "cancelled", "refunded", "returned", "return_requested"].includes(status);

            for (const item of order.line_items || []) {
                const matchedBook = findMatchingBook(item.title, books);
                if (!matchedBook) continue;

                const maxRoyalty = Math.max(...matchedBook.platforms.map(p => p.royalty || 0));
                const qty = item.quantity || 0;
                const totalRoyaltyForItems = qty * maxRoyalty;
                const totalEarningsForItems = (item.price || 0) * qty;

                // Always count total sales
                platformStats[platform].totalSales += qty;

                // Returned / Cancelled
                if (isCancelled) {
                    platformStats[platform].returned.totalQty += qty;
                    platformStats[platform].returned.totalRoyalty += totalRoyaltyForItems;
                }
                // Pending (<10 days or not completed)
                else if (isCompleted && orderAge < TEN_DAYS_MS) {
                    platformStats[platform].pending.totalQty += qty;
                    platformStats[platform].pending.totalRoyalty += totalRoyaltyForItems;
                }
                // Confirmed (completed & >10 days)
                else {
                    let shouldIncludeRoyalty = true;

                    if (
                        matchedBook.lastRoyaltyPayDate &&
                        matchedBook.lastRoyaltyPaidForMonth >= month &&
                        matchedBook.lastRoyaltyPaidForYear >= year
                    ) {
                        const paymentDate = new Date(matchedBook.lastRoyaltyPayDate);
                        const orderDate = new Date(order.createdAt);
                        shouldIncludeRoyalty = orderDate > paymentDate;
                    }

                    if (shouldIncludeRoyalty) {
                        platformStats[platform].totalRoyalty += totalRoyaltyForItems;
                    }
                }

                // Add total earnings
                platformStats[platform].totalEarnings += totalEarningsForItems;
            }
        }

        // 💰 Format currency and ensure 0 values for missing platforms
        knownPlatforms.forEach(p => {
            if (!platformStats[p]) platformStats[p] = initStats();

            const ps = platformStats[p];
            ps.totalRoyalty = `₹${(ps.totalRoyalty || 0).toFixed(2)}`;
            ps.pending.totalRoyalty = `₹${(ps.pending.totalRoyalty || 0).toFixed(2)}`;
            ps.returned.totalRoyalty = `₹${(ps.returned.totalRoyalty || 0).toFixed(2)}`;
            ps.totalEarnings = `₹${(ps.totalEarnings || 0).toFixed(2)}`;
        });

        res.status(200).json({
            status: true,
            filter: { month, year },
            data: {
                totalBooks: books.length || 0,
                platforms: platformStats, // Always includes amazon, dream, flipkart with 0s
            },
        });
    } catch (error) {
        logger.error("❌ Error fetching author sales report:", error);
        res.status(500).json({ status: false, message: "Error fetching author sales report" });
    }
});


// ======================================================
// ✅ 3. Author Book-Wise Report (monthly, per book)
// ======================================================
const getAuthorBookWiseReport = catchAsync(async (req, res) => {
    try {
        const { month, year } = req.query;
        const authorId = req.user._id || req.params.userId;

        // Validate inputs
        if (!month || isNaN(month) || month < 1 || month > 12)
            return res.status(400).json({ status: false, message: "Valid month (1-12) is required" });
        if (!year || isNaN(year) || year.toString().length !== 4)
            return res.status(400).json({ status: false, message: "Valid year (YYYY) is required" });

        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0, 23, 59, 59, 999);
        const now = new Date();
        const TEN_DAYS_MS = 10 * 24 * 60 * 60 * 1000;

        // Fetch author + books
        const author = await User.findById(authorId).select("name email role");
        if (!author || author.role !== "author") {
            return res.status(404).json({ status: false, message: "Author not found" });
        }

        const books = await getAuthorBooksWithDetails(authorId);
        if (!books.length) {
            return res.status(200).json({
                status: true,
                filter: { month, year },
                data: [],
            });
        }

        // Fetch only author's book orders
        const allOrders = await mergeAuthorOrders(
            books,
            startDate,
            endDate
        );

        const results = {}; // key: book title
        for (const book of books) {
            const maxRoyalty = Math.max(...book.platforms.map(p => p.royalty || 0));
            results[book.title] = {
                bookId: book._id,
                bookTitle: book.title,
                bookPrice: book.price || 0,
                royaltySetByAuthor: maxRoyalty,
                totalQuantity: 0,
                totalRoyalty: 0,
                pendingQuantity: 0,
                pendingRoyalty: 0,
                cancelledQuantity: 0,
                cancelledRoyalty: 0,
            };
        }

        for (const order of allOrders) {
            const platform = order.source;
            for (const item of order.line_items) {
                const matchedBook = findMatchingBook(item.title, books);
                if (!matchedBook) continue;

                const title = matchedBook.title;
                const maxRoyalty = Math.max(...matchedBook.platforms.map(p => p.royalty || 0));
                const royaltyPerCopy = maxRoyalty;
                const qty = Number(item.quantity) || 0;
                const itemRoyalty = qty * royaltyPerCopy;

                const isCancelled =
                    (platform === "amazon" && order.status === "canceled") ||
                    (platform === "dream" && order.status === "cancelled") ||
                    (platform === "flipkart" && order.status === "returned" || order.status === "return_requested" || order.status === "RETURN_REQUESTED")
                    ;
                const isCompleted =
                    ["completed", "shipped", "delivered", "DELEVERED"].includes(order.status);
                const orderAge = now - new Date(order.lastUpdate);

                const bookData = results[title];
                bookData.totalQuantity += qty;

                if (isCancelled) {
                    bookData.cancelledQuantity += qty;
                    bookData.cancelledRoyalty += itemRoyalty;
                } else if (isCompleted && orderAge < TEN_DAYS_MS) {
                    bookData.pendingQuantity += qty;
                    bookData.pendingRoyalty += itemRoyalty;
                } else {
                    bookData.totalRoyalty += itemRoyalty;
                }
            }
        }

        // Finalize & format
        const fmt = v => `₹${v.toFixed(2)}`;
        const finalData = Object.values(results)
            .filter(b => b.totalQuantity > 0) // only books with orders
            .map(b => {
                b.totalRoyaltyToPay = b.totalRoyalty - b.pendingRoyalty - b.cancelledRoyalty;
                if (b.totalRoyaltyToPay < 0) b.totalRoyaltyToPay = 0;

                // Check if royalty has been paid for this book
                const book = books.find(book => book.title === b.bookTitle);

                // Calculate royalty only for orders placed BEFORE the payment date
                let finalRoyaltyToPay = b.totalRoyaltyToPay;
                let isPaid = false;

                if (book && book.lastRoyaltyPayDate &&
                    book.lastRoyaltyPaidForMonth >= month &&
                    book.lastRoyaltyPaidForYear >= year) {

                    // Recalculate royalty excluding orders placed before payment date
                    const paymentDate = new Date(book.lastRoyaltyPayDate);
                    let recalculatedRoyalty = 0;

                    // Go through all orders for this book and only count those after payment date
                    for (const order of allOrders) {
                        const orderDate = new Date(order.createdAt);

                        // Only include orders placed AFTER the payment date
                        if (orderDate > paymentDate) {
                            for (const item of order.line_items) {
                                const matchedBook = findMatchingBook(item.title, books);
                                if (matchedBook && matchedBook.title === book.title) {
                                    const maxRoyalty = Math.max(...matchedBook.platforms.map(p => p.royalty || 0));
                                    const qty = Number(item.quantity) || 0;
                                    const itemRoyalty = qty * maxRoyalty;

                                    const status = order.status?.toLowerCase() || "";
                                    const isCompleted = ["completed", "shipped", "delivered", "DELEVERED"].includes(status);
                                    const isCancelled = ["canceled", "cancelled", "refunded", "returned", "return_requested", "RETURN_REQUESTED"].includes(status);
                                    const orderAge = now - new Date(order.lastUpdate);
                                    const TEN_DAYS_MS = 10 * 24 * 60 * 60 * 1000;

                                    // Only count confirmed orders (completed AND beyond 10 days)
                                    if (isCompleted && orderAge >= TEN_DAYS_MS && !isCancelled) {
                                        recalculatedRoyalty += itemRoyalty;
                                    }
                                }
                            }
                        }
                    }

                    finalRoyaltyToPay = recalculatedRoyalty;
                    isPaid = true; // Mark as paid but with recalculated amount
                }

                return {
                    bookId: b.bookId,
                    bookTitle: b.bookTitle,
                    bookPrice: fmt(b.bookPrice),
                    royaltySetByAuthor: fmt(b.royaltySetByAuthor),
                    totalQuantity: b.totalQuantity,
                    totalRoyalty: fmt(b.totalRoyalty),
                    pendingQuantity: b.pendingQuantity,
                    pendingRoyalty: fmt(b.pendingRoyalty),
                    cancelledQuantity: b.cancelledQuantity,
                    cancelledRoyalty: fmt(b.cancelledRoyalty),
                    totalRoyaltyToPay: fmt(finalRoyaltyToPay),
                    isPaid: isPaid,
                    lastPaymentDate: book?.lastRoyaltyPayDate ? book.lastRoyaltyPayDate.toISOString() : null,
                    paidForMonth: book?.lastRoyaltyPaidForMonth || null,
                    paidForYear: book?.lastRoyaltyPaidForYear || null
                };
            });

        res.status(200).json({
            status: true,
            filter: { month, year },
            author: { id: author._id, name: author.name, email: author.email },
            data: finalData,
        });
    } catch (error) {
        logger.error("❌ Error fetching author book-wise report:", error);
        res.status(500).json({ status: false, message: "Error fetching author book-wise report" });
    }
});




// ======================================================
// ✅ 4. Author Wise Report (for specific author - matches admin format)
// ======================================================
const getAuthorWiseReport = catchAsync(async (req, res) => {
    try {
        const { month, year } = req.query;
        const authorId = req.user._id || req.params.userId;

        // Validate inputs
        if (!month || isNaN(month) || month < 1 || month > 12)
            return res.status(400).json({ status: false, message: "Valid month (1-12) is required" });
        if (!year || isNaN(year) || year.toString().length !== 4)
            return res.status(400).json({ status: false, message: "Valid year (YYYY) is required" });

        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0, 23, 59, 59, 999);
        const now = new Date();
        const TEN_DAYS_MS = 10 * 24 * 60 * 60 * 1000;

        // Fetch author + books
        const author = await User.findById(authorId).select("name email role");
        if (!author || author.role !== "author") {
            return res.status(404).json({ status: false, message: "Author not found" });
        }

        const books = await getAuthorBooksWithDetails(authorId);
        if (!books.length) {
            return res.status(200).json({
                status: true,
                filter: { month, year },
                data: [],
            });
        }

        // Fetch orders for this author's books
        const allOrders = await mergeAuthorOrders(books, startDate, endDate);

        // Initialize author data structure (similar to admin's getAuthorWiseReport)
        const authorData = {
            authorId: author._id,
            authorName: author.name,
            authorEmail: author.email,
            totalBooks: books.length,
            totalSales: 0,
            confirmedQuantity: 0,
            pendingQuantity: 0,
            cancelledQuantity: 0,
            totalRoyalty: 0,
            pendingRoyalty: 0,
            cancelledRoyalty: 0,
            totalRoyaltyToPay: 0,
            totalEarnings: 0,
            books: {}
        };

        // Initialize book data
        books.forEach(book => {
            const maxRoyalty = Math.max(...book.platforms.map(p => p.royalty || 0));
            authorData.books[book.title] = {
                bookId: book._id,
                bookTitle: book.title,
                bookPrice: book.price || 0,
                royaltySetByAuthor: maxRoyalty,
                totalQuantity: 0,
                confirmedQuantity: 0,
                totalRoyalty: 0,
                pendingQuantity: 0,
                pendingRoyalty: 0,
                cancelledQuantity: 0,
                cancelledRoyalty: 0,
                totalEarnings: 0,
                totalRoyaltyToPay: 0,
            };
        });

        // Process orders
        for (const order of allOrders) {
            for (const item of order.line_items) {
                const matchedBook = findMatchingBook(item.title, books);
                if (!matchedBook) continue;

                const bookTitle = matchedBook.title;
                const bookData = authorData.books[bookTitle];
                const maxRoyalty = Math.max(...matchedBook.platforms.map(p => p.royalty || 0));
                const qty = Number(item.quantity) || 0;
                const totalRoyaltyForItems = qty * maxRoyalty;
                const totalEarningsForItems = qty * item.price;

                const status = order.status?.toLowerCase() || "";
                const isCompleted = ["completed", "shipped", "delivered"].includes(status);
                const isCancelled = ["canceled", "cancelled", "refunded", "returned"].includes(status);
                const orderAge = now - new Date(order.lastUpdate);

                // Always add total quantity
                bookData.totalQuantity += qty;
                authorData.totalSales += qty;

                // Cancelled / Returned
                if (isCancelled) {
                    bookData.cancelledQuantity += qty;
                    bookData.cancelledRoyalty += totalRoyaltyForItems;
                    authorData.cancelledQuantity += qty;
                    authorData.cancelledRoyalty += totalRoyaltyForItems;
                }
                // Pending (not completed OR within 10 days)
                else if (isCompleted && orderAge < TEN_DAYS_MS) {
                    bookData.pendingQuantity += qty;
                    bookData.pendingRoyalty += totalRoyaltyForItems;
                    authorData.pendingQuantity += qty;
                    authorData.pendingRoyalty += totalRoyaltyForItems;
                }
                // Confirmed/Eligible for payment (completed AND older than 10 days)
                else {
                    bookData.confirmedQuantity += qty;
                    bookData.totalRoyalty += totalRoyaltyForItems;
                    bookData.totalRoyaltyToPay += totalRoyaltyForItems;
                    bookData.totalEarnings += totalEarningsForItems;

                    authorData.confirmedQuantity += qty;
                    authorData.totalRoyalty += totalRoyaltyForItems;
                    authorData.totalRoyaltyToPay += totalRoyaltyForItems;
                    authorData.totalEarnings += totalEarningsForItems;
                }
            }
        }

        // Format book data and apply payment logic
        const fmt = val => `₹${val.toFixed(2)}`;
        const booksArr = [];
        let actualTotalRoyaltyToPay = 0;

        for (const title in authorData.books) {
            const b = authorData.books[title];

            // Find the original book to check payment status
            const originalBook = books.find(book => book.title === title);

            // Calculate royalty only for orders placed AFTER the payment date
            let finalRoyaltyToPay = b.totalRoyaltyToPay;
            let isPaid = false;

            if (originalBook && originalBook.lastRoyaltyPayDate &&
                originalBook.lastRoyaltyPaidForMonth >= month &&
                originalBook.lastRoyaltyPaidForYear >= year) {

                // Recalculate royalty excluding orders placed before payment date
                const paymentDate = new Date(originalBook.lastRoyaltyPayDate);
                let recalculatedRoyalty = 0;

                // Go through all orders for this book and only count those after payment date
                for (const order of allOrders) {
                    const orderDate = new Date(order.createdAt);

                    // Only include orders placed AFTER the payment date
                    if (orderDate > paymentDate) {
                        for (const item of order.line_items) {
                            const matchedBook = findMatchingBook(item.title, books);
                            if (matchedBook && matchedBook.title === originalBook.title) {
                                const maxRoyalty = Math.max(...matchedBook.platforms.map(p => p.royalty || 0));
                                const qty = Number(item.quantity) || 0;
                                const itemRoyalty = qty * maxRoyalty;

                                const status = order.status?.toLowerCase() || "";
                                const isCompleted = ["completed", "shipped", "delivered", "DELEVERED"].includes(status);
                                const isCancelled = ["canceled", "cancelled", "refunded", "returned", "return_requested", "RETURN_REQUESTED"].includes(status);
                                const orderAge = now - new Date(order.lastUpdate);

                                // Only count confirmed orders (completed AND beyond 10 days)
                                if (isCompleted && orderAge >= TEN_DAYS_MS && !isCancelled) {
                                    recalculatedRoyalty += itemRoyalty;
                                }
                            }
                        }
                    }
                }

                finalRoyaltyToPay = recalculatedRoyalty;
                isPaid = true; // Mark as paid but with recalculated amount
            }

            actualTotalRoyaltyToPay += finalRoyaltyToPay;

            booksArr.push({
                bookId: b.bookId,
                bookTitle: b.bookTitle,
                bookPrice: fmt(b.bookPrice),
                royaltySetByAuthor: fmt(b.royaltySetByAuthor),
                totalQuantity: b.totalQuantity,
                confirmedQuantity: b.confirmedQuantity,
                pendingQuantity: b.pendingQuantity,
                cancelledQuantity: b.cancelledQuantity,
                totalRoyalty: fmt(b.totalRoyalty),
                pendingRoyalty: fmt(b.pendingRoyalty),
                cancelledRoyalty: fmt(b.cancelledRoyalty),
                totalRoyaltyToPay: fmt(finalRoyaltyToPay),
                totalEarnings: fmt(b.totalEarnings),
                isPaid: isPaid,
                lastPaymentDate: originalBook?.lastRoyaltyPayDate ? originalBook.lastRoyaltyPayDate.toISOString() : null,
                paidForMonth: originalBook?.lastRoyaltyPaidForMonth || null,
                paidForYear: originalBook?.lastRoyaltyPaidForYear || null
            });
        }

        // Final response in same format as admin's getAuthorWiseReport
        const finalData = [{
            authorId: authorData.authorId,
            authorName: authorData.authorName,
            authorEmail: authorData.authorEmail,
            totalBooks: authorData.totalBooks,
            totalSales: authorData.totalSales,
            confirmedQuantity: authorData.confirmedQuantity,
            pendingQuantity: authorData.pendingQuantity,
            cancelledQuantity: authorData.cancelledQuantity,
            totalRoyalty: fmt(authorData.totalRoyalty),
            pendingRoyalty: fmt(authorData.pendingRoyalty),
            cancelledRoyalty: fmt(authorData.cancelledRoyalty),
            totalRoyaltyToPay: fmt(actualTotalRoyaltyToPay),
            totalEarnings: fmt(authorData.totalEarnings),
            books: booksArr,
        }];

        res.status(200).json({
            status: true,
            filter: { month, year },
            data: finalData,
        });
    } catch (error) {
        logger.error("❌ Error fetching author wise report:", error);
        res.status(500).json({ status: false, message: "Error fetching author wise report" });
    }
});

module.exports = {
    getAuthorDashboard,
    getAuthorSalesReport,
    getAuthorBookWiseReport,
    getAuthorWiseReport
};
