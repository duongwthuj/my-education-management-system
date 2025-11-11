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

const router = express.Router();

// Shift CRUD
router.get('/shifts', getAllShifts);
router.get('/shifts/:id', getShiftById);
router.post('/shifts', createShift);
router.put('/shifts/:id', updateShift);
router.delete('/shifts/:id', deleteShift);

// WorkShift CRUD
router.get('/work-shifts', getWorkShifts);
router.get('/work-shifts/availability', getTeacherAvailability);
router.post('/work-shifts', createWorkShift);
router.post('/work-shifts/bulk', createBulkWorkShifts);
router.put('/work-shifts/:id', updateWorkShift);
router.delete('/work-shifts/:id', deleteWorkShift);
router.delete('/work-shifts/bulk/delete', deleteWorkShiftsByDateRange);

export default router;
