import Teacher from '../models/teacher.js';
import TeacherLevel from '../models/teacherLevel.js';
import FixedSchedule from '../models/fixedScheduled.js';
import OffsetClass from '../models/offsetClass.js';

// GET all teachers
export const getAllTeachers = async (req, res) => {
    try {
        const { status, page = 1, limit = 10 } = req.query;
        const query = {};

        if (status) {
            query.status = status;
        }

        const skip = (page - 1) * limit;
        const teachers = await Teacher.find(query)
            .skip(skip)
            .limit(parseInt(limit))
            .sort({ createdAt: -1 });

        const total = await Teacher.countDocuments(query);

        res.status(200).json({
            success: true,
            data: teachers,
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
            message: 'Error fetching teachers',
            error: error.message
        });
    }
};

// GET single teacher by ID
export const getTeacherById = async (req, res) => {
    try {
        const teacher = await Teacher.findById(req.params.id);

        if (!teacher) {
            return res.status(404).json({
                success: false,
                message: 'Teacher not found'
            });
        }

        res.status(200).json({
            success: true,
            data: teacher
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching teacher',
            error: error.message
        });
    }
};

// GET teacher with full details (levels, schedules)
export const getTeacherDetails = async (req, res) => {
    try {
        const teacher = await Teacher.findById(req.params.id);

        if (!teacher) {
            return res.status(404).json({
                success: false,
                message: 'Teacher not found'
            });
        }

        // Lấy danh sách môn học và trình độ
        const teacherLevels = await TeacherLevel.find({ teacherId: req.params.id })
            .populate({
                path: 'subjectLevelId',
                populate: {
                    path: 'subjectId'
                }
            });

        // Lấy lịch cố định
        const fixedSchedules = await FixedSchedule.find({ teacherId: req.params.id })
            .populate('subjectId')
            .populate({
                path: 'subjectLevelId',
                populate: {
                    path: 'subjectId'
                }
            });

        // Tính số lớp offset hiện tại
        const currentOffsetCount = await OffsetClass.countDocuments({
            assignedTeacherId: req.params.id,
            status: { $in: ['pending', 'assigned'] }
        });

        res.status(200).json({
            success: true,
            data: {
                ...teacher.toObject(),
                teacherLevels,
                fixedSchedules,
                currentOffsetCount
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching teacher details',
            error: error.message
        });
    }
};

// CREATE new teacher
export const createTeacher = async (req, res) => {
    try {
        const teacher = new Teacher(req.body);
        await teacher.save();

        res.status(201).json({
            success: true,
            message: 'Teacher created successfully',
            data: teacher
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: 'Email already exists'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Error creating teacher',
            error: error.message
        });
    }
};

// UPDATE teacher
export const updateTeacher = async (req, res) => {
    try {
        const teacher = await Teacher.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!teacher) {
            return res.status(404).json({
                success: false,
                message: 'Teacher not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Teacher updated successfully',
            data: teacher
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error updating teacher',
            error: error.message
        });
    }
};

// DELETE teacher
export const deleteTeacher = async (req, res) => {
    try {
        const teacher = await Teacher.findByIdAndDelete(req.params.id);

        if (!teacher) {
            return res.status(404).json({
                success: false,
                message: 'Teacher not found'
            });
        }

        // Xóa các liên kết liên quan
        await TeacherLevel.deleteMany({ teacherId: req.params.id });
        await FixedSchedule.deleteMany({ teacherId: req.params.id });
        // Không xóa OffsetClass để giữ lịch sử

        res.status(200).json({
            success: true,
            message: 'Teacher deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error deleting teacher',
            error: error.message
        });
    }
};

// ADD subject level to teacher
export const addTeacherLevel = async (req, res) => {
    try {
        const { subjectLevelId, experienceYears, certifications } = req.body;

        const teacherLevel = new TeacherLevel({
            teacherId: req.params.id,
            subjectLevelId,
            experienceYears,
            certifications
        });

        await teacherLevel.save();

        res.status(201).json({
            success: true,
            message: 'Subject level added to teacher successfully',
            data: teacherLevel
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: 'Teacher already has this subject level'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Error adding subject level',
            error: error.message
        });
    }
};

// UPDATE teacher level
export const updateTeacherLevel = async (req, res) => {
    try {
        const teacherLevel = await TeacherLevel.findByIdAndUpdate(
            req.params.levelId,
            req.body,
            { new: true, runValidators: true }
        );

        if (!teacherLevel) {
            return res.status(404).json({
                success: false,
                message: 'Teacher level not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Teacher level updated successfully',
            data: teacherLevel
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error updating teacher level',
            error: error.message
        });
    }
};

// DELETE teacher level
export const deleteTeacherLevel = async (req, res) => {
    try {
        const teacherLevel = await TeacherLevel.findByIdAndDelete(req.params.levelId);

        if (!teacherLevel) {
            return res.status(404).json({
                success: false,
                message: 'Teacher level not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Teacher level deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error deleting teacher level',
            error: error.message
        });
    }
};

// ADD fixed schedule to teacher
export const addFixedSchedule = async (req, res) => {
    try {
        const fixedSchedule = new FixedSchedule({
            ...req.body,
            teacherId: req.params.id
        });

        await fixedSchedule.save();

        res.status(201).json({
            success: true,
            message: 'Fixed schedule added successfully',
            data: fixedSchedule
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error adding fixed schedule',
            error: error.message
        });
    }
};

// UPDATE fixed schedule
export const updateFixedSchedule = async (req, res) => {
    try {
        const fixedSchedule = await FixedSchedule.findByIdAndUpdate(
            req.params.scheduleId,
            req.body,
            { new: true, runValidators: true }
        );

        if (!fixedSchedule) {
            return res.status(404).json({
                success: false,
                message: 'Fixed schedule not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Fixed schedule updated successfully',
            data: fixedSchedule
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error updating fixed schedule',
            error: error.message
        });
    }
};

// DELETE fixed schedule
export const deleteFixedSchedule = async (req, res) => {
    try {
        const fixedSchedule = await FixedSchedule.findByIdAndDelete(req.params.scheduleId);

        if (!fixedSchedule) {
            return res.status(404).json({
                success: false,
                message: 'Fixed schedule not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Fixed schedule deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error deleting fixed schedule',
            error: error.message
        });
    }
};
