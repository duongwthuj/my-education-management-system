import express from 'express';
import { getTeachingHoursStats, getTeacherHoursDetail, getOffsetClassStatistics, getTestClassStatistics } from '../controllers/dashboardController.js';

const router = express.Router();

// Get teaching hours statistics for all teachers
router.get('/teaching-hours', getTeachingHoursStats);

// Get detailed hours breakdown for a specific teacher
router.get('/teaching-hours/:teacherId', getTeacherHoursDetail);

// Get offset class statistics
router.get('/offset-statistics', getOffsetClassStatistics);

// Get test class statistics
router.get('/test-class-statistics', getTestClassStatistics);

export default router;
