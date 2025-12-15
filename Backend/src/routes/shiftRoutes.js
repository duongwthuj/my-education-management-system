import express from 'express';
import {
    // Shift management
    getAllShifts,
    getShiftById,
    createShift,
    updateShift,
    deleteShift,
    // WorkShift management
    getWorkShifts,
    getTeacherAvailability,
    createWorkShift,
    createBulkWorkShifts,
    updateWorkShift,
    deleteWorkShift,
    deleteWorkShiftsByDateRange
} from '../controllers/shiftController.js';

import { protect, authorize } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Apply protection to all routes
router.use(protect);

// Shift CRUD
// View: All roles, Write: Admin only
router.get('/shifts', authorize('admin', 'st', 'user'), getAllShifts);
router.get('/shifts/:id', authorize('admin', 'st', 'user'), getShiftById);
router.post('/shifts', authorize('admin'), createShift);
router.put('/shifts/:id', authorize('admin'), updateShift);
router.delete('/shifts/:id', authorize('admin'), deleteShift);

// WorkShift CRUD
// View: All roles, Write: Admin only
router.get('/work-shifts', authorize('admin', 'st', 'user'), getWorkShifts);
router.get('/work-shifts/availability', authorize('admin', 'st', 'user'), getTeacherAvailability);
router.post('/work-shifts', authorize('admin'), createWorkShift);
router.post('/work-shifts/bulk', authorize('admin'), createBulkWorkShifts);
router.put('/work-shifts/:id', authorize('admin'), updateWorkShift);
router.delete('/work-shifts/:id', authorize('admin'), deleteWorkShift);
router.delete('/work-shifts/bulk/delete', authorize('admin'), deleteWorkShiftsByDateRange);

export default router;
