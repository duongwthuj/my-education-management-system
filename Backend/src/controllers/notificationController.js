import Notification from '../models/notification.js';

// GET: Lấy tất cả notifications
export const getNotifications = async (req, res) => {
    try {
        const { isRead, limit = 50 } = req.query;
        
        const filter = {};
        if (isRead !== undefined) {
            filter.isRead = isRead === 'true';
        }
        
        const notifications = await Notification.find(filter)
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .populate('relatedId');
        
        const unreadCount = await Notification.countDocuments({ isRead: false });
        
        res.status(200).json({
            success: true,
            data: notifications,
            unreadCount
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching notifications',
            error: error.message
        });
    }
};

// GET: Đếm số notification chưa đọc
export const getUnreadCount = async (req, res) => {
    try {
        const count = await Notification.countDocuments({ isRead: false });
        
        res.status(200).json({
            success: true,
            data: { count }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error counting unread notifications',
            error: error.message
        });
    }
};

// PATCH: Đánh dấu notification đã đọc
export const markAsRead = async (req, res) => {
    try {
        const { id } = req.params;
        
        const notification = await Notification.findByIdAndUpdate(
            id,
            { isRead: true },
            { new: true }
        );
        
        if (!notification) {
            return res.status(404).json({
                success: false,
                message: 'Notification not found'
            });
        }
        
        res.status(200).json({
            success: true,
            data: notification
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error marking notification as read',
            error: error.message
        });
    }
};

// PATCH: Đánh dấu tất cả đã đọc
export const markAllAsRead = async (req, res) => {
    try {
        await Notification.updateMany(
            { isRead: false },
            { isRead: true }
        );
        
        res.status(200).json({
            success: true,
            message: 'All notifications marked as read'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error marking all notifications as read',
            error: error.message
        });
    }
};

// DELETE: Xóa notification
export const deleteNotification = async (req, res) => {
    try {
        const { id } = req.params;
        
        const notification = await Notification.findByIdAndDelete(id);
        
        if (!notification) {
            return res.status(404).json({
                success: false,
                message: 'Notification not found'
            });
        }
        
        res.status(200).json({
            success: true,
            message: 'Notification deleted'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error deleting notification',
            error: error.message
        });
    }
};

// DELETE: Xóa tất cả notifications đã đọc
export const clearReadNotifications = async (req, res) => {
    try {
        const result = await Notification.deleteMany({ isRead: true });
        
        res.status(200).json({
            success: true,
            message: `Deleted ${result.deletedCount} read notifications`
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error clearing read notifications',
            error: error.message
        });
    }
};

export default {
    getNotifications,
    getUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearReadNotifications
};
