import express from 'express';
import {
    getAllOffsetClasses,
    getOffsetClassById,
    createOffsetClass,
    createOffsetClassWithAssignment,
    createBulkOffsetClasses,
    autoAssignTeacher,
    reallocateTeacher,
    updateOffsetClass,
    deleteOffsetClass,
    markAsCompleted,
    cancelOffsetClass,
    syncFromGoogleSheets,
    previewGoogleSheets
} from '../controllers/offsetClassController.js';

const router = express.Router();

// OffsetClass CRUD
router.get('/', getAllOffsetClasses);
router.get('/:id', getOffsetClassById);
router.post('/', createOffsetClass);
router.post('/with-assignment', createOffsetClassWithAssignment);
router.post('/bulk', createBulkOffsetClasses);
router.put('/:id', updateOffsetClass);
router.delete('/:id', deleteOffsetClass);

// Auto-assignment and reallocation
router.post('/:id/auto-assign', autoAssignTeacher);
router.post('/:id/reallocate', reallocateTeacher);

// Status management
router.patch('/:id/complete', markAsCompleted);
router.patch('/:id/cancel', cancelOffsetClass);

// Google Sheets integration
router.post('/sync-from-sheets', syncFromGoogleSheets);
router.get('/preview-sheets', previewGoogleSheets);

export default router;
