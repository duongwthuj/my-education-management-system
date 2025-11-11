import express from 'express';
import {
    getFixedScheduleLeaves,
    createFixedScheduleLeave,
    deleteFixedScheduleLeave
} from '../controllers/fixedScheduleLeaveController.js';

const router = express.Router();

router.get('/', getFixedScheduleLeaves);
router.post('/', createFixedScheduleLeave);
router.delete('/', deleteFixedScheduleLeave);

export default router;
