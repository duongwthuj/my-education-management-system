import Subject from '../models/subject.js';
import SubjectLevel from '../models/subjectLevel.js';

// GET all subjects
export const getAllSubjects = async (req, res) => {
    try {
        const { isActive, page = 1, limit = 10 } = req.query;
        const query = {};

        if (isActive !== undefined) {
            query.isActive = isActive === 'true';
        }

        const skip = (page - 1) * limit;
        const subjects = await Subject.find(query)
            .skip(skip)
            .limit(parseInt(limit))
            .sort({ name: 1 });

        const total = await Subject.countDocuments(query);

        res.status(200).json({
            success: true,
            data: subjects,
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
            message: 'Error fetching subjects',
            error: error.message
        });
    }
};

// GET single subject by ID
export const getSubjectById = async (req, res) => {
    try {
        const subject = await Subject.findById(req.params.id);

        if (!subject) {
            return res.status(404).json({
                success: false,
                message: 'Subject not found'
            });
        }

        res.status(200).json({
            success: true,
            data: subject
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching subject',
            error: error.message
        });
    }
};

// GET subject with levels
export const getSubjectWithLevels = async (req, res) => {
    try {
        const subject = await Subject.findById(req.params.id);

        if (!subject) {
            return res.status(404).json({
                success: false,
                message: 'Subject not found'
            });
        }

        const levels = await SubjectLevel.find({ subjectId: req.params.id })
            .sort({ semester: 1 });

        res.status(200).json({
            success: true,
            data: {
                ...subject.toObject(),
                levels
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching subject details',
            error: error.message
        });
    }
};

// CREATE new subject
export const createSubject = async (req, res) => {
    try {
        const subject = new Subject(req.body);
        await subject.save();

        res.status(201).json({
            success: true,
            message: 'Subject created successfully',
            data: subject
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: 'Subject name or code already exists'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Error creating subject',
            error: error.message
        });
    }
};

// UPDATE subject
export const updateSubject = async (req, res) => {
    try {
        const subject = await Subject.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!subject) {
            return res.status(404).json({
                success: false,
                message: 'Subject not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Subject updated successfully',
            data: subject
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error updating subject',
            error: error.message
        });
    }
};

// DELETE subject
export const deleteSubject = async (req, res) => {
    try {
        const subject = await Subject.findByIdAndDelete(req.params.id);

        if (!subject) {
            return res.status(404).json({
                success: false,
                message: 'Subject not found'
            });
        }

        // Xóa các level liên quan
        await SubjectLevel.deleteMany({ subjectId: req.params.id });

        res.status(200).json({
            success: true,
            message: 'Subject deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error deleting subject',
            error: error.message
        });
    }
};

// ADD subject level
export const addSubjectLevel = async (req, res) => {
    try {
        const subjectLevel = new SubjectLevel({
            ...req.body,
            subjectId: req.params.id
        });

        await subjectLevel.save();

        res.status(201).json({
            success: true,
            message: 'Subject level added successfully',
            data: subjectLevel
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: 'Subject level already exists for this semester'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Error adding subject level',
            error: error.message
        });
    }
};

// UPDATE subject level
export const updateSubjectLevel = async (req, res) => {
    try {
        const subjectLevel = await SubjectLevel.findByIdAndUpdate(
            req.params.levelId,
            req.body,
            { new: true, runValidators: true }
        );

        if (!subjectLevel) {
            return res.status(404).json({
                success: false,
                message: 'Subject level not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Subject level updated successfully',
            data: subjectLevel
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error updating subject level',
            error: error.message
        });
    }
};

// GET all subject levels
export const getAllSubjectLevels = async (req, res) => {
    try {
        const subjectLevels = await SubjectLevel.find({})
            .populate('subjectId', 'name code')
            .sort({ 'subjectId.name': 1, level: 1 });

        res.status(200).json({
            success: true,
            data: subjectLevels
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching subject levels',
            error: error.message
        });
    }
};

// DELETE subject level
export const deleteSubjectLevel = async (req, res) => {
    try {
        const subjectLevel = await SubjectLevel.findByIdAndDelete(req.params.levelId);

        if (!subjectLevel) {
            return res.status(404).json({
                success: false,
                message: 'Subject level not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Subject level deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error deleting subject level',
            error: error.message
        });
    }
};
