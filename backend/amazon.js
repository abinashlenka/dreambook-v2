// require('dotenv').config();

// const axios = require('axios');
// const aws4 = require('aws4');

// // Step 1: Get LWA Access Token
// async function getAccessToken() {
//   const tokenUrl = 'https://api.amazon.com/auth/o2/token';
//   const params = new URLSearchParams({
//     grant_type: 'refresh_token',
//     refresh_token: process.env.LWA_REFRESH_TOKEN,
//     client_id: process.env.LWA_CLIENT_ID,
//     client_secret: process.env.LWA_CLIENT_SECRET,
//   });

//   const response = await axios.post(tokenUrl, params.toString(), {
//     headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
//   });

//   return response.data.access_token;
// }

// // Step 2: Fetch Orders
// async function fetchOrders(accessToken) {
//   const host = 'sellingpartnerapi-fe.amazon.com'; // India region
//   const path = `/orders/v0/orders?MarketplaceIds=${process.env.MARKETPLACE_ID}&CreatedAfter=2024-08-01T00:00:00Z&CreatedBefore=2024-08-31T23:59:59Z`;

//   // Options for signing
//   const opts = {
//     host,
//     path,
//     service: 'execute-api',
//     region: "us-east-1", // usually "us-east-1" for SP-API
//     method: 'GET',
//     headers: {
//       'x-amz-access-token': accessToken,
//     },
//   };

//   // Sign the request with AWS keys
//   aws4.sign(opts, {
//     accessKeyId: process.env.AWS_ACCESS_KEY_ID,
//     secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
//   });

//   const requestUrl = `https://${host}${path}`;

//   // Call Amazon SP-API
//   const response = await axios.get(requestUrl, { headers: opts.headers });
//   return response.data;
// }

// // Step 3: Run
// (async () => {
//   try {
//     console.log('Obtaining LWA access token...');
//     const token = await getAccessToken();
//     console.log('Access token acquired.');

//     console.log('Fetching orders...');
//     const orders = await fetchOrders(token);
//     console.log('Orders response:', JSON.stringify(orders, null, 2));
//   } catch (err) {
//     if (err.response) {
//       console.error('Error response:', err.response.status, err.response.data);
//     } else {
//       console.error('Error:', err.message);
//     }
//   }
// })();

// amazon.js
const { STSClient, AssumeRoleCommand } = require("@aws-sdk/client-sts");
const axios = require("axios");
const aws4 = require("aws4");
const https = require("https");
require("dotenv").config();

// -----------------------------
// 🔑 Load from .env
// -----------------------------
const ROLE_ARN = "arn:aws:iam::050451390986:user/amazon-spapi-user";               // Your SP-API IAM Role ARN
const AWS_REGION = "us-east-1";                          // Always us-east-1 for SP-API
const LWA_CLIENT_ID = process.env.LWA_CLIENT_ID;
const LWA_CLIENT_SECRET = process.env.LWA_CLIENT_SECRET;
const LWA_REFRESH_TOKEN = process.env.LWA_REFRESH_TOKEN;
const MARKETPLACE_ID = "A21TJRUUN4KGV";                  // US marketplace

// -----------------------------
// 🔄 Step 1: Refresh LWA Access Token
// -----------------------------
async function getLwaAccessToken() {
  const params = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: LWA_REFRESH_TOKEN,
    client_id: LWA_CLIENT_ID,
    client_secret: LWA_CLIENT_SECRET,
  });

  const res = await axios.post(
    "https://api.amazon.com/auth/o2/token",
    params, // <-- pass URLSearchParams object directly
    {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    }
  );

  return res.data.access_token;
}



// -----------------------------
// 🔄 Step 2: Assume Role to get STS Temp Credentials
// -----------------------------
async function getTempCredentials() {
  const stsClient = new STSClient({ region: AWS_REGION });
  const command = new AssumeRoleCommand({
    RoleArn: ROLE_ARN,
    RoleSessionName: "spapi-session",
  });
  const response = await stsClient.send(command);
  return response.Credentials;
}

// -----------------------------
// 📦 Step 3: Call SP-API Orders
// -----------------------------
async function fetchOrders() {
  try {
    const [lwaAccessToken, tempCreds] = await Promise.all([
      getLwaAccessToken(),
      getTempCredentials(),
    ]);

    const opts = {
      host: "sellingpartnerapi-na.amazon.com",
      path: `/orders/v0/orders?MarketplaceIds=${MARKETPLACE_ID}`,
      service: "execute-api",
      region: AWS_REGION,
      method: "GET",
      headers: {
        "x-amz-access-token": lwaAccessToken,
      },
    };

    // Sign with AWS SigV4 + temp credentials
    aws4.sign(opts, {
      accessKeyId: tempCreds.AccessKeyId,
      secretAccessKey: tempCreds.SecretAccessKey,
      sessionToken: tempCreds.SessionToken,
    });

    // Add security token header (important!)
    opts.headers["x-amz-security-token"] = tempCreds.SessionToken;

    console.log("Signed headers:\n", opts.headers);

    // Make HTTPS request
    https.get(opts, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        console.log("Response status:", res.statusCode);
        console.log("Response body:", data);
      });
    });
  } catch (err) {
    console.error("❌ Error fetching orders:", err);
  }
}

// -----------------------------
// 🚀 Run
// -----------------------------
fetchOrders();
