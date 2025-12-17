// // services/bookService.js
// const { Book } = require("../models/book.model");

// /**
//  * Sync a book from an external source (WooCommerce, Amazon, etc.)
//  * @param {Object} incomingBook - Book data from external source
//  * @param {string} [source="unknown"] - Source platform name
//  */
// async function syncBookFromExternalSource(incomingBook, source = "unknown") {
//   if (!incomingBook?.title && !incomingBook?.name) return;

//   const title = incomingBook.title || incomingBook.name;

//   // Build update/create fields
//   const updateFields = {
//     title,
//     subtitle: incomingBook.subtitle || "",
//     price: parseFloat(incomingBook.price || 0),
//     description: incomingBook.description || "No description available",
//     coverImage: {
//       url: incomingBook.cover || incomingBook.images?.[0]?.src || "",
//     },
//     bindingSize: incomingBook.bindingSize || [],
//     updatedAt: new Date(),
//   };

//   // Map source to valid platform
//   const platformName = source === "woocommerce" ? "dream" : source;
// console.log("Platform:", platformName);
//   // Check if book exists
//   let existingBook = await Book.findOne({ title });

//   if (existingBook) {
//     // Merge platform if not already present
//     let updatedPlatforms = existingBook.platforms || [];
//     if (!updatedPlatforms.find((p) => p.platform === platformName)) {
//       updatedPlatforms.push({ platform: platformName, royalty: incomingBook.royalty || 0 });
//     }
//     updateFields.platforms = updatedPlatforms;

//     await Book.findByIdAndUpdate(existingBook._id, updateFields);
//     console.log(`✅ Book updated from ${source}: ${title}`);
//   } else {
//     // New book
//     updateFields.platforms = [{ platform: platformName, royalty: incomingBook.royalty || 0 }];
//     await Book.create(updateFields);
//     console.log(`📚 Saved new book from ${source}: ${title}`);
//   }
// }

// module.exports = { syncBookFromExternalSource };



// services/bookService.js
const { Book } = require("../models/book.model");

/**
 * Safely sync a book from an external source (Flipkart, WooCommerce, etc.)
 * - If book exists: updates only missing fields + merges platform info.
 * - If not: creates a new one.
 */
async function syncBookFromExternalSource(incomingBook, source = "unknown") {
  if (!incomingBook?.title && !incomingBook?.name) return;

  const title = incomingBook.title || incomingBook.name;
  const platformName = source === "woocommerce" ? "dream" : source;

  // 🧩 Prepare incoming book fields
  const newFields = {
    title,
    subtitle: incomingBook.subtitle || "",
    price: parseFloat(incomingBook.price || 0),
    description: incomingBook.description || "",
    coverImage: {
      url: incomingBook.cover || incomingBook.images?.[0]?.src || "",
    },
    bindingSize: incomingBook.bindingSize || [],
    updatedAt: new Date(),
  };

  // 🔍 Find existing book by title (case-insensitive)
  let existingBook = await Book.findOne({ title: new RegExp(`^${title}$`, "i") });

  if (existingBook) {
    console.log(`🔄 Found existing book: ${title}`);

    const updateData = {};

    // ✅ Fill only missing fields
    if (!existingBook.subtitle && newFields.subtitle)
      updateData.subtitle = newFields.subtitle;

    if ((!existingBook.description || existingBook.description === "No description available") &&
        newFields.description)
      updateData.description = newFields.description;

    if ((!existingBook.coverImage?.url || existingBook.coverImage?.url === "") &&
        newFields.coverImage?.url)
      updateData.coverImage = newFields.coverImage;

    if ((!existingBook.price || existingBook.price === 0) && newFields.price)
      updateData.price = newFields.price;

    if (!existingBook.bindingSize?.length && newFields.bindingSize?.length)
      updateData.bindingSize = newFields.bindingSize;

    // ✅ Update or merge platform info
    const platforms = [...(existingBook.platforms || [])];
    const existingPlatform = platforms.find((p) => p.platform === platformName);

    if (existingPlatform) {
      // Update royalty if new one is provided and different
      if (incomingBook.royalty && existingPlatform.royalty !== incomingBook.royalty) {
        existingPlatform.royalty = incomingBook.royalty;
      }
    } else {
      // Add new platform entry
      platforms.push({
        platform: platformName,
        royalty: incomingBook.royalty || 0,
      });
    }

    updateData.platforms = platforms;
    updateData.updatedAt = new Date();

    // 📝 Apply update
    await Book.findByIdAndUpdate(existingBook._id, updateData);
    console.log(`✅ Updated book (${title}) with missing fields/platform changes`);
  } else {
    // 🆕 Create new book if not exists
    newFields.platforms = [
      { platform: platformName, royalty: incomingBook.royalty || 0 },
    ];

    await Book.create(newFields);
    console.log(`📚 Created new book from ${source}: ${title}`);
  }
}

module.exports = { syncBookFromExternalSource };
