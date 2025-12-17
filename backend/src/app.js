const express = require('express');
const cors = require('cors');
const compression = require('compression');
const helmet = require('helmet');
const httpStatus = require('http-status');
const morgan = require('./config/morgan');
const config = require('./config/config');
const routes = require('./routes/v1');
const ApiError = require('./utils/ApiError');
const { errorConverter, errorHandler } = require('./middlewares/error');

const app = express();

// Logger setup
if (config.env !== 'test') {
  app.use(morgan.successHandler);
  app.use(morgan.errorHandler);
}

// Handle webhook raw body
app.use((req, res, next) => {
  if (req.originalUrl === "/v1/booking/webhook") {
    express.raw({ type: "application/json" })(req, res, next);
  } else {
    express.json({ limit: "50mb" })(req, res, next);
  }
});

// Security HTTP headers
app.use(helmet());

// Parse URL-encoded data
app.use(express.urlencoded({ extended: true }));

// Gzip compression
app.use(compression());

// Enable CORS
// app.use(cors());
// app.options('*', cors());

// Mount API routes
app.use('/v1', routes);
app.use('/api', routes);

// Temporary Zoho callback route
app.get("/zoho/callback", async (req, res) => {
  const authCode = req.query.code;
  if (!authCode) return res.status(400).send("No authorization code found.");
  console.log("✅ Zoho authorization code:", authCode);
  res.send("Authorization code received! Check server console.");
});

// 404 handler
app.use((req, res, next) => {
  next(new ApiError(httpStatus.NOT_FOUND, 'Not found'));
});

// Error handling
app.use(errorConverter);
app.use(errorHandler);

module.exports = app;
