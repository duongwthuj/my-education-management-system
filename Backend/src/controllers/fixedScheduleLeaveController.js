import FixedScheduleLeave from '../models/fixedScheduleLeave.js';
import FixedSchedule from '../models/fixedScheduled.js';
import OffsetClass from '../models/offsetClass.js';
import SubjectLevel from '../models/subjectLevel.js';

// Get all leaves for fixed schedules
export const getFixedScheduleLeaves = async (req, res) => {
    try {
        const { teacherId, startDate, endDate } = req.query;

        const filter = {};
        if (teacherId) filter.teacherId = teacherId;
        if (startDate && endDate) {
            filter.date = {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            };
        }

        const leaves = await FixedScheduleLeave.find(filter)
            .populate('fixedScheduleId')
            .populate('teacherId', 'name email')
            .populate('substituteTeacherId', 'name email')
            .sort({ date: 1 });

        res.status(200).json({
            success: true,
            data: leaves
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching fixed schedule leaves',
            error: error.message
        });
    }
};

// Create a leave for fixed schedule
export const createFixedScheduleLeave = async (req, res) => {
    try {
        const { fixedScheduleId, date, reason, substituteTeacherId } = req.body;

        if (!fixedScheduleId || !date) {
            return res.status(400).json({
                success: false,
                message: 'fixedScheduleId and date are required'
            });
        }

        // Get fixed schedule to get teacherId
        const fixedSchedule = await FixedSchedule.findById(fixedScheduleId);
        if (!fixedSchedule) {
            return res.status(404).json({
                success: false,
                message: 'Fixed schedule not found'
            });
        }

        // Check if leave already exists
        const existingLeave = await FixedScheduleLeave.findOne({
            fixedScheduleId,
            date: new Date(date)
        });

        if (existingLeave) {
            return res.status(400).json({
                success: false,
                message: 'Leave already exists for this schedule on this date'
            });
        }

        const leave = await FixedScheduleLeave.create({
            fixedScheduleId,
            teacherId: fixedSchedule.teacherId,
            date: new Date(date),
            reason,
            substituteTeacherId: substituteTeacherId || null
        });

        // If substitute teacher is selected, create an Offset Class for them
        if (substituteTeacherId) {
            try {
                let subjectLevelId = fixedSchedule.subjectLevelId;

                if (!subjectLevelId) {
                    console.warn(`FixedSchedule ${fixedSchedule._id} has no subjectLevelId. Searching for fallback...`);
                    // Fallback: Find the first level for this subject
                    const fallbackLevel = await SubjectLevel.findOne({ subjectId: fixedSchedule.subjectId });
                    if (fallbackLevel) {
                        subjectLevelId = fallbackLevel._id;
                        console.log('✅ Found fallback subjectLevelId:', subjectLevelId);
                    } else {
                        console.error('❌ No fallback SubjectLevel found for subjectId:', fixedSchedule.subjectId);
                    }
                }

                if (subjectLevelId) {
                    const newOffset = await OffsetClass.create({
                        subjectLevelId: subjectLevelId,
                        assignedTeacherId: substituteTeacherId,
                        className: fixedSchedule.className,
                        scheduledDate: new Date(date),
                        startTime: fixedSchedule.startTime,
                        endTime: fixedSchedule.endTime,
                        meetingLink: fixedSchedule.meetingLink,
                        status: 'assigned',
                        reason: `Dạy thay cho giáo viên ${fixedSchedule.teacherId} (Lý do: ${reason})`,
                        originalClassId: fixedSchedule._id,
                        notes: 'Tự động tạo từ yêu cầu xin nghỉ',
                        type: 'substitute'
                    });
                    console.log('✅ Created substitute offset class successfully:', newOffset._id);
                } else {
                    console.error('❌ Failed to create substitute offset class: No subjectLevelId found');
                }
            } catch (offsetError) {
                console.error('Error creating substitute offset class:', offsetError);
                // Don't fail the leave request, just log
            }
        }

        const populatedLeave = await FixedScheduleLeave.findById(leave._id)
            .populate('fixedScheduleId')
            .populate('teacherId', 'name email')
            .populate('substituteTeacherId', 'name email');

        res.status(201).json({
            success: true,
            data: populatedLeave
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: 'Leave already exists for this schedule on this date'
            });
        }
        res.status(500).json({
            success: false,
            message: 'Error creating fixed schedule leave',
            error: error.message
        });
    }
};

// Delete a leave (restore the schedule)
export const deleteFixedScheduleLeave = async (req, res) => {
    try {
        const { id } = req.params;
        const { fixedScheduleId, date } = req.query;

        let leave;

        if (id) {
            leave = await FixedScheduleLeave.findByIdAndDelete(id);
        } else if (fixedScheduleId && date) {
            leave = await FixedScheduleLeave.findOneAndDelete({
                fixedScheduleId,
                date: new Date(date)
            });
        } else {
            return res.status(400).json({
                success: false,
                message: 'Leave ID or (fixedScheduleId and date) are required'
            });
        }

        if (!leave) {
            return res.status(404).json({
                success: false,
                message: 'Leave not found'
            });
        }

        // Cleanup associated OffsetClass if exists
        if (leave.fixedScheduleId && leave.date) {
            console.log('Attempting to cleanup offset class for leave:', {
                originalClassId: leave.fixedScheduleId,
                scheduledDate: leave.date
            });

            // Use a date range query to be safe with timezones
            const startOfDay = new Date(leave.date);
            startOfDay.setHours(0, 0, 0, 0);
            const endOfDay = new Date(leave.date);
            endOfDay.setHours(23, 59, 59, 999);

            const offsetClass = await OffsetClass.findOneAndDelete({
                originalClassId: leave.fixedScheduleId,
                scheduledDate: {
                    $gte: startOfDay,
                    $lte: endOfDay
                }
            });

            if (offsetClass) {
                console.log(`Deleted substitute offset class ${offsetClass._id}`);
            } else {
                console.log('No associated substitute offset class found to delete');
            }
        }

        res.status(200).json({
            success: true,
            message: 'Leave deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error deleting fixed schedule leave',
            error: error.message
        });
    }
};
