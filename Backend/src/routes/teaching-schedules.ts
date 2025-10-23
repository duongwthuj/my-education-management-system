import { Router, Request, Response } from 'express';
import TeachingSchedule from '../models/TeachingSchedule';
import WorkSchedule from '../models/WorkSchedule';
import FreeSchedule from '../models/FreeSchedule';

const router = Router();

/**
 * Helper function to generate free schedules based on work schedule and teaching schedules
 */
async function generateFreeSchedules(workScheduleId: string, teacherId: string) {
  try {
    // Get the work schedule
    const workSchedule = await WorkSchedule.findById(workScheduleId);
    if (!workSchedule) return;

    // Get all teaching schedules for this work shift
    const teachingSchedules = await TeachingSchedule.find({
      workScheduleId,
      teacherId,
    }).sort({ startTime: 1 });

    // Delete existing free schedules for this work shift
    await FreeSchedule.deleteMany({ workScheduleId, teacherId });

    // If no teaching schedules, entire shift is free
    if (teachingSchedules.length === 0) {
      await FreeSchedule.create({
        workScheduleId,
        teacherId,
        dayOfWeek: workSchedule.dayOfWeek,
        startTime: workSchedule.startTime,
        endTime: workSchedule.endTime,
        reason: 'other',
        notes: 'Toàn bộ ca làm việc',
      });
      return;
    }

    // Generate free time slots between teaching sessions
    const freeSlots: any[] = [];

    // Check for free time before first teaching
    const firstTeaching = teachingSchedules[0];
    if (firstTeaching.startTime > workSchedule.startTime) {
      freeSlots.push({
        workScheduleId,
        teacherId,
        dayOfWeek: workSchedule.dayOfWeek,
        startTime: workSchedule.startTime,
        endTime: firstTeaching.startTime,
        reason: firstTeaching.startTime === '12:00' ? 'lunch' : 'break',
        notes: firstTeaching.startTime === '12:00' ? 'Ăn trưa' : 'Giải lao',
      });
    }

    // Check for free time between teaching sessions
    for (let i = 0; i < teachingSchedules.length - 1; i++) {
      const current = teachingSchedules[i];
      const next = teachingSchedules[i + 1];

      if (current.endTime < next.startTime) {
        freeSlots.push({
          workScheduleId,
          teacherId,
          dayOfWeek: workSchedule.dayOfWeek,
          startTime: current.endTime,
          endTime: next.startTime,
          reason: next.startTime === '12:00' ? 'lunch' : 'break',
          notes: next.startTime === '12:00' ? 'Ăn trưa' : 'Giải lao',
        });
      }
    }

    // Check for free time after last teaching
    const lastTeaching = teachingSchedules[teachingSchedules.length - 1];
    if (lastTeaching.endTime < workSchedule.endTime) {
      freeSlots.push({
        workScheduleId,
        teacherId,
        dayOfWeek: workSchedule.dayOfWeek,
        startTime: lastTeaching.endTime,
        endTime: workSchedule.endTime,
        reason: 'break',
        notes: 'Giải lao',
      });
    }

    // Insert free schedule slots
    if (freeSlots.length > 0) {
      await FreeSchedule.insertMany(freeSlots);
    }
  } catch (error) {
    console.error('Error generating free schedules:', error);
  }
}

// Get all teaching schedules
router.get('/', async (_req: Request, res: Response) => {
  try {
    const teachingSchedules = await TeachingSchedule.find()
      .populate('workScheduleId')
      .populate('teacherId', 'name email')
      .populate('subjectId', 'name code')
      .populate('classId', 'name')
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      data: teachingSchedules,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Lỗi lấy lịch giảng dạy',
    });
  }
});

// Get teaching schedules by work shift
router.get('/work-shift/:workScheduleId', async (req: Request, res: Response) => {
  try {
    const teachingSchedules = await TeachingSchedule.find({
      workScheduleId: req.params.workScheduleId,
    })
      .populate('teacherId', 'name email')
      .populate('subjectId', 'name code')
      .populate('classId', 'name')
      .sort({ startTime: 1 });
    
    res.json({
      success: true,
      data: teachingSchedules,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Lỗi lấy lịch giảng dạy',
    });
  }
});

// Get teaching schedules by teacher
router.get('/teacher/:teacherId', async (req: Request, res: Response) => {
  try {
    const teachingSchedules = await TeachingSchedule.find({
      teacherId: req.params.teacherId,
    })
      .populate('workScheduleId')
      .populate('subjectId', 'name code')
      .populate('classId', 'name')
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      data: teachingSchedules,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Lỗi lấy lịch giảng dạy',
    });
  }
});

// Get teaching schedule by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const teachingSchedule = await TeachingSchedule.findById(req.params.id)
      .populate('workScheduleId')
      .populate('teacherId', 'name email')
      .populate('subjectId', 'name code')
      .populate('classId', 'name');
    
    if (!teachingSchedule) {
      return res.status(404).json({
        success: false,
        error: 'Không tìm thấy lịch giảng dạy',
      });
    }
    
    res.json({
      success: true,
      data: teachingSchedule,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Lỗi lấy lịch giảng dạy',
    });
  }
});

// Create teaching schedule
router.post('/', async (req: Request, res: Response) => {
  try {
    const teachingSchedule = new TeachingSchedule(req.body);
    await teachingSchedule.save();
    
    // Auto-generate free schedules
    await generateFreeSchedules(
      String(teachingSchedule.workScheduleId),
      String(teachingSchedule.teacherId)
    );
    
    const populated = await TeachingSchedule.findById(teachingSchedule._id)
      .populate('workScheduleId')
      .populate('teacherId', 'name email')
      .populate('subjectId', 'name code')
      .populate('classId', 'name');
    
    res.status(201).json({
      success: true,
      data: populated,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Lỗi tạo lịch giảng dạy',
    });
  }
});

// Update teaching schedule
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const teachingSchedule = await TeachingSchedule.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    )
      .populate('workScheduleId')
      .populate('teacherId', 'name email')
      .populate('subjectId', 'name code')
      .populate('classId', 'name');
    
    if (!teachingSchedule) {
      return res.status(404).json({
        success: false,
        error: 'Không tìm thấy lịch giảng dạy',
      });
    }
    
    // Auto-regenerate free schedules
    await generateFreeSchedules(
      String(teachingSchedule.workScheduleId),
      String(teachingSchedule.teacherId)
    );
    
    res.json({
      success: true,
      data: teachingSchedule,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Lỗi cập nhật lịch giảng dạy',
    });
  }
});

// Delete teaching schedule
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const teachingSchedule = await TeachingSchedule.findByIdAndDelete(
      req.params.id
    );
    
    if (!teachingSchedule) {
      return res.status(404).json({
        success: false,
        error: 'Không tìm thấy lịch giảng dạy',
      });
    }
    
    res.json({
      success: true,
      message: 'Đã xóa lịch giảng dạy',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Lỗi xóa lịch giảng dạy',
    });
  }
});

export default router;
