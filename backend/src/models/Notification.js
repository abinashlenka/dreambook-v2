// models/Notification.js
const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // who receives it
    title: { type: String, required: true },
    body: { type: String, required: true },
    data: { type: Object, default: {} }, // extra payload if needed
    type: { type: String, default: 'general' }, // info, alert, promo, etc.
    isRead: { type: Boolean, default: false },
    deleted:{type:Boolean, default: false }
  },
  { timestamps: true } // adds createdAt & updatedAt
);

module.exports = mongoose.model('Notification', notificationSchema);
