import express from 'express';
import {
    getNotifications,
    getUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearReadNotifications
} from '../controllers/notificationController.js';

const router = express.Router();

// GET /api/notifications - Lấy tất cả notifications
router.get('/', getNotifications);

// GET /api/notifications/unread-count - Đếm số chưa đọc
router.get('/unread-count', getUnreadCount);

// PATCH /api/notifications/:id/read - Đánh dấu đã đọc
router.patch('/:id/read', markAsRead);

// PATCH /api/notifications/read-all - Đánh dấu tất cả đã đọc
router.patch('/read-all', markAllAsRead);

// DELETE /api/notifications/:id - Xóa notification
router.delete('/:id', deleteNotification);

// DELETE /api/notifications/clear-read - Xóa tất cả đã đọc
router.delete('/clear-read', clearReadNotifications);

export default router;
