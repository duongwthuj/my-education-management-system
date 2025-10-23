import { Router } from 'express';
import teachersRouter from './teachers';
import subjectsRouter from './subjects';
import classesRouter from './classes';
import schedulesRouter from './schedules';
import workSchedulesRouter from './work-schedules';
import teachingSchedulesRouter from './teaching-schedules';
import freeSchedulesRouter from './free-schedules';

const router = Router();

router.use('/teachers', teachersRouter);
router.use('/subjects', subjectsRouter);
router.use('/classes', classesRouter);
router.use('/schedules', schedulesRouter);
router.use('/work-schedules', workSchedulesRouter);
router.use('/teaching-schedules', teachingSchedulesRouter);
router.use('/free-schedules', freeSchedulesRouter);

// Health check
router.get('/health', (_req, res) => {
  res.json({
    success: true,
    message: 'API is running',
    timestamp: new Date().toISOString(),
  });
});

export default router;
