import { Router, Request, Response } from 'express';
import { Teach, Teacher, Subject, Class } from '../models';

const router = Router();

// GET /api/teaches - Get all teach assignments
router.get('/', async (req: Request, res: Response) => {
  try {
    const { teacherId, subjectId, className, dayOfWeek } = req.query;
    
    const query: any = {};
    if (teacherId) query.teacherId = teacherId;
    if (subjectId) query.subjectId = subjectId;
    if (className) query.className = className;
    if (dayOfWeek) query.dayOfWeek = dayOfWeek;

    const teaches = await Teach.find(query)
      .populate('teacherId', 'name email')
      .populate('subjectId', 'name code');

    // Transform data to convert _id to id
    const transformedTeaches = teaches.map((teach: any) => ({
      id: teach._id?.toString(),
      teacherId: typeof teach.teacherId === 'object' ? teach.teacherId._id?.toString() : teach.teacherId?.toString(),
      subjectId: typeof teach.subjectId === 'object' ? teach.subjectId._id?.toString() : teach.subjectId?.toString(),
      className: teach.className,
      sessionClassId: teach.sessionClassId?.toString(),
      classType: teach.classType,
      dayOfWeek: teach.dayOfWeek,
      startTime: teach.startTime,
      endTime: teach.endTime,
      notes: teach.notes,
    }));

    res.json({ success: true, data: transformedTeaches });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/teaches/teacher/:teacherId - Get all teaches by teacher
router.get('/teacher/:teacherId', async (req: Request, res: Response) => {
  try {
    const teaches = await Teach.find({ teacherId: req.params.teacherId })
      .populate('teacherId', 'name email')
      .populate('subjectId', 'name code');

    // Transform data to convert _id to id
    const transformedTeaches = teaches.map((teach: any) => ({
      id: teach._id?.toString(),
      teacherId: typeof teach.teacherId === 'object' ? teach.teacherId._id?.toString() : teach.teacherId?.toString(),
      subjectId: typeof teach.subjectId === 'object' ? teach.subjectId._id?.toString() : teach.subjectId?.toString(),
      className: teach.className,
      sessionClassId: teach.sessionClassId?.toString(),
      classType: teach.classType,
      dayOfWeek: teach.dayOfWeek,
      startTime: teach.startTime,
      endTime: teach.endTime,
      notes: teach.notes,
    }));

    res.json({ success: true, data: transformedTeaches });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/teaches/:id - Get teach by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const teach = await Teach.findById(req.params.id)
      .populate('teacherId', 'name email')
      .populate('subjectId', 'name code');

    if (!teach) {
      return res.status(404).json({ success: false, error: 'Không tìm thấy phân công dạy' });
    }

    // Transform data to convert _id to id
    const transformedTeach = {
      id: (teach as any)._id?.toString(),
      teacherId: typeof (teach as any).teacherId === 'object' ? (teach as any).teacherId._id?.toString() : (teach as any).teacherId?.toString(),
      subjectId: typeof (teach as any).subjectId === 'object' ? (teach as any).subjectId._id?.toString() : (teach as any).subjectId?.toString(),
      className: (teach as any).className,
      sessionClassId: (teach as any).sessionClassId?.toString(),
      classType: (teach as any).classType,
      dayOfWeek: (teach as any).dayOfWeek,
      startTime: (teach as any).startTime,
      endTime: (teach as any).endTime,
      notes: (teach as any).notes,
    };

    res.json({ success: true, data: transformedTeach });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/teaches - Create new teach assignment
router.post('/', async (req: Request, res: Response) => {
  try {
    const teach = await Teach.create(req.body);
    const populated = await Teach.findById(teach._id)
      .populate('teacherId', 'name email')
      .populate('subjectId', 'name code');

    if (!populated) {
      return res.status(500).json({ success: false, error: 'Failed to create teach assignment' });
    }

    // Transform data to convert _id to id
    const transformedTeach = {
      id: (populated as any)._id?.toString(),
      teacherId: typeof (populated as any).teacherId === 'object' ? (populated as any).teacherId._id?.toString() : (populated as any).teacherId?.toString(),
      subjectId: typeof (populated as any).subjectId === 'object' ? (populated as any).subjectId._id?.toString() : (populated as any).subjectId?.toString(),
      className: (populated as any).className,
      sessionClassId: (populated as any).sessionClassId?.toString(),
      classType: (populated as any).classType,
      dayOfWeek: (populated as any).dayOfWeek,
      startTime: (populated as any).startTime,
      endTime: (populated as any).endTime,
      notes: (populated as any).notes,
    };

    res.status(201).json({
      success: true,
      data: transformedTeach,
      message: 'Tạo phân công dạy thành công',
    });
  } catch (error: any) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        error: 'Phân công dạy đã tồn tại (trùng giáo viên, ngày, giờ)',
      });
    }
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT /api/teaches/:id - Update teach assignment
router.put('/:id', async (req: Request, res: Response) => {
  try {
    // First, get the current teach to check for duplicates
    const currentTeach = await Teach.findById(req.params.id);
    if (!currentTeach) {
      return res.status(404).json({ success: false, error: 'Không tìm thấy phân công dạy' });
    }

    // Check if we're changing the time slot
    const teacherIdChanged = req.body.teacherId && req.body.teacherId !== currentTeach.teacherId.toString();
    const dayChanged = req.body.dayOfWeek && req.body.dayOfWeek !== currentTeach.dayOfWeek;
    const startTimeChanged = req.body.startTime && req.body.startTime !== currentTeach.startTime;
    const endTimeChanged = req.body.endTime && req.body.endTime !== currentTeach.endTime;

    // If time slot is being changed, check for conflicts
    if (teacherIdChanged || dayChanged || startTimeChanged || endTimeChanged) {
      const updateTeacherId = req.body.teacherId || currentTeach.teacherId;
      const updateDayOfWeek = req.body.dayOfWeek || currentTeach.dayOfWeek;
      const updateStartTime = req.body.startTime || currentTeach.startTime;
      const updateEndTime = req.body.endTime || currentTeach.endTime;

      const conflict = await Teach.findOne({
        _id: { $ne: req.params.id }, // Exclude current record
        teacherId: updateTeacherId,
        dayOfWeek: updateDayOfWeek,
        startTime: updateStartTime,
        endTime: updateEndTime,
      });

      if (conflict) {
        return res.status(400).json({
          success: false,
          error: 'Thời gian dạy này đã bị trùng với phân công khác của cùng giáo viên',
        });
      }
    }

    // Validate fields
    if (req.body.classType && !['fixed', 'session'].includes(req.body.classType)) {
      return res.status(400).json({ success: false, error: 'Loại lớp không hợp lệ' });
    }
    if (
      req.body.dayOfWeek &&
      !['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ nhật'].includes(req.body.dayOfWeek)
    ) {
      return res.status(400).json({ success: false, error: 'Ngày trong tuần không hợp lệ' });
    }
    if (req.body.startTime && !/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(req.body.startTime)) {
      return res.status(400).json({ success: false, error: 'Định dạng giờ bắt đầu không hợp lệ (HH:mm)' });
    }
    if (req.body.endTime && !/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(req.body.endTime)) {
      return res.status(400).json({ success: false, error: 'Định dạng giờ kết thúc không hợp lệ (HH:mm)' });
    }

    const teach = await Teach.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: false, // We handle validation above
    })
      .populate('teacherId', 'name email')
      .populate('subjectId', 'name code');

    // Transform data to convert _id to id
    const transformedTeach = {
      id: (teach as any)._id?.toString(),
      teacherId: typeof (teach as any).teacherId === 'object' ? (teach as any).teacherId._id?.toString() : (teach as any).teacherId?.toString(),
      subjectId: typeof (teach as any).subjectId === 'object' ? (teach as any).subjectId._id?.toString() : (teach as any).subjectId?.toString(),
      className: (teach as any).className,
      sessionClassId: (teach as any).sessionClassId?.toString(),
      classType: (teach as any).classType,
      dayOfWeek: (teach as any).dayOfWeek,
      startTime: (teach as any).startTime,
      endTime: (teach as any).endTime,
      notes: (teach as any).notes,
    };

    res.json({ success: true, data: transformedTeach, message: 'Cập nhật phân công dạy thành công' });
  } catch (error: any) {
    console.error('PUT /api/teaches/:id error:', error);
    res.status(500).json({ success: false, error: error.message || 'Lỗi cập nhật phân công dạy' });
  }
});

// DELETE /api/teaches/:id - Delete teach assignment
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const teach = await Teach.findByIdAndDelete(req.params.id).lean();
    
    if (!teach) {
      return res.status(404).json({ success: false, error: 'Không tìm thấy phân công dạy' });
    }

    res.json({ success: true, message: 'Xóa phân công dạy thành công' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
