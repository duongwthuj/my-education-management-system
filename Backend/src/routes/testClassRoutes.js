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

const router = express.Router();

// TestClass CRUD
router.get('/', getAllTestClasses);
router.get('/:id', getTestClassById);
router.post('/', createTestClass);
router.post('/with-assignment', createTestClassWithAssignment);
router.put('/:id', updateTestClass);
router.delete('/:id', deleteTestClass);

// Auto-assignment and reallocation
router.post('/:id/auto-assign', autoAssignTeacher);
router.post('/:id/reallocate', reallocateTeacher);

// Status management
router.patch('/:id/complete', markAsCompleted);
router.patch('/:id/cancel', cancelTestClass);

export default router;
