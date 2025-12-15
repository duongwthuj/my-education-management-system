import express from 'express';
import { protect, authorize } from '../middlewares/authMiddleware.js';
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

router.use(protect);

// OffsetClass CRUD
// Read: All, Write: Admin
router.get('/', authorize('admin', 'st', 'user'), getAllOffsetClasses);
router.get('/:id', authorize('admin', 'st', 'user'), getOffsetClassById);

// Write operations (Admin only)
router.post('/', authorize('admin'), createOffsetClass);
router.post('/with-assignment', authorize('admin'), createOffsetClassWithAssignment);
router.post('/bulk', authorize('admin'), createBulkOffsetClasses);
router.put('/:id', authorize('admin'), updateOffsetClass);
router.delete('/:id', authorize('admin'), deleteOffsetClass);

// Auto-assignment and reallocation (Admin only)
router.post('/:id/auto-assign', authorize('admin'), autoAssignTeacher);
router.post('/:id/reallocate', authorize('admin'), reallocateTeacher);

// Status management (Admin only)
router.patch('/:id/complete', authorize('admin'), markAsCompleted);
router.patch('/:id/cancel', authorize('admin'), cancelOffsetClass);

// Google Sheets integration (Admin only)
router.post('/sync-from-sheets', authorize('admin'), syncFromGoogleSheets);
router.get('/preview-sheets', authorize('admin'), previewGoogleSheets);

export default router;
