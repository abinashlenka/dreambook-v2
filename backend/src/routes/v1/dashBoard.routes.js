const express = require('express');

const { firebaseAuth } = require('../../middlewares/firebaseAuth');

const { getDashboardStats, getSalesReport,getBookWiseReport ,getAuthorWiseReport, markRoyaltyAsPaid, markRoyaltyAsPaidByAuthor, markRoyaltyAsPaidByBook, getRoyaltyPaymentHistory} = require('../../controllers/dashboardRoyalty/adminAndEmployee.calculation');
const {getAuthorDashboard, getAuthorSalesReport,getAuthorBookWiseReport, getAuthorWiseReport: getAuthorWiseReportForAuthor}= require('../../controllers/dashboardRoyalty/author.calculation');

const router = express.Router();
// Define the dashboard route

// ✅ Route 1: Overall Dashboard Stats (no month/year filter)
router.get(
  "/stats",
  firebaseAuth("All"),
  getDashboardStats
);

// ✅ Route 2: Sales Report (requires month & year filter)
router.get(
  "/sales-report",
  firebaseAuth("All"),
  getSalesReport
);

router.get(
  "/authors-data/:id",
  firebaseAuth("All"),
  getAuthorDashboard
);


router.get(
  "/authors-sales-report/:id",
  firebaseAuth("All"),
  getAuthorSalesReport
);

// ✅ New route: Book-wise royalty report
router.get("/book-wise-report", firebaseAuth("admin,employee"), getBookWiseReport);
router.get("/detail-book-wise-report", firebaseAuth("admin,employee"), getAuthorWiseReport);


router.get("/author-book-wise-report/:userId",firebaseAuth("All"),getAuthorBookWiseReport);
router.get("/author-wise-report/:userId",firebaseAuth("All"),getAuthorWiseReportForAuthor);

// ======================================================
// ✅ ROYALTY PAYMENT ROUTES (Admin & Employee Only)
// ======================================================

// Mark royalty as paid for all books
router.post(
  "/royalty/mark-all-paid",
  firebaseAuth("admin,employee"),
  markRoyaltyAsPaid
);

// Mark royalty as paid for specific author's books
router.post(
  "/royalty/mark-paid/author/:authorId",
  firebaseAuth("admin,employee"),
  markRoyaltyAsPaidByAuthor
);

// Mark royalty as paid for specific book
router.post(
  "/royalty/mark-paid/book/:bookId",
  firebaseAuth("admin,employee"),
  markRoyaltyAsPaidByBook
);

// Get royalty payment history
router.get(
  "/royalty/payment-history",
  firebaseAuth("admin,employee"),
  getRoyaltyPaymentHistory
);

module.exports = router;