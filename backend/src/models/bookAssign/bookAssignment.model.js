const mongoose = require("mongoose");

const bookAssignmentSchema = new mongoose.Schema({
  bookId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Book",
    required: true
  },
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  status: {
    type: String,
    enum: ["approved", "pending", "rejected"],
    default: "pending"
  },
  approvedByorRejectedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  assignedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  assignedAt: {
    type: Date,
    default: Date.now
  },
  isDeleted: { // ✅ soft delete flag
    type: Boolean,
    default: false
  },
  deletedAt: { // optional timestamp
    type: Date
  }
}, { timestamps: true });

const BookAssignment = mongoose.model("BookAssignment", bookAssignmentSchema);
module.exports = { BookAssignment };
