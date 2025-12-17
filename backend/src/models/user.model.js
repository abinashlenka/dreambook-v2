// models/user.model.js
const mongoose = require('mongoose');
const { paginate } = require('./plugins/paginate');

// =======================
// Base User Schema
// =======================
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      required: true,
    },
    email: {
      type: String,
      trim: true,
      required: true,
      unique: true, // ✅ each email should be unique
    },
    role: {
      type: String,
      enum: ['admin', 'employee', 'author'],
      default: 'author',
    },
    firebaseUid: {
      type: String,
      required: true,
      unique: true,
    },
    firebaseSignInProvider: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true,
    },
    isBlocked: {
      type: Boolean,
      default: false,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ['Verified', 'Pending', 'Declined'],
      default: 'Pending',
    },
    fcmToken: { type: String, default: null },
  },
  { timestamps: true, discriminatorKey: 'kind' } // ✅ discriminatorKey to identify model type
);

// =======================
// Author Schema
// =======================
const authorSchema = new mongoose.Schema(
  {
    accountHolderName: { type: String, default: "" },
    accountNumber: { type: String, default: "" },
    bankName: { type: String, default: "" },
    ifscCode: { type: String, default: "" },
  },
  { timestamps: true }
);

// =======================
// Employee Schema
// =======================
const employeeSchema = new mongoose.Schema(
  {
    // Add employee-specific fields later if needed
  },
  { timestamps: true }
);

// =======================
// Admin Schema
// =======================
const adminSchema = new mongoose.Schema(
  {
    permissions: {
      type: {
        userListing: { type: Boolean, default: false },
        courseUpload: { type: Boolean, default: false },
        roleManagement: { type: Boolean, default: false },
        analytics: { type: Boolean, default: false },
        policy: { type: Boolean, default: false },
      },
      default: {},
    },
  },
  { timestamps: true }
);

// =======================
// Plugins
// =======================
userSchema.plugin(paginate);
authorSchema.plugin(paginate);
employeeSchema.plugin(paginate);
adminSchema.plugin(paginate);

// =======================
// Models
// =======================
const User = mongoose.model('User', userSchema);
const Author = User.discriminator('Author', authorSchema);
const Employee = User.discriminator('Employee', employeeSchema);
const Admin = User.discriminator('Admin', adminSchema);

module.exports = {
  User,
  Admin,
  Author,
  Employee,
};
