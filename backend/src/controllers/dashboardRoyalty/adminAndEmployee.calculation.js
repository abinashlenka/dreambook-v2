const catchAsync = require('../../utils/catchAsync');
const AmazonOrders = require('../../models/amazonOrders');
const WoocommerceOrders = require('../../models/woocommerceOrders');
const FlipkartOrders = require('../../models/flipkartOrderds');
const { Book } = require('../../models/book.model');
const { User } = require('../../models/user.model');
const logger = require('../../config/logger');

// ======================================================
// ✅ HELPER: Book matching function
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
// ✅ HELPER: Get books with valid authors
// ======================================================
const getBooksWithAuthors = async () => {
    return await Book.find(
        {
            author: { $exists: true, $ne: null },
            title: { $exists: true, $ne: "" },
            platforms: { $exists: true, $ne: [] }
        },
        "title author platforms price lastRoyaltyPayDate lastRoyaltyPaidForMonth lastRoyaltyPaidForYear"
    ).populate("author", "name email").lean();
};

// ======================================================
// ✅ HELPER: Merge orders (with fuzzy title match support)
// ======================================================
const mergeOrders = async (match = {}) => {
    const [amazonOrdersRaw, wooOrdersRaw, flipkartOrdersRaw] = await Promise.all([
        AmazonOrders.find({}).lean(),
        WoocommerceOrders.find({}).lean(),
        FlipkartOrders.find({}).lean(),
    ]);

    const unifiedOrders = [];

    const parseDate = (str, fallback) => {
        if (!str) return fallback;
        const d = new Date(str);
        return isNaN(d) ? fallback : d;
    };

    const filterByDate = (order, start, end) => {
        const orderDate = parseDate(order.purchase_date, order.createdAt);
        return orderDate >= start && orderDate <= end;
    };

    // Amazon Orders
    for (const order of amazonOrdersRaw) {
        if (match.createdAt && !filterByDate(order, match.createdAt.$gte, match.createdAt.$lte)) continue;

        unifiedOrders.push({
            source: 'amazon',
            status: order.order_status?.toLowerCase() || '',
            createdAt: parseDate(order.purchase_date, new Date()),
            lastUpdate: parseDate(order.last_update_date, parseDate(order.purchase_date, new Date())),
            line_items: (order.line_items || []).map(item => ({
                title: item.title?.toLowerCase().trim() || '',
                quantity: item.quantity || 0,
                price: parseFloat(item.price) || 0,
            })),
            total: parseFloat(order.total_amount) || 0,
        });
    }

    // WooCommerce Orders
    for (const order of wooOrdersRaw) {
        if (match.createdAt && !filterByDate(order, match.createdAt.$gte, match.createdAt.$lte)) continue;

        unifiedOrders.push({
            source: 'dream', // normalized WooCommerce
            status: order.order_status?.toLowerCase() || '',
            createdAt: parseDate(order.purchase_date, new Date()),
            lastUpdate: parseDate(order.last_update_date, parseDate(order.purchase_date, new Date())),
            line_items: (order.line_items || []).map(item => ({
                title: item.title?.toLowerCase().trim() || '',
                quantity: item.quantity || 0,
                price: parseFloat(item.price) || 0,
            })),
            total: parseFloat(order.total_amount) || 0,
        });
    }

    // Flipkart Orders
    for (const order of flipkartOrdersRaw) {
        if (match.createdAt && !filterByDate(order, match.createdAt.$gte, match.createdAt.$lte)) continue;
        unifiedOrders.push({
            source: 'flipkart',
            status: order.order_status?.toLowerCase() || '',
            createdAt: parseDate(order.purchase_date, new Date()),
            lastUpdate: parseDate(order.last_update_date, parseDate(order.purchase_date, new Date())),
            line_items: (order.line_items || []).map(item => ({
                title: item.title?.toLowerCase().trim() || '',
                quantity: item.quantity || 0,
                price: parseFloat(item.price) || 0,
            })),
            total: parseFloat(order.total_amount) || 0,
        });
    }

    return unifiedOrders;
};

// ======================================================
// ✅ 1. DASHBOARD STATS (with completed/shipped & 10-day royalty)
// ======================================================
const getDashboardStats = catchAsync(async (req, res) => {
    try {
        const books = await getBooksWithAuthors();

        if (!books.length) {
            return res.status(200).json({
                status: true,
                data: { totalBooks: 0, totalAuthors: 0, totalSales: 0, totalRoyalty: "₹0.00", platformEarnings: "₹0.00" },
            });
        }

        const bookRoyaltyMap = {};
        books.forEach(book => {
            const title = book.title.toLowerCase().trim();
            const maxRoyalty = Math.max(...book.platforms.map(p => p.royalty || 0));
            bookRoyaltyMap[title] = maxRoyalty;
        });

        const allOrders = await mergeOrders();

        let totalSales = 0;
        let totalRoyalty = 0;
        let platformEarnings = 0;
        const now = new Date();
        const TEN_DAYS_MS = 10 * 24 * 60 * 60 * 1000;

        for (const order of allOrders) {
            const status = order.status?.toLowerCase() || "";
            const isCompleted = ["completed", "shipped", "delivered", "DELIVERED"].includes(status);
            const orderAge = now - new Date(order.lastUpdate);

            for (const item of order.line_items) {
                const matchedBook = findMatchingBook(item.title, books);
                if (!matchedBook || !matchedBook.author?._id) continue;

                const royaltyPerCopy = bookRoyaltyMap[matchedBook.title.toLowerCase().trim()] || 0;
                const qty = item.quantity || 0;

                // Only count confirmed orders (completed AND older than 10 days)
                if (isCompleted && orderAge >= TEN_DAYS_MS) {
                    totalSales += qty;
                    totalRoyalty += royaltyPerCopy * qty;
                    platformEarnings += item.price * qty;
                }
            }
        }

        res.status(200).json({
            status: true,
            data: {
                totalBooks: books.length,
                totalAuthors: new Set(books.map(b => b.author?._id.toString())).size,
                totalSales,
                totalRoyalty: `₹${totalRoyalty.toFixed(2)}`,
                platformEarnings: `₹${platformEarnings.toFixed(2)}`,
            },
        });
    } catch (error) {
        logger.error("❌ Error fetching dashboard stats:", error);
        res.status(500).json({ status: false, message: "Error fetching dashboard stats" });
    }
});

// ======================================================
// ✅ 2. SALES REPORT (with completed/shipped & 10-day royalty + total qty fix)
// ======================================================
const getSalesReport = catchAsync(async (req, res) => {
    const { month, year } = req.query;

    if (!month || isNaN(month) || month < 1 || month > 12)
        return res.status(400).json({ status: false, message: "Valid month (1-12) is required" });
    if (!year || isNaN(year) || year.toString().length !== 4)
        return res.status(400).json({ status: false, message: "Valid year (YYYY) is required" });

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    const books = await getBooksWithAuthors();

    if (!books.length) {
        return res.status(200).json({
            status: true,
            filter: { month, year },
            data: { totalBooks: 0, totalAuthors: 0, platforms: {} },
        });
    }

    const bookRoyaltyMap = {};
    books.forEach(book => {
        const title = book.title.toLowerCase().trim();
        const maxRoyalty = Math.max(...book.platforms.map(p => p.royalty || 0));
        bookRoyaltyMap[title] = maxRoyalty;
    });

    const allOrders = await mergeOrders({ createdAt: { $gte: startDate, $lte: endDate } });

    const platforms = {
        dreamBook: {
            totalSales: 0, totalRoyalty: 0,
            pending: { totalQty: 0, totalRoyalty: 0 },
            returned: { totalQty: 0, totalRoyalty: 0 },
            totalEarnings: 0
        },
        amazon: {
            totalSales: 0, totalRoyalty: 0,
            pending: { totalQty: 0, totalRoyalty: 0 },
            returned: { totalQty: 0, totalRoyalty: 0 },
            totalEarnings: 0
        },
        flipkart: {   // 🆕 Add this block
            totalSales: 0, totalRoyalty: 0,
            pending: { totalQty: 0, totalRoyalty: 0 },
            returned: { totalQty: 0, totalRoyalty: 0 },
            totalEarnings: 0
        },
    };

    const now = new Date();
    const TEN_DAYS_MS = 10 * 24 * 60 * 60 * 1000;

    for (const order of allOrders) {
        const platform =
            order.source === "dream"
                ? "dreamBook"
                : order.source === "flipkart"
                    ? "flipkart"
                    : "amazon";


        for (const item of order.line_items) {
            const matchedBook = findMatchingBook(item.title, books);
            if (!matchedBook || !matchedBook.author?._id) {
                continue;
            }

            const royaltyPerCopy = bookRoyaltyMap[matchedBook.title.toLowerCase().trim()] || 0;
            const qty = item.quantity;
            const totalRoyaltyForItems = qty * royaltyPerCopy;
            const totalEarningsForItems = qty * item.price;

            const status = order.status?.toLowerCase() || "";
            const isCompleted = ["completed", "shipped", "delivered"].includes(status);
            const isCancelled = ["canceled", "cancelled", "refunded", "returned", "return_requested"].includes(status);
            const orderAge = now - new Date(order.lastUpdate);

            // 🔄 Returned / Cancelled - count in totalSales but track separately
            if (isCancelled) {
                platforms[platform].totalSales += qty;
                platforms[platform].returned.totalQty += qty;
                platforms[platform].returned.totalRoyalty += totalRoyaltyForItems;
            }
            // 🟡 Pending only if completed but <10 days
            else if (isCompleted && orderAge < TEN_DAYS_MS) {
                platforms[platform].totalSales += qty;
                platforms[platform].pending.totalQty += qty;
                platforms[platform].pending.totalRoyalty += totalRoyaltyForItems;
            }
            // ✅ Confirmed (completed AND beyond 10 days)
            else {
                platforms[platform].totalSales += qty;

                // Check if this order should be excluded due to payment
                let shouldIncludeRoyalty = true;

                if (matchedBook.lastRoyaltyPayDate &&
                    matchedBook.lastRoyaltyPaidForMonth >= month &&
                    matchedBook.lastRoyaltyPaidForYear >= year) {

                    const paymentDate = new Date(matchedBook.lastRoyaltyPayDate);
                    const orderDate = new Date(order.createdAt);

                    // Only include orders placed AFTER the payment date
                    shouldIncludeRoyalty = orderDate > paymentDate;
                }

                if (shouldIncludeRoyalty) {
                    platforms[platform].totalRoyalty += totalRoyaltyForItems;
                }

                platforms[platform].totalEarnings += totalEarningsForItems;
            }
        }
    }

    // Format currency
    for (const p in platforms) {
        platforms[p].totalRoyalty = `₹${platforms[p].totalRoyalty.toFixed(2)}`;
        platforms[p].pending.totalRoyalty = `₹${platforms[p].pending.totalRoyalty.toFixed(2)}`;
        platforms[p].returned.totalRoyalty = `₹${platforms[p].returned.totalRoyalty.toFixed(2)}`;
        platforms[p].totalEarnings = `₹${platforms[p].totalEarnings.toFixed(2)}`;
    }

    res.status(200).json({
        status: true,
        filter: { month, year },
        data: {
            totalBooks: books.length,
            totalAuthors: new Set(books.map(b => b.author?._id.toString())).size,
            platforms,
        },
    });
});

// ======================================================
// ✅ 3. BOOK-WISE REPORT (month/year summary per book)
// ======================================================
const getBookWiseReport = catchAsync(async (req, res) => {
    const { month, year } = req.query;

    if (!month || isNaN(month) || month < 1 || month > 12)
        return res.status(400).json({ status: false, message: "Valid month (1-12) is required" });
    if (!year || isNaN(year) || year.toString().length !== 4)
        return res.status(400).json({ status: false, message: "Valid year (YYYY) is required" });

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    const books = await getBooksWithAuthors();

    if (!books.length) {
        return res.status(200).json({
            status: true,
            filter: { month, year },
            data: [],
        });
    }

    // 🗺️ Book-to-royalty map (use max royalty across all platforms)
    const bookRoyaltyMap = {};
    books.forEach(book => {
        const title = book.title.toLowerCase().trim();
        const maxRoyalty = Math.max(...book.platforms.map(p => p.royalty || 0));
        bookRoyaltyMap[title] = maxRoyalty;
    });

    const allOrders = await mergeOrders({ createdAt: { $gte: startDate, $lte: endDate } });
    const now = new Date();
    const TEN_DAYS_MS = 10 * 24 * 60 * 60 * 1000;

    const results = {}; // key: book title

    // Initialize all books with zero values
    books.forEach(book => {
        const maxRoyalty = Math.max(...book.platforms.map(p => p.royalty || 0));
        const bookPrice = book.price || 0;

        results[book.title] = {
            bookId: book._id,
            bookTitle: book.title,
            author: book.author,
            bookPrice,
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

    for (const order of allOrders) {
        for (const item of order.line_items) {
            const matchedBook = findMatchingBook(item.title, books);
            if (!matchedBook || !matchedBook.author?._id) continue;

            const bookTitle = matchedBook.title;
            const bookResult = results[bookTitle];

            // Use the max royalty set by author (not platform-specific)
            const royaltyPerCopy = bookRoyaltyMap[bookTitle.toLowerCase().trim()] || 0;
            const qty = Number(item.quantity) || 0;
            const totalRoyaltyForItems = qty * royaltyPerCopy;
            const totalEarningsForItems = qty * item.price;

            const status = order.status?.toLowerCase() || "";
            const isCompleted = ["completed", "shipped", "delivered"].includes(status);
            const isCancelled = ["canceled", "cancelled", "refunded", "returned", "return_requested"].includes(status);
            const orderAge = now - new Date(order.lastUpdate);

            // Always count total quantity
            bookResult.totalQuantity += qty;

            // Cancelled / Returned
            if (isCancelled) {
                bookResult.cancelledQuantity += qty;
                bookResult.cancelledRoyalty += totalRoyaltyForItems;
            }
            // Pending (not completed OR within 10 days)
            else if (isCompleted && orderAge < TEN_DAYS_MS) {
                bookResult.pendingQuantity += qty;
                bookResult.pendingRoyalty += totalRoyaltyForItems;
            }
            // Confirmed (eligible for payment)
            else {
                bookResult.confirmedQuantity += qty;
                bookResult.totalRoyalty += totalRoyaltyForItems;
                bookResult.totalRoyaltyToPay += totalRoyaltyForItems;
                bookResult.totalEarnings += totalEarningsForItems;
            }
        }
    }

    // Finalize: only include books with at least one order
    const finalData = Object.values(results)
        .filter(b => b.totalQuantity > 0)
        .map(b => {
            const fmt = val => `₹${val.toFixed(2)}`;

            // Find the original book to check payment status
            const originalBook = books.find(book => book._id.toString() === b.bookId.toString());

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
                            if (matchedBook && matchedBook._id.toString() === originalBook._id.toString()) {
                                const maxRoyalty = Math.max(...matchedBook.platforms.map(p => p.royalty || 0));
                                const qty = Number(item.quantity) || 0;
                                const itemRoyalty = qty * maxRoyalty;

                                const status = order.status?.toLowerCase() || "";
                                const isCompleted = ["completed", "shipped", "delivered"].includes(status);
                                const isCancelled = ["canceled", "cancelled", "refunded", "returned"].includes(status);
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

            return {
                bookId: b.bookId,
                bookTitle: b.bookTitle,
                author: b.author,
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
            };
        });

    res.status(200).json({
        status: true,
        filter: { month, year },
        data: finalData,
    });
});


// ======================================================
// ✅ 4. AUTHOR-WISE REPORT (summary + detailed per book)
// ======================================================
const getAuthorWiseReport = catchAsync(async (req, res) => {
    const { month, year } = req.query;

    if (!month || isNaN(month) || month < 1 || month > 12)
        return res.status(400).json({ status: false, message: "Valid month (1-12) is required" });
    if (!year || isNaN(year) || year.toString().length !== 4)
        return res.status(400).json({ status: false, message: "Valid year (YYYY) is required" });

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    const books = await getBooksWithAuthors();

    if (!books.length) {
        return res.status(200).json({
            status: true,
            filter: { month, year },
            data: [],
        });
    }

    const allOrders = await mergeOrders({ createdAt: { $gte: startDate, $lte: endDate } });
    const now = new Date();
    const TEN_DAYS_MS = 10 * 24 * 60 * 60 * 1000;

    // 🗺️ Book-to-royalty map (use max royalty across all platforms)
    const bookRoyaltyMap = {};
    books.forEach(book => {
        const title = book.title.toLowerCase().trim();
        const maxRoyalty = Math.max(...book.platforms.map(p => p.royalty || 0));
        bookRoyaltyMap[title] = maxRoyalty;
    });

    // 🧩 Prepare structure per author
    const authorsMap = {};

    for (const book of books) {
        const authorId = book.author?._id?.toString();
        if (!authorId) continue;

        if (!authorsMap[authorId]) {
            authorsMap[authorId] = {
                authorId,
                authorName: book.author?.name || "Unknown",
                authorEmail: book.author?.email || "",
                totalBooks: 0,
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
        }

        const maxRoyalty = Math.max(...book.platforms.map(p => p.royalty || 0));
        const bookPrice = book.price || 0;

        authorsMap[authorId].books[book.title] = {
            bookId: book._id,
            bookTitle: book.title,
            bookPrice,
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

        authorsMap[authorId].totalBooks += 1;
    }

    // 🧮 Process orders
    for (const order of allOrders) {
        for (const item of order.line_items) {
            const matchedBook = findMatchingBook(item.title, books);
            if (!matchedBook || !matchedBook.author?._id) {
                continue;
            }

            const authorId = matchedBook.author?._id?.toString();
            if (!authorsMap[authorId]) continue;

            const bookTitle = matchedBook.title;
            const bookData = authorsMap[authorId].books[bookTitle];

            // Use the max royalty set by author (not platform-specific)
            const royaltyPerCopy = bookRoyaltyMap[bookTitle.toLowerCase().trim()] || 0;
            const qty = Number(item.quantity) || 0;
            const totalRoyaltyForItems = qty * royaltyPerCopy;
            const totalEarningsForItems = qty * item.price;

            const status = order.status?.toLowerCase() || "";
            const isCompleted = ["completed", "shipped", "delivered"].includes(status);
            const isCancelled = ["canceled", "cancelled", "refunded", "returned"].includes(status);
            const orderAge = now - new Date(order.lastUpdate);

            // Always add total quantity
            bookData.totalQuantity += qty;

            // Cancelled / Returned - count in totalSales but don't include in royalty calculations
            if (isCancelled) {
                bookData.cancelledQuantity += qty;
                bookData.cancelledRoyalty += totalRoyaltyForItems;
                authorsMap[authorId].cancelledQuantity += qty;
                authorsMap[authorId].cancelledRoyalty += totalRoyaltyForItems;
                authorsMap[authorId].totalSales += qty;
            }
            // Pending (not completed OR within 10 days of completion)
            // 🟡 Pending only if completed but within 10 days
            else if (isCompleted && orderAge < TEN_DAYS_MS) {
                bookData.pendingQuantity += qty;
                bookData.pendingRoyalty += totalRoyaltyForItems;

                authorsMap[authorId].pendingQuantity += qty;
                authorsMap[authorId].pendingRoyalty += totalRoyaltyForItems;
                authorsMap[authorId].totalSales += qty;
            }
            // Confirmed/Eligible for payment (completed AND older than 10 days)
            else {
                bookData.confirmedQuantity += qty;
                bookData.totalRoyalty += totalRoyaltyForItems;
                bookData.totalRoyaltyToPay += totalRoyaltyForItems;
                bookData.totalEarnings += totalEarningsForItems;

                authorsMap[authorId].totalSales += qty;
                authorsMap[authorId].confirmedQuantity += qty;
                authorsMap[authorId].totalRoyalty += totalRoyaltyForItems;
                authorsMap[authorId].totalRoyaltyToPay += totalRoyaltyForItems;
                authorsMap[authorId].totalEarnings += totalEarningsForItems;
            }
        }
    }

    // 🧾 Format values
    const fmt = val => `₹${val.toFixed(2)}`;
    const finalData = [];

    for (const authorId in authorsMap) {
        const author = authorsMap[authorId];
        const booksArr = [];

        for (const title in author.books) {
            const b = author.books[title];

            // Find the original book to check payment status
            const originalBook = books.find(book => book._id.toString() === b.bookId.toString());

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
                            if (matchedBook && matchedBook._id.toString() === originalBook._id.toString()) {
                                const maxRoyalty = Math.max(...matchedBook.platforms.map(p => p.royalty || 0));
                                const qty = Number(item.quantity) || 0;
                                const itemRoyalty = qty * maxRoyalty;

                                const status = order.status?.toLowerCase() || "";
                                const isCompleted = ["completed", "shipped", "delivered"].includes(status);
                                const isCancelled = ["canceled", "cancelled", "refunded", "returned"].includes(status);
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

        // Calculate actual totalRoyaltyToPay after excluding paid books
        const actualTotalRoyaltyToPay = booksArr.reduce((sum, book) => {
            // Remove ₹ symbol and convert to number
            const amount = parseFloat(book.totalRoyaltyToPay.replace('₹', ''));
            return sum + amount;
        }, 0);

        // Calculate confirmed quantity from books
        const confirmedQuantity = booksArr.reduce((sum, book) => sum + book.confirmedQuantity, 0);

        finalData.push({
            authorId,
            authorName: author.authorName,
            authorEmail: author.authorEmail,
            totalBooks: author.totalBooks,
            totalSales: author.totalSales,
            confirmedQuantity: confirmedQuantity,
            pendingQuantity: author.pendingQuantity,
            cancelledQuantity: author.cancelledQuantity,
            totalRoyalty: fmt(author.totalRoyalty),
            pendingRoyalty: fmt(author.pendingRoyalty),
            cancelledRoyalty: fmt(author.cancelledRoyalty),
            totalRoyaltyToPay: fmt(actualTotalRoyaltyToPay),
            totalEarnings: fmt(author.totalEarnings),
            books: booksArr,
        });
    }

    res.status(200).json({
        status: true,
        filter: { month, year },
        data: finalData,
    });
});

// ======================================================
// ✅ 5. MARK ROYALTY AS PAID - ALL BOOKS
// ======================================================
const markRoyaltyAsPaid = catchAsync(async (req, res) => {
    const { month, year, paymentDate } = req.body;

    // Validate required parameters
    if (!month || !year) {
        return res.status(400).json({
            status: false,
            message: "Month and year are required"
        });
    }

    if (isNaN(month) || month < 1 || month > 12) {
        return res.status(400).json({
            status: false,
            message: "Valid month (1-12) is required"
        });
    }

    if (isNaN(year) || year.toString().length !== 4) {
        return res.status(400).json({
            status: false,
            message: "Valid year (YYYY) is required"
        });
    }

    try {
        // Use provided payment date or current date
        const royaltyPaymentDate = paymentDate ? new Date(paymentDate) : new Date();

        // Create the end date for the month being paid (last day of the month)
        const paymentPeriodEnd = new Date(year, month, 0, 23, 59, 59, 999);

        // Update all books with lastRoyaltyPayDate
        const result = await Book.updateMany(
            {
                isDeleted: { $ne: true },
                author: { $exists: true, $ne: null }
            },
            {
                $set: {
                    lastRoyaltyPayDate: royaltyPaymentDate,
                    lastRoyaltyPaidForMonth: month,
                    lastRoyaltyPaidForYear: year,
                    royaltyPaidUpTo: paymentPeriodEnd
                }
            }
        );

        logger.info(`✅ Marked royalty as paid for ${result.modifiedCount} books up to ${month}/${year}`);

        res.status(200).json({
            status: true,
            message: `Successfully marked royalty as paid for all books up to ${month}/${year}`,
            data: {
                totalBooksUpdated: result.modifiedCount,
                paymentDate: royaltyPaymentDate.toISOString(),
                paidForMonth: month,
                paidForYear: year,
                royaltyPaidUpTo: paymentPeriodEnd.toISOString()
            }
        });
    } catch (error) {
        logger.error("❌ Error marking royalty as paid for all books:", error);
        res.status(500).json({
            status: false,
            message: "Error marking royalty as paid for all books"
        });
    }
});

// ======================================================
// ✅ 6. MARK ROYALTY AS PAID - BY AUTHOR
// ======================================================
const markRoyaltyAsPaidByAuthor = catchAsync(async (req, res) => {
    const { authorId } = req.params;
    const { month, year, paymentDate } = req.body;

    if (!authorId) {
        return res.status(400).json({
            status: false,
            message: "Author ID is required"
        });
    }

    // Validate required parameters
    if (!month || !year) {
        return res.status(400).json({
            status: false,
            message: "Month and year are required"
        });
    }

    if (isNaN(month) || month < 1 || month > 12) {
        return res.status(400).json({
            status: false,
            message: "Valid month (1-12) is required"
        });
    }

    if (isNaN(year) || year.toString().length !== 4) {
        return res.status(400).json({
            status: false,
            message: "Valid year (YYYY) is required"
        });
    }

    try {
        // Use provided payment date or current date
        const royaltyPaymentDate = paymentDate ? new Date(paymentDate) : new Date();

        // Create the end date for the month being paid (last day of the month)
        const paymentPeriodEnd = new Date(year, month, 0, 23, 59, 59, 999);

        // Update all books for specific author
        const result = await Book.updateMany(
            {
                author: authorId,
                isDeleted: { $ne: true }
            },
            {
                $set: {
                    lastRoyaltyPayDate: royaltyPaymentDate,
                    lastRoyaltyPaidForMonth: month,
                    lastRoyaltyPaidForYear: year,
                    royaltyPaidUpTo: paymentPeriodEnd
                }
            }
        );

        // Get author details for response
        const author = await User.findById(authorId, "name email");

        logger.info(`✅ Marked royalty as paid for ${result.modifiedCount} books by author ${authorId} up to ${month}/${year}`);

        res.status(200).json({
            status: true,
            message: `Successfully marked royalty as paid for author's books up to ${month}/${year}`,
            data: {
                authorId,
                authorName: author?.name || "Unknown",
                authorEmail: author?.email || "",
                totalBooksUpdated: result.modifiedCount,
                paymentDate: royaltyPaymentDate.toISOString(),
                paidForMonth: month,
                paidForYear: year,
                royaltyPaidUpTo: paymentPeriodEnd.toISOString()
            }
        });
    } catch (error) {
        logger.error(`❌ Error marking royalty as paid for author ${authorId}:`, error);
        res.status(500).json({
            status: false,
            message: "Error marking royalty as paid for author's books"
        });
    }
});

// ======================================================
// ✅ 7. MARK ROYALTY AS PAID - BY BOOK
// ======================================================
const markRoyaltyAsPaidByBook = catchAsync(async (req, res) => {
    const { bookId } = req.params;
    const { month, year, paymentDate } = req.body;

    if (!bookId) {
        return res.status(400).json({
            status: false,
            message: "Book ID is required"
        });
    }

    // Validate required parameters
    if (!month || !year) {
        return res.status(400).json({
            status: false,
            message: "Month and year are required"
        });
    }

    if (isNaN(month) || month < 1 || month > 12) {
        return res.status(400).json({
            status: false,
            message: "Valid month (1-12) is required"
        });
    }

    if (isNaN(year) || year.toString().length !== 4) {
        return res.status(400).json({
            status: false,
            message: "Valid year (YYYY) is required"
        });
    }

    try {
        // Use provided payment date or current date
        const royaltyPaymentDate = paymentDate ? new Date(paymentDate) : new Date();

        // Create the end date for the month being paid (last day of the month)
        const paymentPeriodEnd = new Date(year, month, 0, 23, 59, 59, 999);

        // Update specific book
        const result = await Book.findByIdAndUpdate(
            bookId,
            {
                $set: {
                    lastRoyaltyPayDate: royaltyPaymentDate,
                    lastRoyaltyPaidForMonth: month,
                    lastRoyaltyPaidForYear: year,
                    royaltyPaidUpTo: paymentPeriodEnd
                }
            },
            { new: true }
        ).populate("author", "name email");

        if (!result) {
            return res.status(404).json({
                status: false,
                message: "Book not found"
            });
        }

        logger.info(`✅ Marked royalty as paid for book ${bookId} up to ${month}/${year}`);

        res.status(200).json({
            status: true,
            message: `Successfully marked royalty as paid for book up to ${month}/${year}`,
            data: {
                bookId: result._id,
                bookTitle: result.title,
                authorName: result.author?.name || "Unknown",
                authorEmail: result.author?.email || "",
                paymentDate: royaltyPaymentDate.toISOString(),
                paidForMonth: month,
                paidForYear: year,
                royaltyPaidUpTo: paymentPeriodEnd.toISOString()
            }
        });
    } catch (error) {
        logger.error(`❌ Error marking royalty as paid for book ${bookId}:`, error);
        res.status(500).json({
            status: false,
            message: "Error marking royalty as paid for book"
        });
    }
});

// ======================================================
// ✅ 8. GET ROYALTY PAYMENT HISTORY
// ======================================================
const getRoyaltyPaymentHistory = catchAsync(async (req, res) => {
    const { authorId } = req.query;

    try {
        let matchQuery = {
            isDeleted: { $ne: true },
            author: { $exists: true, $ne: null },
            lastRoyaltyPayDate: { $exists: true, $ne: null }
        };

        // Filter by author if provided
        if (authorId) {
            matchQuery.author = authorId;
        }

        const books = await Book.find(matchQuery)
            .populate("author", "name email")
            .select("title author lastRoyaltyPayDate platforms price")
            .sort({ lastRoyaltyPayDate: -1 })
            .lean();

        const formattedData = books.map(book => ({
            bookId: book._id,
            bookTitle: book.title,
            authorName: book.author?.name || "Unknown",
            authorEmail: book.author?.email || "",
            lastPaymentDate: book.lastRoyaltyPayDate,
            maxRoyalty: Math.max(...book.platforms.map(p => p.royalty || 0)),
            bookPrice: book.price || 0
        }));

        res.status(200).json({
            status: true,
            message: "Royalty payment history retrieved successfully",
            data: {
                totalRecords: formattedData.length,
                payments: formattedData
            }
        });
    } catch (error) {
        logger.error("❌ Error fetching royalty payment history:", error);
        res.status(500).json({
            status: false,
            message: "Error fetching royalty payment history"
        });
    }
});


module.exports = {
    getDashboardStats,
    getSalesReport,
    getBookWiseReport,
    getAuthorWiseReport,
    markRoyaltyAsPaid,
    markRoyaltyAsPaidByAuthor,
    markRoyaltyAsPaidByBook,
    getRoyaltyPaymentHistory
};