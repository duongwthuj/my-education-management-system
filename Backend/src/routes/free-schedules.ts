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
    
    const transformed = freeSchedules.map((fs: any) => ({
      id: fs._id?.toString() || fs.id,
      workScheduleId: fs.workScheduleId?._id?.toString() || fs.workScheduleId?.id || fs.workScheduleId,
      teacherId: fs.teacherId?._id?.toString() || fs.teacherId?.id || fs.teacherId,
      teacherName: (fs.teacherId as any)?.name,
      dayOfWeek: fs.dayOfWeek,
      startTime: fs.startTime,
      endTime: fs.endTime,
      reason: fs.reason,
      notes: fs.notes,
      createdAt: fs.createdAt,
      updatedAt: fs.updatedAt,
    }));
    
    res.json({
      success: true,
      data: transformed,
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
    
    const transformed = freeSchedules.map((fs: any) => ({
      id: fs._id?.toString() || fs.id,
      workScheduleId: fs.workScheduleId?.toString() || fs.workScheduleId,
      teacherId: fs.teacherId?._id?.toString() || fs.teacherId?.id || fs.teacherId,
      teacherName: (fs.teacherId as any)?.name,
      dayOfWeek: fs.dayOfWeek,
      startTime: fs.startTime,
      endTime: fs.endTime,
      reason: fs.reason,
      notes: fs.notes,
      createdAt: fs.createdAt,
      updatedAt: fs.updatedAt,
    }));
    
    res.json({
      success: true,
      data: transformed,
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
      .populate('teacherId', 'name email')
      .sort({ createdAt: -1 });
    
    const transformed = freeSchedules.map((fs: any) => ({
      id: fs._id?.toString() || fs.id,
      workScheduleId: fs.workScheduleId?._id?.toString() || fs.workScheduleId?.id || fs.workScheduleId,
      teacherId: fs.teacherId?._id?.toString() || fs.teacherId?.id || fs.teacherId,
      teacherName: (fs.teacherId as any)?.name,
      dayOfWeek: fs.dayOfWeek,
      startTime: fs.startTime,
      endTime: fs.endTime,
      reason: fs.reason,
      notes: fs.notes,
      createdAt: fs.createdAt,
      updatedAt: fs.updatedAt,
    }));
    
    res.json({
      success: true,
      data: transformed,
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
    
    const transformed = {
      id: (freeSchedule as any)._id?.toString() || (freeSchedule as any).id,
      workScheduleId: (freeSchedule as any).workScheduleId?._id?.toString() || (freeSchedule as any).workScheduleId?.id || (freeSchedule as any).workScheduleId,
      teacherId: (freeSchedule as any).teacherId?._id?.toString() || (freeSchedule as any).teacherId?.id || (freeSchedule as any).teacherId,
      teacherName: ((freeSchedule as any).teacherId as any)?.name,
      dayOfWeek: (freeSchedule as any).dayOfWeek,
      startTime: (freeSchedule as any).startTime,
      endTime: (freeSchedule as any).endTime,
      reason: (freeSchedule as any).reason,
      notes: (freeSchedule as any).notes,
      createdAt: (freeSchedule as any).createdAt,
      updatedAt: (freeSchedule as any).updatedAt,
    };
    
    res.json({
      success: true,
      data: transformed,
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
    
    const transformed = {
      id: (populated as any)._id?.toString() || (populated as any).id,
      workScheduleId: (populated as any).workScheduleId?._id?.toString() || (populated as any).workScheduleId?.id || (populated as any).workScheduleId,
      teacherId: (populated as any).teacherId?._id?.toString() || (populated as any).teacherId?.id || (populated as any).teacherId,
      teacherName: ((populated as any).teacherId as any)?.name,
      dayOfWeek: (populated as any).dayOfWeek,
      startTime: (populated as any).startTime,
      endTime: (populated as any).endTime,
      reason: (populated as any).reason,
      notes: (populated as any).notes,
      createdAt: (populated as any).createdAt,
      updatedAt: (populated as any).updatedAt,
    };
    
    res.status(201).json({
      success: true,
      data: transformed,
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
    
    const transformed = {
      id: (freeSchedule as any)._id?.toString() || (freeSchedule as any).id,
      workScheduleId: (freeSchedule as any).workScheduleId?._id?.toString() || (freeSchedule as any).workScheduleId?.id || (freeSchedule as any).workScheduleId,
      teacherId: (freeSchedule as any).teacherId?._id?.toString() || (freeSchedule as any).teacherId?.id || (freeSchedule as any).teacherId,
      teacherName: ((freeSchedule as any).teacherId as any)?.name,
      dayOfWeek: (freeSchedule as any).dayOfWeek,
      startTime: (freeSchedule as any).startTime,
      endTime: (freeSchedule as any).endTime,
      reason: (freeSchedule as any).reason,
      notes: (freeSchedule as any).notes,
      createdAt: (freeSchedule as any).createdAt,
      updatedAt: (freeSchedule as any).updatedAt,
    };
    
    res.json({
      success: true,
      data: transformed,
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
