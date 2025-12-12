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

    // Build query filter
    const teacherFilter = teacherId ? { _id: teacherId } : {};

    // Get all teachers with their fixed schedules
    const teachers = await Teacher.find(teacherFilter)
      .select('_id name email')
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
