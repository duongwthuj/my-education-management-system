import OffsetClass from '../models/offsetClass.js';
import offsetAllocationService from '../services/offsetAllocationService.js';
import emailNotificationService from '../services/emailNotificationService.js';
import googleSheetsService from '../services/googleSheetsService.js';

// GET all offset classes
export const getAllOffsetClasses = async (req, res) => {
    try {
        const { status, teacherId, startDate, endDate, page = 1, limit } = req.query;
        const query = {};

        if (status) {
            query.status = status;
        }

        if (teacherId) {
            query.assignedTeacherId = teacherId;
        }

        // Date filtering - can use startDate only, endDate only, or both
        if (startDate || endDate) {
            query.scheduledDate = {};
            if (startDate) {
                // Set to start of day in UTC
                const start = new Date(startDate);
                start.setUTCHours(0, 0, 0, 0);
                query.scheduledDate.$gte = start;
            }
            if (endDate) {
                // Set to end of day in UTC
                const end = new Date(endDate);
                end.setUTCHours(23, 59, 59, 999);
                query.scheduledDate.$lte = end;
            }
        }

        let offsetClassesQuery = OffsetClass.find(query)
            .populate({
                path: 'subjectLevelId',
                populate: {
                    path: 'subjectId',
                    select: 'name code description'
                }
            })
            .populate('assignedTeacherId', 'name email phone')
            .populate('originalClassId')
            .sort({ scheduledDate: 1, startTime: 1 });

        // Only apply pagination if limit is specified
        if (limit) {
            const skip = (page - 1) * parseInt(limit);
            offsetClassesQuery = offsetClassesQuery.skip(skip).limit(parseInt(limit));
        }

        const offsetClasses = await offsetClassesQuery;
        const total = await OffsetClass.countDocuments(query);

        res.status(200).json({
            success: true,
            data: offsetClasses,
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
            message: 'Error fetching offset classes',
            error: error.message
        });
    }
};

// GET single offset class by ID
export const getOffsetClassById = async (req, res) => {
    try {
        const offsetClass = await OffsetClass.findById(req.params.id)
            .populate({
                path: 'subjectLevelId',
                populate: {
                    path: 'subjectId',
                    select: 'name code description'
                }
            })
            .populate('assignedTeacherId', 'name email phone')
            .populate('originalClassId');

        if (!offsetClass) {
            return res.status(404).json({
                success: false,
                message: 'Offset class not found'
            });
        }

        res.status(200).json({
            success: true,
            data: offsetClass
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching offset class',
            error: error.message
        });
    }
};

// CREATE new offset class
export const createOffsetClass = async (req, res) => {
    try {
        const offsetClass = new OffsetClass(req.body);
        await offsetClass.save();

        res.status(201).json({
            success: true,
            message: 'Offset class created successfully',
            data: offsetClass
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error creating offset class',
            error: error.message
        });
    }
};

// CREATE offset class with auto-assignment
export const createOffsetClassWithAssignment = async (req, res) => {
    try {
        // Tạo offset class trước
        const offsetClass = new OffsetClass(req.body);

        // Tìm giáo viên phù hợp
        const suitableTeacher = await offsetAllocationService.findSuitableTeacher(offsetClass);

        if (suitableTeacher) {
            offsetClass.assignedTeacherId = suitableTeacher._id;
            offsetClass.status = 'assigned';
            // initialize assignedHistory for new class
            offsetClass.assignedHistory = [];
        }

        await offsetClass.save();

        // Update teacher lên Google Sheet nếu có teacher
        if (suitableTeacher) {
            try {
                await googleSheetsService.updateTeacherToSheet(
                    offsetClass._id.toString(),
                    offsetClass.scheduledDate,
                    suitableTeacher.name,
                    suitableTeacher.email
                );
                console.log(`📝 Updated teacher ${suitableTeacher.name} (${suitableTeacher.email}) to Google Sheet for ${offsetClass.className}`);
            } catch (sheetError) {
                console.error('Failed to update Google Sheet:', sheetError.message);
            }
        }

        // Gửi email thông báo nếu đã phân công
        if (suitableTeacher) {
            try {
                await emailNotificationService.sendTeacherAssignmentNotification(
                    suitableTeacher.email,
                    {
                        teacherName: suitableTeacher.name,
                        className: offsetClass.className,
                        scheduledDate: offsetClass.scheduledDate,
                        startTime: offsetClass.startTime,
                        endTime: offsetClass.endTime,
                        meetingLink: offsetClass.meetingLink
                    }
                );
            } catch (emailError) {
                console.error('Email notification failed:', emailError);
                // Không throw error, chỉ log
            }
        }

        const populatedOffsetClass = await OffsetClass.findById(offsetClass._id)
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
            message: suitableTeacher
                ? 'Offset class created and teacher assigned successfully'
                : 'Offset class created but no suitable teacher found',
            data: populatedOffsetClass,
            autoAssigned: !!suitableTeacher
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error creating offset class with assignment',
            error: error.message
        });
    }
};

// BULK create offset classes with auto-assignment
export const createBulkOffsetClasses = async (req, res) => {
    try {
        const { offsetClasses } = req.body; // Array of offset class objects

        if (!offsetClasses || !Array.isArray(offsetClasses)) {
            return res.status(400).json({
                success: false,
                message: 'Offset classes array is required'
            });
        }

        const results = await offsetAllocationService.allocateMultipleClasses(offsetClasses);

        // Lưu các lớp offset vào database
        const savedClasses = [];
        for (const result of results) {
            const offsetClass = new OffsetClass({
                ...result.offsetClass,
                assignedTeacherId: result.assignedTeacher?._id || null,
                status: result.assignedTeacher ? 'assigned' : 'pending',
                assignedHistory: []
            });

            await offsetClass.save();
            savedClasses.push(offsetClass);

            // Gửi email nếu đã phân công
            if (result.assignedTeacher) {
                try {
                    await emailNotificationService.sendTeacherAssignmentNotification(
                        result.assignedTeacher.email,
                        {
                            teacherName: result.assignedTeacher.name,
                            className: offsetClass.className,
                            scheduledDate: offsetClass.scheduledDate,
                            startTime: offsetClass.startTime,
                            endTime: offsetClass.endTime,
                            meetingLink: offsetClass.meetingLink
                        }
                    );
                } catch (emailError) {
                    console.error('Email notification failed:', emailError);
                }
            }
        }

        const assignedCount = results.filter(r => r.success).length;

        res.status(201).json({
            success: true,
            message: `${savedClasses.length} offset classes created, ${assignedCount} assigned`,
            data: savedClasses,
            results
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error creating bulk offset classes',
            error: error.message
        });
    }
};

// AUTO-ASSIGN teacher to offset class
export const autoAssignTeacher = async (req, res) => {
    try {
        const offsetClass = await OffsetClass.findById(req.params.id);

        if (!offsetClass) {
            return res.status(404).json({
                success: false,
                message: 'Offset class not found'
            });
        }

        const suitableTeacher = await offsetAllocationService.findSuitableTeacher(offsetClass);

        if (!suitableTeacher) {
            return res.status(404).json({
                success: false,
                message: 'No suitable teacher found'
            });
        }

        // push previous teacher to history if exists
        if (offsetClass.assignedTeacherId) {
            offsetClass.assignedHistory = offsetClass.assignedHistory || [];
            offsetClass.assignedHistory.push(offsetClass.assignedTeacherId);
        }
        offsetClass.assignedTeacherId = suitableTeacher._id;
        offsetClass.status = 'assigned';
        await offsetClass.save();

        // Update teacher lên Google Sheet
        try {
            await googleSheetsService.updateTeacherToSheet(
                offsetClass._id.toString(),
                offsetClass.scheduledDate,
                suitableTeacher.name,
                suitableTeacher.email
            );
            console.log(`📝 Updated teacher ${suitableTeacher.name} (${suitableTeacher.email}) to Google Sheet for ${offsetClass.className}`);
        } catch (sheetError) {
            console.error('Failed to update Google Sheet:', sheetError.message);
            // Không throw error vì việc update sheet là optional
        }

        // Gửi email thông báo
        try {
            await emailNotificationService.sendTeacherAssignmentNotification(
                suitableTeacher.email,
                {
                    teacherName: suitableTeacher.name,
                    className: offsetClass.className,
                    scheduledDate: offsetClass.scheduledDate,
                    startTime: offsetClass.startTime,
                    endTime: offsetClass.endTime,
                    meetingLink: offsetClass.meetingLink
                }
            );
        } catch (emailError) {
            console.error('Email notification failed:', emailError);
        }

        const populatedOffsetClass = await OffsetClass.findById(offsetClass._id)
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
            data: populatedOffsetClass
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error auto-assigning teacher',
            error: error.message
        });
    }
};

// REALLOCATE teacher for offset class
export const reallocateTeacher = async (req, res) => {
    try {
        const newTeacher = await offsetAllocationService.reallocateClass(req.params.id);

        if (!newTeacher) {
            return res.status(404).json({
                success: false,
                message: 'No suitable teacher found for reallocation'
            });
        }

        const offsetClass = await OffsetClass.findById(req.params.id);
        const oldTeacherId = offsetClass.assignedTeacherId;

        // push old teacher into history to avoid cycling
        if (oldTeacherId) {
            offsetClass.assignedHistory = offsetClass.assignedHistory || [];
            offsetClass.assignedHistory.push(oldTeacherId);
        }

        offsetClass.assignedTeacherId = newTeacher._id;
        offsetClass.status = 'assigned';
        await offsetClass.save();

        // Update teacher lên Google Sheet
        try {
            await googleSheetsService.updateTeacherToSheet(
                offsetClass._id.toString(),
                offsetClass.scheduledDate,
                newTeacher.name,
                newTeacher.email
            );
            console.log(`📝 Updated teacher ${newTeacher.name} (${newTeacher.email}) to Google Sheet for ${offsetClass.className}`);
        } catch (sheetError) {
            console.error('Failed to update Google Sheet:', sheetError.message);
        }

        // Gửi email cho giáo viên mới
        try {
            await emailNotificationService.sendTeacherAssignmentNotification(
                newTeacher.email,
                {
                    teacherName: newTeacher.name,
                    className: offsetClass.className,
                    scheduledDate: offsetClass.scheduledDate,
                    startTime: offsetClass.startTime,
                    endTime: offsetClass.endTime,
                    meetingLink: offsetClass.meetingLink
                }
            );
        } catch (emailError) {
            console.error('Email notification failed:', emailError);
        }

        const populatedOffsetClass = await OffsetClass.findById(offsetClass._id)
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
            message: 'Teacher reallocated successfully',
            data: populatedOffsetClass,
            oldTeacherId
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error reallocating teacher',
            error: error.message
        });
    }
};

// UPDATE offset class
export const updateOffsetClass = async (req, res) => {
    try {
        // Lấy thông tin cũ trước khi update (để so sánh giáo viên)
        const oldOffsetClass = await OffsetClass.findById(req.params.id);
        if (!oldOffsetClass) {
            return res.status(404).json({
                success: false,
                message: 'Offset class not found'
            });
        }

        const offsetClass = await OffsetClass.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        )
            .populate({
                path: 'subjectLevelId',
                populate: {
                    path: 'subjectId',
                    select: 'name code description'
                }
            })
            .populate('assignedTeacherId', 'name email phone');

        // Nếu có thay đổi giáo viên, cập nhật lên Google Sheet
        if (req.body.assignedTeacherId &&
            oldOffsetClass.assignedTeacherId?.toString() !== req.body.assignedTeacherId) {
            try {
                const teacherName = offsetClass.assignedTeacherId?.name || 'Chưa phân công';
                const teacherEmail = offsetClass.assignedTeacherId?.email || '';
                await googleSheetsService.updateTeacherToSheet(
                    offsetClass._id.toString(),
                    offsetClass.scheduledDate,
                    teacherName,
                    teacherEmail
                );
                console.log(`📝 Updated teacher ${teacherName} (${teacherEmail}) to Google Sheet for ${offsetClass.className}`);
            } catch (sheetError) {
                console.error('Failed to update Google Sheet:', sheetError.message);
            }
        }

        res.status(200).json({
            success: true,
            message: 'Offset class updated successfully',
            data: offsetClass
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error updating offset class',
            error: error.message
        });
    }
};

// DELETE offset class
export const deleteOffsetClass = async (req, res) => {
    try {
        const offsetClass = await OffsetClass.findByIdAndDelete(req.params.id);

        if (!offsetClass) {
            return res.status(404).json({
                success: false,
                message: 'Offset class not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Offset class deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error deleting offset class',
            error: error.message
        });
    }
};

// MARK offset class as completed
export const markAsCompleted = async (req, res) => {
    try {
        const offsetClass = await OffsetClass.findById(req.params.id)
            .populate('assignedTeacherId', 'name email');

        if (!offsetClass) {
            return res.status(404).json({
                success: false,
                message: 'Offset class not found'
            });
        }

        // Update status to completed
        offsetClass.status = 'completed';
        await offsetClass.save();

        // Update teacher to Google Sheet
        if (offsetClass.assignedTeacherId) {
            try {
                // Debug logging
                console.log('� Offset Class ID:', offsetClass._id);
                console.log('🔍 Assigned Teacher ID:', offsetClass.assignedTeacherId._id || offsetClass.assignedTeacherId);
                console.log('�📧 Teacher object:', JSON.stringify(offsetClass.assignedTeacherId, null, 2));
                console.log('📧 Teacher email:', offsetClass.assignedTeacherId.email);
                console.log('📧 Teacher name:', offsetClass.assignedTeacherId.name);

                await googleSheetsService.updateTeacherToSheet(
                    offsetClass._id.toString(),
                    offsetClass.scheduledDate,
                    offsetClass.assignedTeacherId.name,
                    offsetClass.assignedTeacherId.email
                );
                console.log(`✅ Updated teacher ${offsetClass.assignedTeacherId.name} (${offsetClass.assignedTeacherId.email}) to Google Sheet for class ${offsetClass.className}`);
            } catch (sheetError) {
                console.error('Error updating Google Sheet:', sheetError.message);
                // Don't fail the whole request if sheet update fails
            }
        }

        res.status(200).json({
            success: true,
            message: 'Offset class marked as completed',
            data: offsetClass
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error marking offset class as completed',
            error: error.message
        });
    }
};

// CANCEL offset class
export const cancelOffsetClass = async (req, res) => {
    try {
        const { reason } = req.body;

        const offsetClass = await OffsetClass.findById(req.params.id);

        if (!offsetClass) {
            return res.status(404).json({
                success: false,
                message: 'Offset class not found'
            });
        }

        offsetClass.status = 'cancelled';
        if (reason) {
            offsetClass.notes = (offsetClass.notes || '') + `\nCancelled: ${reason}`;
        }
        await offsetClass.save();

        res.status(200).json({
            success: true,
            message: 'Offset class cancelled',
            data: offsetClass
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error cancelling offset class',
            error: error.message
        });
    }
};

// Sync offset classes from Google Sheets
export const syncFromGoogleSheets = async (req, res) => {
    try {
        const { spreadsheetId, range, overwrite } = req.body;

        if (!spreadsheetId) {
            return res.status(400).json({
                success: false,
                message: 'spreadsheetId is required'
            });
        }

        const result = await googleSheetsService.syncOffsetClassesFromSheet(
            spreadsheetId,
            range || 'Sheet1!A2:Z',
            overwrite || false
        );

        res.status(200).json({
            success: true,
            message: result.message,
            data: result.results,
            errors: result.sheetErrors
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error syncing from Google Sheets',
            error: error.message
        });
    }
};

// Preview data from Google Sheets (without saving)
export const previewGoogleSheets = async (req, res) => {
    try {
        const { spreadsheetId, range } = req.query;

        if (!spreadsheetId) {
            return res.status(400).json({
                success: false,
                message: 'spreadsheetId is required'
            });
        }

        const result = await googleSheetsService.fetchOffsetClassesFromSheet(
            spreadsheetId,
            range || 'Sheet1!A2:Z'
        );

        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error previewing Google Sheets data',
            error: error.message
        });
    }
};
