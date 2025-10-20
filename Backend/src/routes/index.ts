import { Router } from 'express';
import teachersRouter from './teachers';
import subjectsRouter from './subjects';
import classesRouter from './classes';
import schedulesRouter from './schedules';

const router = Router();

router.use('/teachers', teachersRouter);
router.use('/subjects', subjectsRouter);
router.use('/classes', classesRouter);
router.use('/schedules', schedulesRouter);

// Health check
router.get('/health', (_req, res) => {
  res.json({
    success: true,
    message: 'API is running',
    timestamp: new Date().toISOString(),
  });
});

export default router;
