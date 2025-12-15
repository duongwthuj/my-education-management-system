import express from 'express';
import {
    getAllTestClasses,
    getTestClassById,
    createTestClass,
    createTestClassWithAssignment,
    autoAssignTeacher,
    reallocateTeacher,
    updateTestClass,
    deleteTestClass,
    markAsCompleted,
    cancelTestClass
} from '../controllers/testClassController.js';

import { protect, authorize } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Apply protection to all routes
router.use(protect);

// TestClass CRUD
// Read: All
router.get('/', authorize('admin', 'st', 'user'), getAllTestClasses);
router.get('/:id', authorize('admin', 'st', 'user'), getTestClassById);

// Write: Admin and ST
router.post('/', authorize('admin', 'st'), createTestClass);
router.post('/with-assignment', authorize('admin', 'st'), createTestClassWithAssignment);
router.put('/:id', authorize('admin', 'st'), updateTestClass);
router.delete('/:id', authorize('admin', 'st'), deleteTestClass);

// Auto-assignment and reallocation
router.post('/:id/auto-assign', authorize('admin', 'st'), autoAssignTeacher);
router.post('/:id/reallocate', authorize('admin', 'st'), reallocateTeacher);

// Status management
router.patch('/:id/complete', authorize('admin', 'st'), markAsCompleted);
router.patch('/:id/cancel', authorize('admin', 'st'), cancelTestClass);

export default router;

