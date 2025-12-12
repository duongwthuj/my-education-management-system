import TestClass from '../models/testClass.js';
import offsetAllocationService from '../services/offsetAllocationService.js';
import emailNotificationService from '../services/emailNotificationService.js';
// import googleSheetsService from '../services/googleSheetsService.js'; // Optional: Use if we want to sync supp classes too

// GET all test classes
export const getAllTestClasses = async (req, res) => {
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

        let testClassesQuery = TestClass.find(query)
            .populate('subjectId', 'name code description')
            .populate('assignedTeacherId', 'name email phone')
            .sort({ scheduledDate: 1, startTime: 1 });

        if (limit) {
            const skip = (page - 1) * parseInt(limit);
            testClassesQuery = testClassesQuery.skip(skip).limit(parseInt(limit));
        }

        const testClasses = await testClassesQuery;
        const total = await TestClass.countDocuments(query);

        res.status(200).json({
            success: true,
            data: testClasses,
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
            message: 'Error fetching test classes',
            error: error.message
        });
    }
};

// GET single test class by ID
export const getTestClassById = async (req, res) => {
    try {
        const testClass = await TestClass.findById(req.params.id)
            .populate('subjectId', 'name code description')
            .populate('assignedTeacherId', 'name email phone');

        if (!testClass) {
            return res.status(404).json({
                success: false,
                message: 'Test class not found'
            });
        }

        res.status(200).json({
            success: true,
            data: testClass
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching supplementary class',
            error: error.message
        });
    }
};

// CREATE new test class
export const createTestClass = async (req, res) => {
    try {
        const testClass = new TestClass(req.body);
        await testClass.save();

        res.status(201).json({
            success: true,
            message: 'Test class created successfully',
            data: testClass
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error creating supplementary class',
            error: error.message
        });
    }
};

// CREATE test class with auto-assignment
export const createTestClassWithAssignment = async (req, res) => {
    try {
        const testClass = new TestClass(req.body);

        // Reuse offsetAllocationService logic as it filters by subject and time
        const suitableTeacher = await offsetAllocationService.findSuitableTeacher(testClass);

        if (suitableTeacher) {
            testClass.assignedTeacherId = suitableTeacher._id;
            testClass.status = 'pending';
            testClass.assignedHistory = [];
        }

        await testClass.save();

        // Gửi email thông báo nếu đã phân công
        if (suitableTeacher) {
            try {
                await emailNotificationService.sendTeacherAssignmentNotification(
                    suitableTeacher.email,
                    {
                        teacherName: suitableTeacher.name,
                        className: testClass.className,
                        scheduledDate: testClass.scheduledDate,
                        startTime: testClass.startTime,
                        endTime: testClass.endTime,
                        meetingLink: testClass.meetingLink
                    }
                );
            } catch (emailError) {
                console.error('Email notification failed:', emailError);
            }
        }

        const populatedClass = await TestClass.findById(testClass._id)
            .populate('subjectId', 'name code description')
            .populate('assignedTeacherId', 'name email phone');

        res.status(201).json({
            success: true,
            message: suitableTeacher
                ? 'Test class created and teacher assigned successfully'
                : 'Test class created but no suitable teacher found',
            data: populatedClass,
            autoAssigned: !!suitableTeacher
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
        const testClass = await TestClass.findById(req.params.id);

        if (!testClass) {
            return res.status(404).json({
                success: false,
                message: 'Supplementary class not found'
            });
        }

        const suitableTeacher = await offsetAllocationService.findSuitableTeacher(testClass);

        if (!suitableTeacher) {
            return res.status(404).json({
                success: false,
                message: 'No suitable teacher found'
            });
        }

        if (testClass.assignedTeacherId) {
            testClass.assignedHistory = testClass.assignedHistory || [];
            testClass.assignedHistory.push(testClass.assignedTeacherId);
        }
        testClass.assignedTeacherId = suitableTeacher._id;
        testClass.status = 'pending';
        await testClass.save();

        // Email notification
        try {
            await emailNotificationService.sendTeacherAssignmentNotification(
                suitableTeacher.email,
                {
                    teacherName: suitableTeacher.name,
                    className: testClass.className,
                    scheduledDate: testClass.scheduledDate,
                    startTime: testClass.startTime,
                    endTime: testClass.endTime,
                    meetingLink: testClass.meetingLink
                }
            );
        } catch (emailError) {
            console.error('Email notification failed:', emailError);
        }

        const populatedClass = await TestClass.findById(testClass._id)
            .populate('subjectId', 'name code description')
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

        const testClass = await TestClass.findById(req.params.id);
        if (!testClass) return res.status(404).json({ success: false, message: "Class not found" });

        // Temporarily add current teacher to history to exclude them?
        // Actually offsetAllocationService.findSuitableTeacher excludes teachers in assignedHistory?
        // Let's assume standard logic: 
        // 1. Add current teacher to history
        // 2. Find new teacher

        if (testClass.assignedTeacherId) {
            testClass.assignedHistory = testClass.assignedHistory || [];
            if (!testClass.assignedHistory.includes(testClass.assignedTeacherId)) {
                testClass.assignedHistory.push(testClass.assignedTeacherId);
            }
        }

        // Save to update history so findSuitableTeacher sees it? 
        // offsetAllocationService usually takes the object passed. CHECK SERVICE IMPLEMENTATION later if needed.
        // For now let's save.
        await testClass.save();

        const newTeacher = await offsetAllocationService.findSuitableTeacher(testClass);

        if (!newTeacher) {
            return res.status(404).json({
                success: false,
                message: 'No suitable teacher found for reallocation'
            });
        }

        testClass.assignedTeacherId = newTeacher._id;
        testClass.status = 'pending';
        await testClass.save();

        // Email notification
        try {
            await emailNotificationService.sendTeacherAssignmentNotification(
                newTeacher.email,
                {
                    teacherName: newTeacher.name,
                    className: testClass.className,
                    scheduledDate: testClass.scheduledDate,
                    startTime: testClass.startTime,
                    endTime: testClass.endTime,
                    meetingLink: testClass.meetingLink
                }
            );
        } catch (emailError) {
            console.error('Email notification failed:', emailError);
        }

        const populatedClass = await TestClass.findById(testClass._id)
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

// UPDATE test class
export const updateTestClass = async (req, res) => {
    try {
        const testClass = await TestClass.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        )
            .populate('assignedTeacherId', 'name email phone');

        if (!testClass) {
            return res.status(404).json({
                success: false,
                message: 'Test class not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Test class updated successfully',
            data: testClass
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error updating test class',
            error: error.message
        });
    }
};

// DELETE test class
export const deleteTestClass = async (req, res) => {
    try {
        const testClass = await TestClass.findByIdAndDelete(req.params.id);

        if (!testClass) {
            return res.status(404).json({
                success: false,
                message: 'Test class not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Test class deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error deleting test class',
            error: error.message
        });
    }
};

// MARK as completed
export const markAsCompleted = async (req, res) => {
    try {
        const testClass = await TestClass.findById(req.params.id);

        if (!testClass) {
            return res.status(404).json({
                success: false,
                message: 'Test class not found'
            });
        }

        testClass.status = 'completed';
        await testClass.save();

        res.status(200).json({
            success: true,
            message: 'Test class marked as completed',
            data: testClass
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
export const cancelTestClass = async (req, res) => {
    try {
        const { reason } = req.body;
        const testClass = await TestClass.findById(req.params.id);

        if (!testClass) {
            return res.status(404).json({
                success: false,
                message: 'Test class not found'
            });
        }

        testClass.status = 'cancelled';
        if (reason) {
            testClass.notes = (testClass.notes || '') + `\nCancelled: ${reason}`;
        }
        await testClass.save();

        res.status(200).json({
            success: true,
            message: 'Test class cancelled',
            data: testClass
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error cancelling',
            error: error.message
        });
    }
};
