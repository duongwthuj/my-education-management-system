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

const router = express.Router();

// Subject CRUD
router.get('/', getAllSubjects);
router.get('/:id', getSubjectById);
router.get('/:id/levels', getSubjectWithLevels);
router.post('/', createSubject);
router.put('/:id', updateSubject);
router.delete('/:id', deleteSubject);

// Get all subject levels
router.get('/levels/all', getAllSubjectLevels);

// Subject Level Management
router.post('/:id/levels', addSubjectLevel);
router.put('/:id/levels/:levelId', updateSubjectLevel);
router.delete('/:id/levels/:levelId', deleteSubjectLevel);

export default router;
