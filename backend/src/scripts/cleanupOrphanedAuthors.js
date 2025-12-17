// scripts/cleanupOrphanedAuthors.js

const mongoose = require('mongoose');
require('dotenv').config(); // If you use env variables

// Import your Book model
const Book = require('../models/book.model'); // Adjust path as needed

async function cleanupOrphanedAuthorReferences() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'your-mongodb-connection-string');
    console.log('Connected to MongoDB');
    
    console.log("Starting cleanup of orphaned author references...");
    
    // First, let's see how many books have orphaned references
    const orphanedBooks = await Book.aggregate([
      {
        $match: {
          author: { $exists: true, $ne: null, $type: "objectId" }
        }
      },
      {
        $lookup: {
          from: "users", // Change this to your actual authors collection name
          localField: "author",
          foreignField: "_id",
          as: "authorDoc"
        }
      },
      {
        $match: {
          authorDoc: { $size: 0 }
        }
      },
      {
        $project: {
          title: 1,
          author: 1
        }
      }
    ]);
    
    console.log(`Found ${orphanedBooks.length} books with orphaned author references`);
    
    if (orphanedBooks.length > 0) {
      // Show some examples
      console.log("Sample orphaned books:");
      orphanedBooks.slice(0, 5).forEach((book, index) => {
        console.log(`${index + 1}. ${book.title} (Author ID: ${book.author})`);
      });
      
      // Ask for confirmation (optional)
      console.log(`\nAbout to update ${orphanedBooks.length} books to set author = null`);
      
      // Clean them up by setting author to null
      const updateResult = await Book.updateMany(
        { 
          _id: { $in: orphanedBooks.map(book => book._id) }
        },
        { 
          $set: { author: null }
        }
      );
      
      console.log(`✅ Successfully updated ${updateResult.modifiedCount} books`);
    } else {
      console.log("✅ No orphaned references found. Database is clean!");
    }
    
  } catch (error) {
    console.error("❌ Error cleaning up orphaned references:", error);
  } finally {
    // Close connection
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
    process.exit(0);
  }
}

// Run the cleanup
cleanupOrphanedAuthorReferences();