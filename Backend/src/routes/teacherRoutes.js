import express from 'express';
import {
    getAllTeachers,
    getTeacherById,
    getTeacherDetails,
    createTeacher,
    updateTeacher,
    deleteTeacher,
    addTeacherLevel,
    updateTeacherLevel,
    deleteTeacherLevel,
    addFixedSchedule,
    updateFixedSchedule,
    deleteFixedSchedule
} from '../controllers/teacherController.js';

import { protect, authorize } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use(protect);

// Teacher CRUD
// Read: All, Write: Admin
router.get('/', authorize('admin', 'st', 'user'), getAllTeachers);
router.get('/:id', authorize('admin', 'st', 'user'), getTeacherById);
router.get('/:id/details', authorize('admin', 'st', 'user'), getTeacherDetails);

router.post('/', authorize('admin'), createTeacher);
router.put('/:id', authorize('admin'), updateTeacher);
router.delete('/:id', authorize('admin'), deleteTeacher);

// Teacher Level Management
router.post('/:id/levels', authorize('admin', 'st', 'user'), addTeacherLevel);
router.put('/:id/levels/:levelId', authorize('admin', 'st', 'user'), updateTeacherLevel);
router.delete('/:id/levels/:levelId', authorize('admin', 'st', 'user'), deleteTeacherLevel);

// Fixed Schedule Management
router.post('/:id/schedules', authorize('admin', 'st', 'user'), addFixedSchedule);
router.put('/:id/schedules/:scheduleId', authorize('admin', 'st', 'user'), updateFixedSchedule);
router.delete('/:id/schedules/:scheduleId', authorize('admin', 'st', 'user'), deleteFixedSchedule);

export default router;
