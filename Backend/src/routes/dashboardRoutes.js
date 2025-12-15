import express from 'express';
import { protect, authorize } from '../middlewares/authMiddleware.js';
import {
    getTeachingHoursStats,
    getTeacherHoursDetail,
    getOffsetClassStatistics,
    getTestClassStatistics,
    getPersonalStats
} from '../controllers/dashboardController.js';

const router = express.Router();

router.use(protect);

// Personal stats (Accessible by admin, st, user)
router.get('/my-stats', authorize('admin', 'st', 'user'), getPersonalStats);

// Admin Dashboard Routes - Explicitly authorized for Admin only
// Get teaching hours statistics for all teachers
router.get('/teaching-hours', authorize('admin'), getTeachingHoursStats);

// Get detailed hours breakdown for a specific teacher
router.get('/teaching-hours/:teacherId', authorize('admin'), getTeacherHoursDetail);

// Get offset class statistics
router.get('/offset-statistics', authorize('admin'), getOffsetClassStatistics);

// Get test class statistics
router.get('/test-class-statistics', authorize('admin'), getTestClassStatistics);

export default router;
