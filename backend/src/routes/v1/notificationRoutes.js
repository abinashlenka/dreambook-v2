const express = require('express');
const router = express.Router();
const notificationController = require('../../controllers/notification.controller');

// Create & send notification
router.post('/', notificationController.createNotification);

// Get all notifications for a user
router.get('/:userId', notificationController.getUnreadNotificationsByUser);

// Mark notification as read
// Mark a single notification as read
router.put('/:id/read', notificationController.markSingleNotificationAsRead);

// Mark all notifications as read
router.put('/clear-all/:id', notificationController.markAllNotificationsAsRead);


// DELETE /notifications/:id
router.delete('/:id', notificationController.deleteNotification);


// Save FCM Token
router.post("/:id/save-token", notificationController.saveFcmToken);



module.exports = router;
