import { Router, Request, Response } from 'express';
import WorkSchedule from '../models/WorkSchedule';
import TeachingSchedule from '../models/TeachingSchedule';
import FreeSchedule from '../models/FreeSchedule';

const router = Router();

// Get all work schedules
router.get('/', async (_req: Request, res: Response) => {
  try {
    const workSchedules = await WorkSchedule.find()
      .populate('teacherId', 'name email')
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      data: workSchedules,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Lỗi lấy lịch làm việc',
    });
  }
});

// Get work schedules by teacher
router.get('/teacher/:teacherId', async (req: Request, res: Response) => {
  try {
    const workSchedules = await WorkSchedule.find({ teacherId: req.params.teacherId })
      .populate('teacherId', 'name email')
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      data: workSchedules,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Lỗi lấy lịch làm việc',
    });
  }
});

// Get work schedule by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const workSchedule = await WorkSchedule.findById(req.params.id)
      .populate('teacherId', 'name email');
    
    if (!workSchedule) {
      return res.status(404).json({
        success: false,
        error: 'Không tìm thấy lịch làm việc',
      });
    }
    
    res.json({
      success: true,
      data: workSchedule,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Lỗi lấy lịch làm việc',
    });
  }
});

// Create work schedule
router.post('/', async (req: Request, res: Response) => {
  try {
    const workSchedule = new WorkSchedule(req.body);
    await workSchedule.save();
    await workSchedule.populate('teacherId', 'name email');
    
    res.status(201).json({
      success: true,
      data: workSchedule,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Lỗi tạo lịch làm việc',
    });
  }
});

// Update work schedule
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const workSchedule = await WorkSchedule.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('teacherId', 'name email');
    
    if (!workSchedule) {
      return res.status(404).json({
        success: false,
        error: 'Không tìm thấy lịch làm việc',
      });
    }
    
    res.json({
      success: true,
      data: workSchedule,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Lỗi cập nhật lịch làm việc',
    });
  }
});

// Delete work schedule
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const workSchedule = await WorkSchedule.findByIdAndDelete(req.params.id);
    
    if (!workSchedule) {
      return res.status(404).json({
        success: false,
        error: 'Không tìm thấy lịch làm việc',
      });
    }

    // Also delete related teaching schedules and free schedules
    await TeachingSchedule.deleteMany({ workScheduleId: req.params.id });
    await FreeSchedule.deleteMany({ workScheduleId: req.params.id });
    
    res.json({
      success: true,
      message: 'Đã xóa lịch làm việc',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Lỗi xóa lịch làm việc',
    });
  }
});

export default router;
