const path = require('path'); 
const dotenv = require('dotenv');

// Load .env file explicitly
dotenv.config({ path: path.resolve(__dirname, '.env') }); 

const mongoose = require("mongoose");
const cron = require("node-cron");
const cors = require('cors'); 
const logger = require("./config/logger");
const config = require("./config/config");
const amazonService = require("./services/amazon");

const wooCommerceService = require("./services/woocommerce");
const { fetchAndSaveZohoOrders } = require("./services/zohoOrderService");
const app = require("./app"); 
const Order = require("./models/Order");
// const routes = require("./routes/v1"); // (Unused variable kept as per your original code)
const { computeTopRatedAuthors } = require("./helpers/computeAuthors");
const { sendEmailNotification } = require('./services/notifications');

// ✅ FIX 1: Configure CORS to allow your Production Domain
app.use(cors({
  origin: [
    "http://localhost:3000",                    // Local Frontend
    "http://localhost:3001",                    // Alternate Local
    "https://dashboard.dreambookpublishing.com" // 🚀 YOUR PRODUCTION DOMAIN
  ],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  credentials: true
}));

let server;

// Connect to MongoDB
mongoose
  .connect(config.mongoose.url, config.mongoose.options)
  .then(() => {
    logger.info("✅ Connected to MongoDB");
  })
  .catch((err) => {
    logger.error("❌ MongoDB Connection Error:", err);
  });

// ---------- Cron Job ----------
cron.schedule("0 * * * *", async () => {
  logger.info("🕒 Running Zoho orders sync...");
  try {
    // await fetchAndSaveAmazonOrders();
    // const amazonOrders = await amazonService.fetchAmazonOrders();
    //  await amazonService.saveAmazonOrders(amazonOrders);
    //  await amazonService.fetchAndSaveAmazonOrdersAndProducts();

    // await wooCommerceService.fetchOrders();
    logger.info("✅ Zoho orders synced successfully");
  } catch (err) {
    logger.error("❌ Error syncing Zoho orders:", err.message);
  }
});

// ---------- Start Server ----------
// ✅ FIX 2: Ensure we have a port (Fallback to 5001 if config.port is undefined)
const PORT = config.port || 5001;

server = app.listen(PORT, async () => {
  logger.info(`🚀 Server running on port ${PORT}`);
  try {
    // await wooCommerceService.fetchOrders();
    // await amazonService.fetchAndSaveAmazonOrdersAndProducts();

  } catch (err) {
    logger.error("❌ Failed to fetch Zoho orders on start:", err.message);
  }
});

// Graceful exit handlers
const exitHandler = () => {
  if (server) {
    server.close(() => {
      logger.info("Server closed");
      process.exit(1);
    });
  } else {
    process.exit(1);
  }
};

const unexpectedErrorHandler = (error) => {
  logger.error(error);
  exitHandler();
};

process.on("uncaughtException", unexpectedErrorHandler);
process.on("unhandledRejection", unexpectedErrorHandler);
process.on("SIGTERM", () => {
  logger.info("SIGTERM received");
  if (server) {
    server.close();
  }
});