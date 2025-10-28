import { Router, Request, Response } from 'express';
import { WorkSchedule, TeachingSchedule, FreeSchedule, Teacher, Teach, Subject, Class } from '../models';

const router = Router();

interface WorkScheduleImportData {
  teacherId?: string;
  teacherEmail?: string;
  teacherName?: string;
  dayOfWeek: string;
  shift: string;
  startTime: string;
  endTime: string;
  duration: number;
  status?: string;
  notes?: string;
}

interface TeachImportData {
  teacherId?: string;
  teacherEmail?: string;
  teacherName?: string;
  subjectId?: string;
  subjectCode?: string;
  subjectName?: string;
  className?: string; // Tên lớp cố định (VD: 10A1, 11B2) - optional for fixed
  classId?: string; // optional: when importing session type, you may provide a Class ObjectId
  classType?: 'fixed' | 'session';
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  notes?: string;
}

/**
 * POST /api/import-schedules/work-schedules
 * Import work schedules from JSON
 */
router.post('/work-schedules', async (req: Request, res: Response) => {
  try {
    const schedules: WorkScheduleImportData[] = req.body.schedules;
    
    if (!Array.isArray(schedules) || schedules.length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Dữ liệu import phải là mảng và không được rỗng' 
      });
    }

    const results = {
      success: [] as any[],
      failed: [] as any[],
      total: schedules.length,
    };

    // Process each schedule
    for (let i = 0; i < schedules.length; i++) {
      const scheduleData = schedules[i];
      
      try {
        // Find teacher by ID, email, or name
        let teacher = null;
        if (scheduleData.teacherId) {
          teacher = await Teacher.findById(scheduleData.teacherId);
        } else if (scheduleData.teacherEmail) {
          teacher = await Teacher.findOne({ email: scheduleData.teacherEmail });
        } else if (scheduleData.teacherName) {
          teacher = await Teacher.findOne({ name: scheduleData.teacherName });
        }

        if (!teacher) {
          results.failed.push({
            index: i,
            data: scheduleData,
            error: 'Không tìm thấy giáo viên',
          });
          continue;
        }

        // Check for duplicate
        const existing = await WorkSchedule.findOne({
          teacherId: teacher._id,
          dayOfWeek: scheduleData.dayOfWeek,
          shift: scheduleData.shift,
        });

        if (existing) {
          results.failed.push({
            index: i,
            data: scheduleData,
            error: 'Lịch làm việc đã tồn tại',
          });
          continue;
        }

        // Create work schedule
        const workSchedule = await WorkSchedule.create({
          teacherId: teacher._id,
          dayOfWeek: scheduleData.dayOfWeek,
          shift: scheduleData.shift,
          startTime: scheduleData.startTime,
          endTime: scheduleData.endTime,
          duration: scheduleData.duration,
          status: scheduleData.status || 'scheduled',
          notes: scheduleData.notes || '',
        });

        results.success.push({
          index: i,
          workScheduleId: workSchedule._id,
          teacher: teacher.name,
        });
      } catch (error: any) {
        results.failed.push({
          index: i,
          data: scheduleData,
          error: error.message,
        });
      }
    }

    res.json({
      success: true,
      message: `Import hoàn tất: ${results.success.length} thành công, ${results.failed.length} thất bại`,
      data: results,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/import-schedules/teaches
 * Import teach assignments (lớp cố định) from JSON
 */
router.post('/teaches', async (req: Request, res: Response) => {
  try {
    const teaches: TeachImportData[] = req.body.teaches;
    
    if (!Array.isArray(teaches) || teaches.length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Dữ liệu import phải là mảng và không được rỗng' 
      });
    }

    const results = {
      success: [] as any[],
      failed: [] as any[],
      total: teaches.length,
    };

    // Process each teach assignment
    for (let i = 0; i < teaches.length; i++) {
      const teachData = teaches[i];
      
      try {
        // Find teacher
        let teacher = null;
        if (teachData.teacherId) {
          teacher = await Teacher.findById(teachData.teacherId);
        } else if (teachData.teacherEmail) {
          teacher = await Teacher.findOne({ email: teachData.teacherEmail });
        } else if (teachData.teacherName) {
          teacher = await Teacher.findOne({ name: teachData.teacherName });
        }

        if (!teacher) {
          results.failed.push({
            index: i,
            data: teachData,
            error: 'Không tìm thấy giáo viên',
          });
          continue;
        }

        // Find subject
        let subject = null;
        if (teachData.subjectId) {
          subject = await Subject.findById(teachData.subjectId);
        } else if (teachData.subjectCode) {
          subject = await Subject.findOne({ code: teachData.subjectCode });
        } else if (teachData.subjectName) {
          subject = await Subject.findOne({ name: teachData.subjectName });
        }

        if (!subject) {
          results.failed.push({
            index: i,
            data: teachData,
            error: 'Không tìm thấy môn học',
          });
          continue;
        }

        // Validate classType / class info
        const classType = teachData.classType || 'fixed';

        let sessionClass = null;
        if (classType === 'session') {
          // session must provide classId
          if (!teachData.classId) {
            results.failed.push({ index: i, data: teachData, error: 'classId là bắt buộc khi classType = session' });
            continue;
          }
          sessionClass = await Class.findById(teachData.classId);
          if (!sessionClass) {
            results.failed.push({ index: i, data: teachData, error: 'Không tìm thấy lớp học (classId)' });
            continue;
          }
        }

        // Check for duplicate (teacher + day + time)
        const existing = await Teach.findOne({
          teacherId: teacher._id,
          dayOfWeek: teachData.dayOfWeek,
          startTime: teachData.startTime,
          endTime: teachData.endTime,
        });

        if (existing) {
          results.failed.push({ index: i, data: teachData, error: 'Phân công dạy đã tồn tại' });
          continue;
        }

        // Create teach assignment
        const teach = await Teach.create({
          teacherId: teacher._id,
          subjectId: subject._id,
          className: teachData.className || (sessionClass ? sessionClass.name : ''),
          sessionClassId: sessionClass ? sessionClass._id : null,
          classType: classType,
          dayOfWeek: teachData.dayOfWeek,
          startTime: teachData.startTime,
          endTime: teachData.endTime,
          notes: teachData.notes || '',
        });

        results.success.push({
          index: i,
          teachId: teach._id,
          teacher: teacher.name,
          subject: subject.name,
          className: teach.className || teachData.className || (sessionClass ? sessionClass.name : ''),
          classType,
        });
      } catch (error: any) {
        results.failed.push({
          index: i,
          data: teachData,
          error: error.message,
        });
      }
    }

    res.json({
      success: true,
      message: `Import hoàn tất: ${results.success.length} thành công, ${results.failed.length} thất bại`,
      data: results,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/import-schedules/generate-teaching-and-free
 * Generate teaching schedules and free schedules from Teach + WorkSchedule
 */
router.post('/generate-teaching-and-free', async (req: Request, res: Response) => {
  try {
    const { teacherId } = req.body;

    // Get all work schedules for teacher (or all if no teacher specified)
    const query = teacherId ? { teacherId } : {};
    const workSchedules = await WorkSchedule.find(query);

    if (workSchedules.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Không tìm thấy lịch làm việc nào',
      });
    }

    const results = {
      workSchedulesProcessed: 0,
      teachingSchedulesCreated: 0,
      teachingSchedulesUpdated: 0,
      freeSchedulesGenerated: 0,
    };

    // Delete ALL FreeSchedules for this teacher BEFORE generating new ones
    if (teacherId) {
      await FreeSchedule.deleteMany({ teacherId: teacherId });
    } else {
      // If no specific teacher, delete all FreeSchedules for all teachers with current WorkSchedules
      const allTeacherIds = workSchedules.map(ws => ws.teacherId);
      if (allTeacherIds.length > 0) {
        await FreeSchedule.deleteMany({ teacherId: { $in: allTeacherIds } });
      }
    }

    // For each work schedule, generate teaching schedules from Teach assignments
    for (const workSchedule of workSchedules) {
      // Find all Teach assignments that overlap with this work schedule
      // We'll find all Teach with matching teacher and dayOfWeek
      const teaches = await Teach.find({
        teacherId: workSchedule.teacherId,
        dayOfWeek: workSchedule.dayOfWeek,
      }).populate('subjectId sessionClassId');

      // Filter teaches that fall within work schedule time
      const teachesInWorkSchedule = teaches.filter(teach => {
        const teachStart = timeToMinutes(teach.startTime);
        const teachEnd = timeToMinutes(teach.endTime);
        const workStart = timeToMinutes(workSchedule.startTime);
        const workEnd = timeToMinutes(workSchedule.endTime);
        
        // Teach must be completely within work schedule
        return teachStart >= workStart && teachEnd <= workEnd;
      });

      // Delete existing TeachingSchedule and FreeSchedule for this shift
      await TeachingSchedule.deleteMany({
        workScheduleId: workSchedule._id,
      });
      await FreeSchedule.deleteMany({
        workScheduleId: workSchedule._id,
        teacherId: workSchedule.teacherId,
      });

      const teachingSchedules: Array<{ startTime: string; endTime: string }> = [];

      // Create TeachingSchedule from each Teach assignment
      for (const teach of teachesInWorkSchedule) {
        const isSession = (teach as any).classType === 'session';
        const classIdToSet = isSession ? (teach as any).sessionClassId : null;
        const description = isSession
          ? `${(teach.subjectId as any).name} - ${(teach as any).sessionClassId ? (teach as any).sessionClassId.name : 'Lớp'}`
          : `${(teach.subjectId as any).name} - Lớp ${teach.className}`;

        await TeachingSchedule.create({
          workScheduleId: workSchedule._id,
          teacherId: workSchedule.teacherId,
          subjectId: teach.subjectId,
          classId: classIdToSet,
          dayOfWeek: workSchedule.dayOfWeek,
          startTime: teach.startTime,
          endTime: teach.endTime,
          room: 'Online',
          status: 'scheduled',
          description,
        });

        teachingSchedules.push({
          startTime: teach.startTime,
          endTime: teach.endTime,
        });

        results.teachingSchedulesCreated++;
      }

      // Generate free schedules based on teaching schedules
      const freeSlots = calculateFreeSlots(
        workSchedule.startTime,
        workSchedule.endTime,
        teachingSchedules
      );

      // Create free schedule entries
      for (const slot of freeSlots) {
        await FreeSchedule.create({
          workScheduleId: workSchedule._id,
          teacherId: workSchedule.teacherId,
          dayOfWeek: workSchedule.dayOfWeek,
          startTime: slot.startTime,
          endTime: slot.endTime,
          reason: 'break',
          notes: `Tự động tạo từ lịch làm việc ca ${workSchedule.shift}`,
        });
        results.freeSchedulesGenerated++;
      }

      results.workSchedulesProcessed++;
    }

    res.json({
      success: true,
      message: 'Tạo lịch dạy và lịch trống thành công',
      data: results,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Helper function to calculate free time slots
 */
function calculateFreeSlots(
  shiftStart: string,
  shiftEnd: string,
  busySlots: Array<{ startTime: string; endTime: string }>
): Array<{ startTime: string; endTime: string }> {
  const freeSlots: Array<{ startTime: string; endTime: string }> = [];

  if (busySlots.length === 0) {
    // Entire shift is free
    return [{ startTime: shiftStart, endTime: shiftEnd }];
  }

  // Sort busy slots by start time
  const sorted = busySlots.sort((a, b) => {
    return timeToMinutes(a.startTime) - timeToMinutes(b.startTime);
  });

  // Check for free time before first busy slot
  if (timeToMinutes(sorted[0].startTime) > timeToMinutes(shiftStart)) {
    freeSlots.push({
      startTime: shiftStart,
      endTime: sorted[0].startTime,
    });
  }

  // Check for free time between busy slots
  for (let i = 0; i < sorted.length - 1; i++) {
    const currentEnd = sorted[i].endTime;
    const nextStart = sorted[i + 1].startTime;
    
    if (timeToMinutes(nextStart) > timeToMinutes(currentEnd)) {
      freeSlots.push({
        startTime: currentEnd,
        endTime: nextStart,
      });
    }
  }

  // Check for free time after last busy slot
  const lastBusyEnd = sorted[sorted.length - 1].endTime;
  if (timeToMinutes(shiftEnd) > timeToMinutes(lastBusyEnd)) {
    freeSlots.push({
      startTime: lastBusyEnd,
      endTime: shiftEnd,
    });
  }

  return freeSlots;
}

/**
 * Convert time string (HH:mm) to minutes since midnight
 */
function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

/**
 * Add minutes to time string (HH:mm)
 */
function addMinutes(time: string, minutesToAdd: number): string {
  const totalMinutes = timeToMinutes(time) + minutesToAdd;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

export default router;
