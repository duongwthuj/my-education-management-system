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

const router = express.Router();

// Teacher CRUD
router.get('/', getAllTeachers);
router.get('/:id', getTeacherById);
router.get('/:id/details', getTeacherDetails);
router.post('/', createTeacher);
router.put('/:id', updateTeacher);
router.delete('/:id', deleteTeacher);

// Teacher Level Management
router.post('/:id/levels', addTeacherLevel);
router.put('/:id/levels/:levelId', updateTeacherLevel);
router.delete('/:id/levels/:levelId', deleteTeacherLevel);

// Fixed Schedule Management
router.post('/:id/schedules', addFixedSchedule);
router.put('/:id/schedules/:scheduleId', updateFixedSchedule);
router.delete('/:id/schedules/:scheduleId', deleteFixedSchedule);

export default router;
