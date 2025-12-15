import express from 'express';
import {
    getAllSubjects,
    getSubjectById,
    getSubjectWithLevels,
    createSubject,
    updateSubject,
    deleteSubject,
    getAllSubjectLevels,
    addSubjectLevel,
    updateSubjectLevel,
    deleteSubjectLevel
} from '../controllers/subjectController.js';

import { protect, authorize } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use(protect);

// Subject CRUD
// Read: All, Write: Admin
router.get('/', authorize('admin', 'st', 'user'), getAllSubjects);
router.get('/:id', authorize('admin', 'st', 'user'), getSubjectById);
router.get('/:id/levels', authorize('admin', 'st', 'user'), getSubjectWithLevels);
router.get('/levels/all', authorize('admin', 'st', 'user'), getAllSubjectLevels);

router.post('/', authorize('admin'), createSubject);
router.put('/:id', authorize('admin'), updateSubject);
router.delete('/:id', authorize('admin'), deleteSubject);

// Subject Level Management (Admin only)
router.post('/:id/levels', authorize('admin'), addSubjectLevel);
router.put('/:id/levels/:levelId', authorize('admin'), updateSubjectLevel);
router.delete('/:id/levels/:levelId', authorize('admin'), deleteSubjectLevel);

export default router;
