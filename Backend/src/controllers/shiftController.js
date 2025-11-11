import Shift from '../models/shift.js';
import WorkShift from '../models/workShift.js';

// ========== SHIFT MANAGEMENT ==========

// GET all shifts
export const getAllShifts = async (req, res) => {
    try {
        const { isActive } = req.query;
        const query = {};

        if (isActive !== undefined) {
            query.isActive = isActive === 'true';
        }

        const shifts = await Shift.find(query).sort({ startTime: 1 });

        res.status(200).json({
            success: true,
            data: shifts
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching shifts',
            error: error.message
        });
    }
};

// GET single shift by ID
export const getShiftById = async (req, res) => {
    try {
        const shift = await Shift.findById(req.params.id);

        if (!shift) {
            return res.status(404).json({
                success: false,
                message: 'Shift not found'
            });
        }

        res.status(200).json({
            success: true,
            data: shift
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching shift',
            error: error.message
        });
    }
};

// CREATE new shift
export const createShift = async (req, res) => {
    try {
        const shift = new Shift(req.body);
        await shift.save();

        res.status(201).json({
            success: true,
            message: 'Shift created successfully',
            data: shift
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: 'Shift name already exists'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Error creating shift',
            error: error.message
        });
    }
};

// UPDATE shift
export const updateShift = async (req, res) => {
    try {
        const shift = await Shift.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!shift) {
            return res.status(404).json({
                success: false,
                message: 'Shift not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Shift updated successfully',
            data: shift
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error updating shift',
            error: error.message
        });
    }
};

// DELETE shift
export const deleteShift = async (req, res) => {
    try {
        const shift = await Shift.findByIdAndDelete(req.params.id);

        if (!shift) {
            return res.status(404).json({
                success: false,
                message: 'Shift not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Shift deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error deleting shift',
            error: error.message
        });
    }
};

// ========== WORK SHIFT MANAGEMENT ==========

// GET work shifts by teacher and date range
export const getWorkShifts = async (req, res) => {
    try {
        const { teacherId, startDate, endDate, isAvailable } = req.query;
        const query = {};

        if (teacherId) {
            query.teacherId = teacherId;
        }

        if (startDate && endDate) {
            query.date = {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            };
        }

        if (isAvailable !== undefined) {
            query.isAvailable = isAvailable === 'true';
        }

        const workShifts = await WorkShift.find(query)
            .populate('teacherId', 'name email')
            .populate('shiftId')
            .sort({ date: 1, 'shiftId.startTime': 1 });

        res.status(200).json({
            success: true,
            data: workShifts
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching work shifts',
            error: error.message
        });
    }
};

// GET teacher availability for a date
export const getTeacherAvailability = async (req, res) => {
    try {
        const { teacherId, date } = req.query;

        if (!teacherId || !date) {
            return res.status(400).json({
                success: false,
                message: 'Teacher ID and date are required'
            });
        }

        const queryDate = new Date(date);
        // Chuẩn hóa ngày về UTC để tránh lệch múi giờ
        const startOfDay = new Date(Date.UTC(queryDate.getUTCFullYear(), queryDate.getUTCMonth(), queryDate.getUTCDate(), 0, 0, 0, 0));
        const endOfDay = new Date(Date.UTC(queryDate.getUTCFullYear(), queryDate.getUTCMonth(), queryDate.getUTCDate(), 23, 59, 59, 999));

        const workShifts = await WorkShift.find({
            teacherId,
            date: {
                $gte: startOfDay,
                $lte: endOfDay
            },
            isAvailable: true
        }).populate('shiftId');

        res.status(200).json({
            success: true,
            data: workShifts
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching teacher availability',
            error: error.message
        });
    }
};

// CREATE work shift
export const createWorkShift = async (req, res) => {
    try {
        const { teacherId, date, shiftId, isAvailable = true, isOnLeave = false, notes } = req.body;
        
        // Validation
        if (!teacherId || !date || !shiftId) {
            return res.status(400).json({
                success: false,
                message: 'Teacher ID, date, and shift ID are required'
            });
        }

        // Chuẩn hóa ngày về UTC để tránh lệch múi giờ
        const workShiftDate = new Date(date);
        const normalizedDate = new Date(Date.UTC(workShiftDate.getUTCFullYear(), workShiftDate.getUTCMonth(), workShiftDate.getUTCDate(), 0, 0, 0, 0));

        const workShift = new WorkShift({
            teacherId,
            date: normalizedDate,
            shiftId,
            isAvailable,
            isOnLeave,
            notes
        });
        
        await workShift.save();

        res.status(201).json({
            success: true,
            message: 'Work shift created successfully',
            data: workShift
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: 'Work shift already exists for this teacher, date and shift'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Error creating work shift',
            error: error.message
        });
    }
};

// CREATE multiple work shifts (bulk)
export const createBulkWorkShifts = async (req, res) => {
    try {
        const { teacherId, shifts } = req.body; // shifts: [{ date, shiftId, isAvailable, notes }]

        if (!teacherId || !shifts || !Array.isArray(shifts)) {
            return res.status(400).json({
                success: false,
                message: 'Teacher ID and shifts array are required'
            });
        }

        const workShifts = shifts.map(shift => {
            // Chuẩn hóa ngày về UTC cho từng shift
            const shiftDate = new Date(shift.date);
            const normalizedDate = new Date(Date.UTC(shiftDate.getUTCFullYear(), shiftDate.getUTCMonth(), shiftDate.getUTCDate(), 0, 0, 0, 0));
            
            return {
                teacherId,
                ...shift,
                date: normalizedDate
            };
        });

        const created = await WorkShift.insertMany(workShifts, { ordered: false });

        res.status(201).json({
            success: true,
            message: `${created.length} work shifts created successfully`,
            data: created
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: 'Some work shifts already exist',
                error: error.message
            });
        }

        res.status(500).json({
            success: false,
            message: 'Error creating work shifts',
            error: error.message
        });
    }
};

// UPDATE work shift
export const updateWorkShift = async (req, res) => {
    try {
        const workShift = await WorkShift.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!workShift) {
            return res.status(404).json({
                success: false,
                message: 'Work shift not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Work shift updated successfully',
            data: workShift
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error updating work shift',
            error: error.message
        });
    }
};

// DELETE work shift
export const deleteWorkShift = async (req, res) => {
    try {
        const workShift = await WorkShift.findByIdAndDelete(req.params.id);

        if (!workShift) {
            return res.status(404).json({
                success: false,
                message: 'Work shift not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Work shift deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error deleting work shift',
            error: error.message
        });
    }
};

// DELETE work shifts by date range
export const deleteWorkShiftsByDateRange = async (req, res) => {
    try {
        const { teacherId, startDate, endDate } = req.query;

        if (!teacherId || !startDate || !endDate) {
            return res.status(400).json({
                success: false,
                message: 'Teacher ID, start date and end date are required'
            });
        }

        const result = await WorkShift.deleteMany({
            teacherId,
            date: {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            }
        });

        res.status(200).json({
            success: true,
            message: `${result.deletedCount} work shifts deleted successfully`
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error deleting work shifts',
            error: error.message
        });
    }
};
