import express from 'express';
import { protect, authorize } from '../middlewares/authMiddleware.js';
import {
    getAllSupplementaryClasses,
    getSupplementaryClassById,
    createSupplementaryClass,
    createSupplementaryClassWithAssignment,
    autoAssignTeacher,
    reallocateTeacher,
    updateSupplementaryClass,
    deleteSupplementaryClass,
    markAsCompleted,
    cancelSupplementaryClass
} from '../controllers/supplementaryClassController.js';

const router = express.Router();

router.use(protect);

// SupplementaryClass CRUD
// Read: All, Write: Admin
router.get('/', authorize('admin', 'st', 'user'), getAllSupplementaryClasses);
router.get('/:id', authorize('admin', 'st', 'user'), getSupplementaryClassById);

// Write operations (Admin only)
router.post('/', authorize('admin'), createSupplementaryClass);
router.post('/with-assignment', authorize('admin'), createSupplementaryClassWithAssignment);
router.put('/:id', authorize('admin'), updateSupplementaryClass);
router.delete('/:id', authorize('admin'), deleteSupplementaryClass);

// Auto-assignment and reallocation
router.post('/:id/auto-assign', authorize('admin'), autoAssignTeacher);
router.post('/:id/reallocate', authorize('admin'), reallocateTeacher);

// Status management
router.patch('/:id/complete', authorize('admin'), markAsCompleted);
router.patch('/:id/cancel', authorize('admin'), cancelSupplementaryClass);

export default router;
