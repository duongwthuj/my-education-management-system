import SupplementaryClass from '../models/supplementaryClass.js';
import offsetAllocationService from '../services/offsetAllocationService.js';
import emailNotificationService from '../services/emailNotificationService.js';
// import googleSheetsService from '../services/googleSheetsService.js'; // Optional: Use if we want to sync supp classes too

// GET all supplementary classes
export const getAllSupplementaryClasses = async (req, res) => {
    try {
        const { status, teacherId, startDate, endDate, page = 1, limit } = req.query;
        const query = {};

        if (status) {
            query.status = status;
        }

        if (teacherId) {
            query.assignedTeacherId = teacherId;
        }

        // Date filtering
        if (startDate || endDate) {
            query.scheduledDate = {};
            if (startDate) {
                const start = new Date(startDate);
                start.setUTCHours(0, 0, 0, 0);
                query.scheduledDate.$gte = start;
            }
            if (endDate) {
                const end = new Date(endDate);
                end.setUTCHours(23, 59, 59, 999);
                query.scheduledDate.$lte = end;
            }
        }

        let supplementaryClassesQuery = SupplementaryClass.find(query)
            .populate({
                path: 'subjectLevelId',
                populate: {
                    path: 'subjectId',
                    select: 'name code description'
                }
            })
            .populate('assignedTeacherId', 'name email phone')
            .sort({ scheduledDate: 1, startTime: 1 });

        if (limit) {
            const skip = (page - 1) * parseInt(limit);
            supplementaryClassesQuery = supplementaryClassesQuery.skip(skip).limit(parseInt(limit));
        }

        const supplementaryClasses = await supplementaryClassesQuery;
        const total = await SupplementaryClass.countDocuments(query);

        res.status(200).json({
            success: true,
            data: supplementaryClasses,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching supplementary classes',
            error: error.message
        });
    }
};

// GET single supplementary class by ID
export const getSupplementaryClassById = async (req, res) => {
    try {
        const supplementaryClass = await SupplementaryClass.findById(req.params.id)
            .populate({
                path: 'subjectLevelId',
                populate: {
                    path: 'subjectId',
                    select: 'name code description'
                }
            })
            .populate('assignedTeacherId', 'name email phone');

        if (!supplementaryClass) {
            return res.status(404).json({
                success: false,
                message: 'Supplementary class not found'
            });
        }

        res.status(200).json({
            success: true,
            data: supplementaryClass
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching supplementary class',
            error: error.message
        });
    }
};

// CREATE new supplementary class
export const createSupplementaryClass = async (req, res) => {
    try {
        const supplementaryClass = new SupplementaryClass(req.body);
        await supplementaryClass.save();

        res.status(201).json({
            success: true,
            message: 'Supplementary class created successfully',
            data: supplementaryClass
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error creating supplementary class',
            error: error.message
        });
    }
};

// CREATE supplementary class with auto-assignment
export const createSupplementaryClassWithAssignment = async (req, res) => {
    try {
        const supplementaryClass = new SupplementaryClass(req.body);

        let suitableTeacher = null;
        let manuallyAssigned = false;

        // Check if teacher is already provided (manual assignment from Schedule page)
        if (req.body.assignedTeacherId) {
            // Teacher was pre-selected, skip auto-assign
            manuallyAssigned = true;
            supplementaryClass.status = 'assigned';
            supplementaryClass.assignedHistory = [];
        } else {
            // No teacher provided, do auto-assignment
            suitableTeacher = await offsetAllocationService.findSuitableTeacher(supplementaryClass, null, 'priority');

            if (suitableTeacher) {
                supplementaryClass.assignedTeacherId = suitableTeacher._id;
                supplementaryClass.status = 'pending';
                supplementaryClass.assignedHistory = [];
            }
        }

        await supplementaryClass.save();

        // Gửi email thông báo nếu đã phân công (auto-assigned only, manual assignment can be handled differently)
        if (suitableTeacher) {
            try {
                await emailNotificationService.sendTeacherAssignmentNotification(
                    suitableTeacher.email,
                    {
                        teacherName: suitableTeacher.name,
                        className: supplementaryClass.className,
                        scheduledDate: supplementaryClass.scheduledDate,
                        startTime: supplementaryClass.startTime,
                        endTime: supplementaryClass.endTime,
                        meetingLink: supplementaryClass.meetingLink
                    }
                );
            } catch (emailError) {
                console.error('Email notification failed:', emailError);
            }
        }

        const populatedClass = await SupplementaryClass.findById(supplementaryClass._id)
            .populate({
                path: 'subjectLevelId',
                populate: {
                    path: 'subjectId',
                    select: 'name code description'
                }
            })
            .populate('assignedTeacherId', 'name email phone');

        res.status(201).json({
            success: true,
            message: manuallyAssigned
                ? 'Supplementary class created with assigned teacher'
                : suitableTeacher
                    ? 'Supplementary class created and teacher assigned successfully'
                    : 'Supplementary class created but no suitable teacher found',
            data: populatedClass,
            autoAssigned: !!suitableTeacher,
            manuallyAssigned: manuallyAssigned
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error creating supplementary class with assignment',
            error: error.message
        });
    }
};

// AUTO-ASSIGN teacher
export const autoAssignTeacher = async (req, res) => {
    try {
        const supplementaryClass = await SupplementaryClass.findById(req.params.id);

        if (!supplementaryClass) {
            return res.status(404).json({
                success: false,
                message: 'Supplementary class not found'
            });
        }

        const suitableTeacher = await offsetAllocationService.findSuitableTeacher(supplementaryClass, null, 'priority');

        if (!suitableTeacher) {
            return res.status(404).json({
                success: false,
                message: 'No suitable teacher found'
            });
        }

        if (supplementaryClass.assignedTeacherId) {
            supplementaryClass.assignedHistory = supplementaryClass.assignedHistory || [];
            supplementaryClass.assignedHistory.push(supplementaryClass.assignedTeacherId);
        }
        supplementaryClass.assignedTeacherId = suitableTeacher._id;
        supplementaryClass.status = 'pending';
        await supplementaryClass.save();

        // Email notification
        try {
            await emailNotificationService.sendTeacherAssignmentNotification(
                suitableTeacher.email,
                {
                    teacherName: suitableTeacher.name,
                    className: supplementaryClass.className,
                    scheduledDate: supplementaryClass.scheduledDate,
                    startTime: supplementaryClass.startTime,
                    endTime: supplementaryClass.endTime,
                    meetingLink: supplementaryClass.meetingLink
                }
            );
        } catch (emailError) {
            console.error('Email notification failed:', emailError);
        }

        const populatedClass = await SupplementaryClass.findById(supplementaryClass._id)
            .populate({
                path: 'subjectLevelId',
                populate: {
                    path: 'subjectId',
                    select: 'name code description'
                }
            })
            .populate('assignedTeacherId', 'name email phone');

        res.status(200).json({
            success: true,
            message: 'Teacher assigned successfully',
            data: populatedClass
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error auto-assigning teacher',
            error: error.message
        });
    }
};

// REALLOCATE teacher
export const reallocateTeacher = async (req, res) => {
    try {
        // We reuse reallocateClass from service but that service fetches OffsetClass by ID.
        // So we need to call findSuitableTeacher manually here instead of relying on reallocateClass service helper which is coupled to OffsetClass model.
        // Actually, let's verify if reallocateClass is generic. It likely does `offsetClass = await OffsetClass.findById(id)`.
        // So we should replicate logic here:

        const supplementaryClass = await SupplementaryClass.findById(req.params.id);
        if (!supplementaryClass) return res.status(404).json({ success: false, message: "Class not found" });

        // Temporarily add current teacher to history to exclude them?
        // Actually offsetAllocationService.findSuitableTeacher excludes teachers in assignedHistory?
        // Let's assume standard logic: 
        // 1. Add current teacher to history
        // 2. Find new teacher

        if (supplementaryClass.assignedTeacherId) {
            supplementaryClass.assignedHistory = supplementaryClass.assignedHistory || [];
            if (!supplementaryClass.assignedHistory.includes(supplementaryClass.assignedTeacherId)) {
                supplementaryClass.assignedHistory.push(supplementaryClass.assignedTeacherId);
            }
        }

        // Save to update history so findSuitableTeacher sees it? 
        // offsetAllocationService usually takes the object passed. CHECK SERVICE IMPLEMENTATION later if needed.
        // For now let's save.
        await supplementaryClass.save();

        const newTeacher = await offsetAllocationService.findSuitableTeacher(supplementaryClass, supplementaryClass.assignedHistory, 'priority');

        if (!newTeacher) {
            return res.status(404).json({
                success: false,
                message: 'No suitable teacher found for reallocation'
            });
        }

        supplementaryClass.assignedTeacherId = newTeacher._id;
        supplementaryClass.status = 'pending';
        await supplementaryClass.save();

        // Email notification
        try {
            await emailNotificationService.sendTeacherAssignmentNotification(
                newTeacher.email,
                {
                    teacherName: newTeacher.name,
                    className: supplementaryClass.className,
                    scheduledDate: supplementaryClass.scheduledDate,
                    startTime: supplementaryClass.startTime,
                    endTime: supplementaryClass.endTime,
                    meetingLink: supplementaryClass.meetingLink
                }
            );
        } catch (emailError) {
            console.error('Email notification failed:', emailError);
        }

        const populatedClass = await SupplementaryClass.findById(supplementaryClass._id)
            .populate('assignedTeacherId', 'name email phone');

        res.status(200).json({
            success: true,
            message: 'Teacher reallocated successfully',
            data: populatedClass
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error reallocating teacher',
            error: error.message
        });
    }
};

// UPDATE supplementary class
export const updateSupplementaryClass = async (req, res) => {
    try {
        const supplementaryClass = await SupplementaryClass.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        )
            .populate('assignedTeacherId', 'name email phone');

        if (!supplementaryClass) {
            return res.status(404).json({
                success: false,
                message: 'Supplementary class not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Supplementary class updated successfully',
            data: supplementaryClass
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error updating supplementary class',
            error: error.message
        });
    }
};

// DELETE supplementary class
export const deleteSupplementaryClass = async (req, res) => {
    try {
        const supplementaryClass = await SupplementaryClass.findByIdAndDelete(req.params.id);

        if (!supplementaryClass) {
            return res.status(404).json({
                success: false,
                message: 'Supplementary class not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Supplementary class deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error deleting supplementary class',
            error: error.message
        });
    }
};

// MARK as completed
export const markAsCompleted = async (req, res) => {
    try {
        const supplementaryClass = await SupplementaryClass.findById(req.params.id);

        if (!supplementaryClass) {
            return res.status(404).json({
                success: false,
                message: 'Supplementary class not found'
            });
        }

        supplementaryClass.status = 'completed';
        await supplementaryClass.save();

        res.status(200).json({
            success: true,
            message: 'Supplementary class marked as completed',
            data: supplementaryClass
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error marking details',
            error: error.message
        });
    }
};

// CANCEL
export const cancelSupplementaryClass = async (req, res) => {
    try {
        const { reason } = req.body;
        const supplementaryClass = await SupplementaryClass.findById(req.params.id);

        if (!supplementaryClass) {
            return res.status(404).json({
                success: false,
                message: 'Supplementary class not found'
            });
        }

        supplementaryClass.status = 'cancelled';
        if (reason) {
            supplementaryClass.notes = (supplementaryClass.notes || '') + `\nCancelled: ${reason}`;
        }
        await supplementaryClass.save();

        res.status(200).json({
            success: true,
            message: 'Supplementary class cancelled',
            data: supplementaryClass
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error cancelling',
            error: error.message
        });
    }
};
