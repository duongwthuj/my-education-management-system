import express from 'express';
import { getTeachingHoursStats, getTeacherHoursDetail, getOffsetClassStatistics } from '../controllers/dashboardController.js';

const router = express.Router();

// Get teaching hours statistics for all teachers
router.get('/teaching-hours', getTeachingHoursStats);

// Get detailed hours breakdown for a specific teacher
router.get('/teaching-hours/:teacherId', getTeacherHoursDetail);

// Get offset class statistics
router.get('/offset-statistics', getOffsetClassStatistics);

export default router;
