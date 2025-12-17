// Dashboard/backend/helpers/computeAuthors.js
const Order = require("../models/Order");
const Product = require("../models/Product");

async function computeTopRatedAuthors() {
  // 1) Fetch all products with author_name
  const products = await Product.find({}, { id: 1, name: 1, author_name: 1 });

  // Build lookup maps
  const productById = new Map(products.map((p) => [p.id, p]));
  const productByName = new Map(products.map((p) => [p.name, p]));

  // 2) Fetch all orders
  const orders = await Order.find();

  const authorStats = {};

  for (const order of orders) {
    for (const item of order.line_items || []) {
      let product;

      if (item.productId && productById.has(item.productId)) {
        product = productById.get(item.productId);
      } else if (productByName.has(item.name)) {
        product = productByName.get(item.name);
      }

      if (!product) continue;

      const author = product.author_name || "Unknown";

      if (!authorStats[author]) {
        authorStats[author] = {
          authorName: author,
          totalSales: 0,
          totalEarnings: 0,
          totalReturned: 0,
          returnRoyalty: 0,
          totalToPay: 0,
        };
      }

      // Add sales
      const qty = item.quantity || 0;
      const price = parseFloat(item.price || "0");

      authorStats[author].totalSales += qty;
      authorStats[author].totalEarnings += price * qty;
    }
  }

  // 3) Convert to array & sort
  let topRatedAuthors = Object.values(authorStats).sort(
    (a, b) => b.totalEarnings - a.totalEarnings
  );

  // 4) Add return + formatting
  for (const authorObj of topRatedAuthors) {
    authorObj.totalReturned = 10; // TODO: replace with real logic
    authorObj.returnRoyalty = -500; // TODO: replace with real logic
    authorObj.totalToPay = authorObj.totalEarnings + authorObj.returnRoyalty;

    authorObj.totalEarnings = `₹${authorObj.totalEarnings.toFixed(2)}`;
    authorObj.returnRoyalty =
      authorObj.returnRoyalty < 0
        ? `-₹${Math.abs(authorObj.returnRoyalty).toFixed(2)}`
        : `₹${authorObj.returnRoyalty.toFixed(2)}`;
    authorObj.totalToPay = `₹${authorObj.totalToPay.toFixed(2)}`;
  }

  return topRatedAuthors.slice(0, 5); // only top 5
}

module.exports = { computeTopRatedAuthors };
