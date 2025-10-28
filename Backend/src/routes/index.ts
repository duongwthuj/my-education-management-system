import { Router } from 'express';
import teachersRouter from './teachers';
import subjectsRouter from './subjects';
import classesRouter from './classes';
import workSchedulesRouter from './work-schedules';
import teachingSchedulesRouter from './teaching-schedules';
import freeSchedulesRouter from './free-schedules';
import importSchedulesRouter from './import-schedules';
import teachesRouter from './teaches';

const router = Router();

router.use('/teachers', teachersRouter);
router.use('/subjects', subjectsRouter);
router.use('/classes', classesRouter);
router.use('/work-schedules', workSchedulesRouter);
router.use('/teaching-schedules', teachingSchedulesRouter);
router.use('/free-schedules', freeSchedulesRouter);
router.use('/import-schedules', importSchedulesRouter);
router.use('/teaches', teachesRouter);

// Health check
router.get('/health', (_req, res) => {
  res.json({
    success: true,
    message: 'API is running',
    timestamp: new Date().toISOString(),
  });
});

export default router;
