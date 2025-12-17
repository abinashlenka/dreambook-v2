const mongoose = require("mongoose");
const Notification = require('../models/Notification');
const { createAndSendNotification } = require('../services/notifications');
const {User} = require('../models/user.model');
// Create & send notification
exports.createNotification = async (req, res) => {
  const { userId, email, title, body, data, topic } = req.body;
  try {
    const notification = await createAndSendNotification({ userId, email, title, body, data, topic });
    res.status(201).json(notification);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to send notification' });
  }
};

// Get all notifications for a user
// Get all unread notifications for a user
exports.getUnreadNotificationsByUser = async (req, res) => {
  try {
    const notifications = await Notification.find({
      userId: req.params.userId,
      isRead: false,
    }).sort({ createdAt: -1 });

    res.json(notifications);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch unread notifications' });
  }
};


// Mark notification as read
// Mark a single notification as read
exports.markSingleNotificationAsRead = async (req, res) => {
  try {
    const notification = await Notification.findByIdAndUpdate(
      req.params.id,
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    res.json(notification);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update notification' });
  }
};

// Mark all notifications as read for logged-in user
exports.markAllNotificationsAsRead = async (req, res) => {
  try {
    const userId=req.params.id
    const notifications = await Notification.updateMany(
      { userId, isRead: false },
      { $set: { isRead: true } }
    );
    console.log("userId",userId)
    console.log("notifications",notifications)
    res.json({ message: 'All notifications marked as read', updatedCount: notifications.modifiedCount });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to mark all notifications as read' });
  }
};


// Delete a single notification
exports.deleteNotification = async (req, res) => {
  try {
    const notification = await Notification.findOneAndDelete({
      _id: req.params.id,
    });

    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    res.json({ message: 'Notification deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete notification' });
  }
};



//  Save FCM Token
exports.saveFcmToken = async (req, res) => {
  try {
    const { fcmToken } = req.body;
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid user ID" });
    }

    const user = await User.findByIdAndUpdate(
      id,
      { fcmToken },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ success: true });
  } catch (err) {
    console.error("Error saving FCM token:", err);
    res.status(500).json({ error: "Failed to save token" });
  }
};

