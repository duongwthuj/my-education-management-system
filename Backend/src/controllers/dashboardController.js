import Teacher from '../models/teacher.js';
import OffsetClass from '../models/offsetClass.js';
import FixedSchedule from '../models/fixedScheduled.js';
import SupplementaryClass from '../models/supplementaryClass.js';
import TestClass from '../models/testClass.js';

// Helper: Calculate hours between two times
const calculateHours = (startTime, endTime) => {
  const [startHour, startMin] = startTime.split(':').map(Number);
  const [endHour, endMin] = endTime.split(':').map(Number);

  const startTotalMin = startHour * 60 + startMin;
  const endTotalMin = endHour * 60 + endMin;

  return (endTotalMin - startTotalMin) / 60;
};

// Helper: Get number of weeks in date range
const getWeeksInRange = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
  return days / 7;
};

// Helper: Count days of week in range
const countDaysOfWeekInRange = (startDate, endDate, dayOfWeek) => {
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const targetDayIndex = dayNames.indexOf(dayOfWeek);

  const start = new Date(startDate);
  const end = new Date(endDate);
  let count = 0;

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    if (d.getDay() === targetDayIndex) {
      count++;
    }
  }

  return count;
};

// Helper: Count days on leave for specific day of week in range
const countLeaveDaysInRange = async (teacherId, startDate, endDate, dayOfWeek, fixedScheduleId) => {
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const targetDayIndex = dayNames.indexOf(dayOfWeek);

  const FixedScheduleLeave = (await import('../models/fixedScheduleLeave.js')).default;

  // Get all fixed schedule leaves for this teacher and schedule in date range
  const leaves = await FixedScheduleLeave.find({
    teacherId,
    fixedScheduleId,
    date: {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    }
  }).lean();

  // Count how many match the day of week
  let count = 0;
  leaves.forEach(leave => {
    const leaveDate = new Date(leave.date);
    if (leaveDate.getDay() === targetDayIndex) {
      count++;
    }
  });

  return count;
};

// Get teaching hours statistics for all teachers
export const getTeachingHoursStats = async (req, res) => {
  try {
    const { startDate, endDate, teacherId } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'startDate and endDate are required'
      });
    }

    // Build query filter (only active teachers)
    const teacherFilter = teacherId ? { _id: teacherId, status: 'active' } : { status: 'active' };

    // Get all active teachers with their fixed schedules
    const teachers = await Teacher.find(teacherFilter)
      .select('_id name email status')
      .lean();

    const teacherStats = [];

    for (const teacher of teachers) {
      // Get fixed schedules (chỉ lấy những cái active)
      const fixedSchedules = await FixedSchedule.find({
        teacherId: teacher._id,
        isActive: true
      })
        .populate('subjectId', 'name')
        .lean();

      // Get offset classes in date range (bao gồm cả pending và assigned để tính đúng workload)
      const offsetClasses = await OffsetClass.find({
        assignedTeacherId: teacher._id,
        scheduledDate: {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        },
        status: { $in: ['pending', 'assigned', 'completed'] }
      })
        .populate({
          path: 'subjectLevelId',
          populate: {
            path: 'subjectId',
            select: 'name code'
          }
        })
        .lean();

      // Get supplementary classes (for counting count)
      const supplementaryClasses = await SupplementaryClass.find({
        assignedTeacherId: teacher._id,
        scheduledDate: {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        },
        status: 'completed' // Only count completed classes as "taught"
      }).lean();

      // Calculate fixed schedule hours (recurring weekly)
      let fixedHours = 0;
      for (const schedule of fixedSchedules) {
        let hoursPerClass = calculateHours(schedule.startTime, schedule.endTime);

        // Apply 0.75 multiplier for Tutors (based on schedule role)
        if (schedule.role === 'tutor') {
          hoursPerClass *= 0.75;
        }

        // Tính intersection của schedule date range với requested range
        const scheduleStart = schedule.startDate ? new Date(schedule.startDate) : new Date(startDate);
        const scheduleEnd = schedule.endDate ? new Date(schedule.endDate) : new Date(endDate);
        const rangeStart = new Date(startDate);
        const rangeEnd = new Date(endDate);

        // Lấy overlap period
        const effectiveStart = scheduleStart > rangeStart ? scheduleStart : rangeStart;
        const effectiveEnd = scheduleEnd < rangeEnd ? scheduleEnd : rangeEnd;

        // Nếu không có overlap thì skip
        if (effectiveStart > effectiveEnd) continue;

        const totalOccurrences = countDaysOfWeekInRange(effectiveStart, effectiveEnd, schedule.dayOfWeek);
        const leaveOccurrences = await countLeaveDaysInRange(teacher._id, effectiveStart, effectiveEnd, schedule.dayOfWeek, schedule._id);
        const actualOccurrences = totalOccurrences - leaveOccurrences;
        fixedHours += hoursPerClass * actualOccurrences;
      }

      // Calculate substitute hours from FixedScheduleLeaves
      const FixedScheduleLeave = (await import('../models/fixedScheduleLeave.js')).default;
      const substituteLeaves = await FixedScheduleLeave.find({
        substituteTeacherId: teacher._id,
        date: {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        }
      }).populate('fixedScheduleId').lean();

      let substituteHours = 0;
      substituteLeaves.forEach(leave => {
        if (leave.fixedScheduleId) {
          let hours = calculateHours(leave.fixedScheduleId.startTime, leave.fixedScheduleId.endTime);
          // Apply multiplier if role is tutor
          if (leave.fixedScheduleId.role === 'tutor') {
            hours *= 0.75;
          }
          substituteHours += hours;
        }
      });

      // Calculate offset hours
      let offsetHours = 0;
      offsetClasses.forEach(offsetClass => {
        // Use startTime and endTime from offset class
        const hours = calculateHours(offsetClass.startTime, offsetClass.endTime);
        offsetHours += hours;
      });

      const totalHours = fixedHours + offsetHours + substituteHours;

      teacherStats.push({
        teacherId: teacher._id,
        teacherName: teacher.name,
        teacherEmail: teacher.email,
        fixedHours: Math.round(fixedHours * 10) / 10,
        substituteHours: Math.round(substituteHours * 10) / 10,
        offsetHours: Math.round(offsetHours * 10) / 10,
        totalHours: Math.round(totalHours * 10) / 10,
        fixedClassCount: fixedSchedules.length,
        offsetClassCount: offsetClasses.length,
        substituteClassCount: substituteLeaves.length,
        supplementaryClassCount: supplementaryClasses.length
      });
    }

    // Sort by total hours descending
    teacherStats.sort((a, b) => b.totalHours - a.totalHours);

    res.status(200).json({
      success: true,
      data: teacherStats,
      summary: {
        totalTeachers: teacherStats.length,
        totalFixedHours: Math.round(teacherStats.reduce((sum, t) => sum + t.fixedHours, 0) * 10) / 10,
        totalSubstituteHours: Math.round(teacherStats.reduce((sum, t) => sum + t.substituteHours, 0) * 10) / 10,
        totalOffsetHours: Math.round(teacherStats.reduce((sum, t) => sum + t.offsetHours, 0) * 10) / 10,
        totalHours: Math.round(teacherStats.reduce((sum, t) => sum + t.totalHours, 0) * 10) / 10,
        totalSupplementaryClasses: teacherStats.reduce((sum, t) => sum + t.supplementaryClassCount, 0)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching teaching hours statistics',
      error: error.message
    });
  }
};

// Get detailed breakdown for a specific teacher
export const getTeacherHoursDetail = async (req, res) => {
  try {
    const { teacherId } = req.params;
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'startDate and endDate are required'
      });
    }

    const teacher = await Teacher.findById(teacherId).select('_id name email');

    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: 'Teacher not found'
      });
    }

    // Get fixed schedules with details (chỉ lấy những cái active)
    const fixedSchedules = await FixedSchedule.find({
      teacherId,
      isActive: true
    })
      .populate('subjectId', 'name code')
      .lean();

    const fixedScheduleDetails = [];
    for (const schedule of fixedSchedules) {
      let hoursPerClass = calculateHours(schedule.startTime, schedule.endTime);

      // Apply 0.75 multiplier for Tutors (based on schedule role)
      if (schedule.role === 'tutor') {
        hoursPerClass *= 0.75;
      }

      // Tính intersection của schedule date range với requested range
      const scheduleStart = schedule.startDate ? new Date(schedule.startDate) : new Date(startDate);
      const scheduleEnd = schedule.endDate ? new Date(schedule.endDate) : new Date(endDate);
      const rangeStart = new Date(startDate);
      const rangeEnd = new Date(endDate);

      // Lấy overlap period
      const effectiveStart = scheduleStart > rangeStart ? scheduleStart : rangeStart;
      const effectiveEnd = scheduleEnd < rangeEnd ? scheduleEnd : rangeEnd;

      // Nếu không có overlap thì skip
      if (effectiveStart > effectiveEnd) continue;

      const totalOccurrences = countDaysOfWeekInRange(effectiveStart, effectiveEnd, schedule.dayOfWeek);
      const leaveOccurrences = await countLeaveDaysInRange(teacherId, effectiveStart, effectiveEnd, schedule.dayOfWeek, schedule._id);
      const occurrences = totalOccurrences - leaveOccurrences;
      const totalHours = hoursPerClass * occurrences;

      fixedScheduleDetails.push({
        className: schedule.className,
        subject: schedule.subjectId?.name || 'N/A',
        dayOfWeek: schedule.dayOfWeek,
        timeSlot: `${schedule.startTime} - ${schedule.endTime}`,
        startDate: schedule.startDate || 'N/A',
        endDate: schedule.endDate || 'Không giới hạn',
        hoursPerClass,
        occurrences,
        leaveOccurrences,
        totalHours: Math.round(totalHours * 10) / 10
      });
    }

    // Get substitute teaching details
    const FixedScheduleLeave = (await import('../models/fixedScheduleLeave.js')).default;
    const substituteLeaves = await FixedScheduleLeave.find({
      substituteTeacherId: teacherId,
      date: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    }).populate('fixedScheduleId').lean();

    const substituteDetails = [];
    substituteLeaves.forEach(leave => {
      if (leave.fixedScheduleId) {
        let hours = calculateHours(leave.fixedScheduleId.startTime, leave.fixedScheduleId.endTime);
        // Apply multiplier if role is tutor
        if (leave.fixedScheduleId.role === 'tutor') {
          hours *= 0.75;
        }

        substituteDetails.push({
          className: leave.fixedScheduleId.className,
          subject: 'Dạy thay', // Could populate subject if needed
          date: leave.date,
          timeSlot: `${leave.fixedScheduleId.startTime} - ${leave.fixedScheduleId.endTime}`,
          hours: Math.round(hours * 10) / 10,
          status: 'substitute'
        });
      }
    });

    // Get offset classes with details (bao gồm cả pending và assigned để tính đúng workload)
    const offsetClasses = await OffsetClass.find({
      assignedTeacherId: teacherId,
      scheduledDate: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      },
      status: { $in: ['pending', 'assigned', 'completed'] }
    })
      .populate({
        path: 'subjectLevelId',
        populate: {
          path: 'subjectId',
          select: 'name code'
        }
      })
      .lean();

    const offsetClassDetails = offsetClasses.map(offsetClass => {
      // Calculate hours from startTime and endTime
      const hours = calculateHours(offsetClass.startTime, offsetClass.endTime);

      return {
        className: offsetClass.className,
        subject: offsetClass.subjectLevelId?.subjectId?.name || 'N/A',
        date: offsetClass.scheduledDate,
        timeSlot: `${offsetClass.startTime} - ${offsetClass.endTime}`,
        hours: Math.round(hours * 10) / 10,
        status: offsetClass.status
      };
    });

    // Get supplementary classes with details
    // We didn't import this for this function but let's assume we want details too or just leave it for stats overview.
    // The user said "chỉ cần hiển thị đã dạy bao nhiêu ca bổ trợ là được" so maybe overview is enough.
    // But since I'm fixing the file I can add it if needed. For now I keep it simple to match user request and avoid complexity.

    // Calculate total hours
    const fixedHours = fixedScheduleDetails.reduce((sum, s) => sum + s.totalHours, 0);
    const offsetHours = offsetClassDetails.reduce((sum, s) => sum + s.hours, 0);

    const substituteHours = substituteDetails.reduce((sum, s) => sum + s.hours, 0);

    res.status(200).json({
      success: true,
      data: {
        teacher: {
          id: teacher._id,
          name: teacher.name,
          email: teacher.email
        },
        fixedSchedules: fixedScheduleDetails,
        offsetClasses: offsetClassDetails,
        substituteClasses: substituteDetails,
        summary: {
          fixedHours: Math.round(fixedHours * 10) / 10,
          offsetHours: Math.round(offsetHours * 10) / 10,
          substituteHours: Math.round(substituteHours * 10) / 10,
          totalHours: Math.round((fixedHours + offsetHours + substituteHours) * 10) / 10,
          fixedClassCount: fixedSchedules.length,
          offsetClassCount: offsetClasses.length,
          substituteClassCount: substituteDetails.length
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching teacher hours detail',
      error: error.message
    });
  }
};

// Get offset class statistics
export const getOffsetClassStatistics = async (req, res) => {
  try {
    const { startDate, endDate, teacherId } = req.query;

    // Build query filter
    const filter = {};

    if (startDate && endDate) {
      filter.scheduledDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    if (teacherId) {
      filter.assignedTeacherId = teacherId;
    }

    // Get all offset classes matching filter
    const allOffsetClasses = await OffsetClass.find(filter).lean();

    // Calculate statistics
    const total = allOffsetClasses.length;
    const pending = allOffsetClasses.filter(oc => oc.status === 'pending').length;
    const assigned = allOffsetClasses.filter(oc => oc.status === 'assigned').length;
    const completed = allOffsetClasses.filter(oc => oc.status === 'completed').length;
    const cancelled = allOffsetClasses.filter(oc => oc.status === 'cancelled').length;

    // Group by teacher
    const byTeacher = {};
    allOffsetClasses.forEach(oc => {
      const teacherId = oc.assignedTeacherId?.toString() || 'unassigned';
      if (!byTeacher[teacherId]) {
        byTeacher[teacherId] = {
          total: 0,
          pending: 0,
          assigned: 0,
          completed: 0,
          cancelled: 0
        };
      }
      byTeacher[teacherId].total++;
      byTeacher[teacherId][oc.status]++;
    });

    // Group by subject level
    const bySubjectLevel = {};
    allOffsetClasses.forEach(oc => {
      const subjectLevelId = oc.subjectLevelId?.toString() || 'unknown';
      if (!bySubjectLevel[subjectLevelId]) {
        bySubjectLevel[subjectLevelId] = {
          total: 0,
          pending: 0,
          assigned: 0,
          completed: 0,
          cancelled: 0
        };
      }
      bySubjectLevel[subjectLevelId].total++;
      bySubjectLevel[subjectLevelId][oc.status]++;
    });

    res.status(200).json({
      success: true,
      data: {
        total,
        pending,
        assigned,
        completed,
        cancelled,
        byTeacher,
        bySubjectLevel
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching offset class statistics',
      error: error.message
    });
  }
};

// Get test class statistics
export const getTestClassStatistics = async (req, res) => {
  try {
    const { startDate, endDate, teacherId } = req.query;

    // Build query filter
    const filter = {};

    if (startDate && endDate) {
      filter.scheduledDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    if (teacherId) {
      filter.assignedTeacherId = teacherId;
    }

    // Get all test classes matching filter
    const allTestClasses = await TestClass.find(filter).lean();

    // Calculate statistics
    const total = allTestClasses.length;
    const pending = allTestClasses.filter(tc => tc.status === 'pending').length;
    const assigned = allTestClasses.filter(tc => tc.status === 'assigned').length;
    const completed = allTestClasses.filter(tc => tc.status === 'completed').length;
    const cancelled = allTestClasses.filter(tc => tc.status === 'cancelled').length;

    // Group by teacher
    const byTeacher = {};
    allTestClasses.forEach(tc => {
      const teacherId = tc.assignedTeacherId?.toString() || 'unassigned';
      if (!byTeacher[teacherId]) {
        byTeacher[teacherId] = {
          total: 0,
          pending: 0,
          assigned: 0,
          completed: 0,
          cancelled: 0
        };
      }
      byTeacher[teacherId].total++;
      byTeacher[teacherId][tc.status]++;
    });

    res.status(200).json({
      success: true,
      data: {
        total,
        pending,
        assigned,
        completed,
        cancelled,
        byTeacher
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching test class statistics',
      error: error.message
    });
  }
};
// Get personal dashboard statistics
export const getPersonalStats = async (req, res) => {
  try {
    const teacherId = req.user.teacherId;
    if (!teacherId) {
      return res.status(400).json({ success: false, message: 'User is not linked to a teacher profile' });
    }

    const today = new Date();
    const startOfMonthDate = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonthDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    // 1. Calculate Monthly Teaching Hours
    // Reuse logic from getTeacherHoursDetail roughly, or simplifed
    // For dashboard, we need a quick summary. 
    // Let's rely on calling the internal logic or replicating simplified version.
    // Replicating simplified version for speed and specific dashboard needs.

    // Fixed Schedules
    const fixedSchedules = await FixedSchedule.find({ teacherId, isActive: true }).lean();
    let fixedHours = 0;

    // We need to calculate instances for this month
    for (const schedule of fixedSchedules) {
      let hoursPerClass = calculateHours(schedule.startTime, schedule.endTime);
      if (schedule.role === 'tutor') hoursPerClass *= 0.75;

      // Intersection with month
      const scheduleStart = schedule.startDate ? new Date(schedule.startDate) : startOfMonthDate;
      const scheduleEnd = schedule.endDate ? new Date(schedule.endDate) : endOfMonthDate;

      const effectiveStart = scheduleStart > startOfMonthDate ? scheduleStart : startOfMonthDate;
      const effectiveEnd = scheduleEnd < endOfMonthDate ? scheduleEnd : endOfMonthDate;

      if (effectiveStart <= effectiveEnd) {
        const totalOccurrences = countDaysOfWeekInRange(effectiveStart, effectiveEnd, schedule.dayOfWeek);
        // We ideally should subtract leaves, but for a quick dashboard stat, maybe approximation is okay?
        // Or better, do it right.
        const leaveOccurrences = await countLeaveDaysInRange(teacherId, effectiveStart, effectiveEnd, schedule.dayOfWeek, schedule._id);
        fixedHours += hoursPerClass * (totalOccurrences - leaveOccurrences);
      }
    }

    // Offset Classes (Month)
    const offsetClasses = await OffsetClass.find({
      assignedTeacherId: teacherId,
      scheduledDate: { $gte: startOfMonthDate, $lte: endOfMonthDate },
      status: { $in: ['assigned', 'completed'] }
    }).lean();
    const offsetHours = offsetClasses.reduce((sum, cls) => sum + calculateHours(cls.startTime, cls.endTime), 0);

    // Substitute (Month)
    const FixedScheduleLeave = (await import('../models/fixedScheduleLeave.js')).default;
    const substituteLeaves = await FixedScheduleLeave.find({
      substituteTeacherId: teacherId,
      date: { $gte: startOfMonthDate, $lte: endOfMonthDate }
    }).populate('fixedScheduleId').lean();

    let substituteHours = 0;
    substituteLeaves.forEach(l => {
      if (l.fixedScheduleId) {
        let h = calculateHours(l.fixedScheduleId.startTime, l.fixedScheduleId.endTime);
        if (l.fixedScheduleId.role === 'tutor') h *= 0.75;
        substituteHours += h;
      }
    });

    const totalHoursMonth = Math.round((fixedHours + offsetHours + substituteHours) * 10) / 10;

    // Test Classes (Month) - Calculate hours
    const testClasses = await TestClass.find({
      assignedTeacherId: teacherId,
      scheduledDate: { $gte: startOfMonthDate, $lte: endOfMonthDate },
      status: { $in: ['assigned', 'completed'] }
    }).lean();

    const testHours = testClasses.reduce((sum, cls) => {
      // Assuming TestClass has startTime and endTime like OffsetClass
      if (cls.startTime && cls.endTime) {
        return sum + calculateHours(cls.startTime, cls.endTime);
      }
      return sum;
    }, 0);

    // Supplementary Classes (Month) - Count only
    const supplementaryCount = await SupplementaryClass.countDocuments({
      assignedTeacherId: teacherId,
      scheduledDate: { $gte: startOfMonthDate, $lte: endOfMonthDate },
      status: 'completed'
    });

    // 2. Weekly Schedule (Today + 6 days) - Full Agenda


    const scheduleStart = new Date(today);
    scheduleStart.setHours(0, 0, 0, 0);

    const scheduleEnd = new Date(today);
    scheduleEnd.setDate(today.getDate() + 7);
    scheduleEnd.setHours(23, 59, 59, 999);

    const scheduleDates = [];
    for (let d = new Date(scheduleStart); d <= scheduleEnd; d.setDate(d.getDate() + 1)) {
      scheduleDates.push(new Date(d));
    }

    // A. Fixed Schedules Expansion
    const weeklyFixedSchedules = [];
    const fixedSchedulesForWeek = await FixedSchedule.find({
      teacherId,
      isActive: true,
      startDate: { $lte: scheduleEnd },
      $or: [{ endDate: null }, { endDate: { $gte: scheduleStart } }]
    }).populate('subjectId', 'name').lean();


    const leaves = await FixedScheduleLeave.find({
      teacherId,
      date: { $gte: scheduleStart, $lte: scheduleEnd }
    }).lean();

    for (const date of scheduleDates) {
      const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][date.getDay()];

      for (const schedule of fixedSchedulesForWeek) {
        if (schedule.dayOfWeek === dayName) {
          // Check date range validity for this specific schedule
          const sStart = new Date(schedule.startDate);
          const sEnd = schedule.endDate ? new Date(schedule.endDate) : new Date(9999, 11, 31);

          if (date >= sStart && date <= sEnd) {
            // Check for leave
            const isLeave = leaves.some(l =>
              l.fixedScheduleId &&
              l.fixedScheduleId.toString() === schedule._id.toString() &&
              new Date(l.date).toDateString() === date.toDateString()
            );

            if (!isLeave) {
              weeklyFixedSchedules.push({
                type: 'Fixed',
                className: schedule.className,
                subject: schedule.subjectId?.name || 'N/A',
                date: new Date(date), // clone
                time: `${schedule.startTime} - ${schedule.endTime}`,
                startTime: schedule.startTime, // for sorting
                endTime: schedule.endTime
              });
            }
          }
        }
      }
    }

    // B. Other Classes (Offset, Test, Supplementary)
    // Fetch Assigned OR Completed to show schedule (user might want to see history of week too, or just upcoming? User said "upcoming schedule")
    // "Lịch dạy sắp tới" implies future. But "Weekly Schedule" usually means the whole week view.
    // Let's stick to the requested 7-day window from TODAY.

    const weeklyOffset = await OffsetClass.find({
      assignedTeacherId: teacherId,
      scheduledDate: { $gte: scheduleStart, $lte: scheduleEnd },
      status: { $in: ['assigned', 'completed'] }
    }).populate({ path: 'subjectLevelId', populate: { path: 'subjectId', select: 'name' } }).lean();

    const weeklyTest = await TestClass.find({
      assignedTeacherId: teacherId,
      scheduledDate: { $gte: scheduleStart, $lte: scheduleEnd },
      status: { $in: ['assigned', 'completed'] }
    }).lean();

    const weeklySupplementary = await SupplementaryClass.find({
      assignedTeacherId: teacherId,
      scheduledDate: { $gte: scheduleStart, $lte: scheduleEnd },
      status: { $in: ['assigned', 'completed'] }
    }).lean();

    // C. Merge and Sort
    const upcomingClasses = [
      ...weeklyFixedSchedules,
      ...weeklyOffset.map(c => ({
        type: 'Offset',
        className: c.className,
        subject: c.subjectLevelId?.subjectId?.name || 'N/A',
        date: c.scheduledDate,
        time: `${c.startTime} - ${c.endTime}`,
        startTime: c.startTime
      })),
      ...weeklyTest.map(c => ({
        type: 'Test',
        className: c.className,
        subject: c.subjectId?.name || 'Test Class', // subjectId might be ObjectId or populated? TestClass usually has subjectId
        date: c.scheduledDate,
        time: `${c.startTime} - ${c.endTime}`,
        startTime: c.startTime
      })),
      ...weeklySupplementary.map(c => ({
        type: 'Supplementary',
        className: c.className,
        subject: 'Bổ trợ',
        date: c.scheduledDate,
        time: `${c.startTime} - ${c.endTime}`,
        startTime: c.startTime
      }))
    ];

    // Sort by Date then Time
    upcomingClasses.sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      if (dateA.toDateString() !== dateB.toDateString()) {
        return dateA - dateB;
      }
      return a.startTime.localeCompare(b.startTime);
    });

    // 3. Pending Requests count
    const pendingOffsetCount = await OffsetClass.countDocuments({
      assignedTeacherId: teacherId,
      status: 'pending'
    });

    res.status(200).json({
      success: true,
      data: {
        stats: {
          hoursMonth: totalHoursMonth,
          testHours: Math.round(testHours * 10) / 10,
          supplementaryCount: supplementaryCount,
          upcomingCount: upcomingClasses.length,
          pendingRequests: pendingOffsetCount
        },
        upcomingClasses: upcomingClasses // Now contains full schedule
      }
    });

  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching personal stats', error: error.message });
  }
};
