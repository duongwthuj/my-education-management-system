import { Router, Request, Response } from 'express';
import FreeSchedule from '../models/FreeSchedule';

const router = Router();

// Get all free schedules
router.get('/', async (_req: Request, res: Response) => {
  try {
    const freeSchedules = await FreeSchedule.find()
      .populate('workScheduleId')
      .populate('teacherId', 'name email')
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      data: freeSchedules,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Lỗi lấy lịch rảnh',
    });
  }
});

// Get free schedules by work shift
router.get('/work-shift/:workScheduleId', async (req: Request, res: Response) => {
  try {
    const freeSchedules = await FreeSchedule.find({
      workScheduleId: req.params.workScheduleId,
    })
      .populate('teacherId', 'name email')
      .sort({ startTime: 1 });
    
    res.json({
      success: true,
      data: freeSchedules,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Lỗi lấy lịch rảnh',
    });
  }
});

// Get free schedules by teacher
router.get('/teacher/:teacherId', async (req: Request, res: Response) => {
  try {
    const freeSchedules = await FreeSchedule.find({
      teacherId: req.params.teacherId,
    })
      .populate('workScheduleId')
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      data: freeSchedules,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Lỗi lấy lịch rảnh',
    });
  }
});

// Get free schedule by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const freeSchedule = await FreeSchedule.findById(req.params.id)
      .populate('workScheduleId')
      .populate('teacherId', 'name email');
    
    if (!freeSchedule) {
      return res.status(404).json({
        success: false,
        error: 'Không tìm thấy lịch rảnh',
      });
    }
    
    res.json({
      success: true,
      data: freeSchedule,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Lỗi lấy lịch rảnh',
    });
  }
});

// Create free schedule
router.post('/', async (req: Request, res: Response) => {
  try {
    const freeSchedule = new FreeSchedule(req.body);
    await freeSchedule.save();
    const populated = await FreeSchedule.findById(freeSchedule._id)
      .populate('workScheduleId')
      .populate('teacherId', 'name email');
    
    res.status(201).json({
      success: true,
      data: populated,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Lỗi tạo lịch rảnh',
    });
  }
});

// Update free schedule
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const freeSchedule = await FreeSchedule.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    )
      .populate('workScheduleId')
      .populate('teacherId', 'name email');
    
    if (!freeSchedule) {
      return res.status(404).json({
        success: false,
        error: 'Không tìm thấy lịch rảnh',
      });
    }
    
    res.json({
      success: true,
      data: freeSchedule,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Lỗi cập nhật lịch rảnh',
    });
  }
});

// Delete free schedule
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const freeSchedule = await FreeSchedule.findByIdAndDelete(req.params.id);
    
    if (!freeSchedule) {
      return res.status(404).json({
        success: false,
        error: 'Không tìm thấy lịch rảnh',
      });
    }
    
    res.json({
      success: true,
      message: 'Đã xóa lịch rảnh',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Lỗi xóa lịch rảnh',
    });
  }
});

export default router;
