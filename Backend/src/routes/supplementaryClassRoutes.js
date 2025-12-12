import express from 'express';
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

// SupplementaryClass CRUD
router.get('/', getAllSupplementaryClasses);
router.get('/:id', getSupplementaryClassById);
router.post('/', createSupplementaryClass);
router.post('/with-assignment', createSupplementaryClassWithAssignment);
router.put('/:id', updateSupplementaryClass);
router.delete('/:id', deleteSupplementaryClass);

// Auto-assignment and reallocation
router.post('/:id/auto-assign', autoAssignTeacher);
router.post('/:id/reallocate', reallocateTeacher);

// Status management
router.patch('/:id/complete', markAsCompleted);
router.patch('/:id/cancel', cancelSupplementaryClass);

export default router;
