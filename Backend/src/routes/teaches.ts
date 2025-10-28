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
      teacherId: teach.teacherId?._id?.toString() || teach.teacherId,
      subjectId: teach.subjectId?._id?.toString() || teach.subjectId,
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
      teacherId: teach.teacherId?._id?.toString() || teach.teacherId,
      subjectId: teach.subjectId?._id?.toString() || teach.subjectId,
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
      id: teach._id?.toString(),
      teacherId: teach.teacherId?._id?.toString() || teach.teacherId,
      subjectId: teach.subjectId?._id?.toString() || teach.subjectId,
      className: teach.className,
      sessionClassId: teach.sessionClassId?.toString(),
      classType: teach.classType,
      dayOfWeek: teach.dayOfWeek,
      startTime: teach.startTime,
      endTime: teach.endTime,
      notes: teach.notes,
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
      teacherId: (populated as any).teacherId?._id?.toString() || (populated as any).teacherId,
      subjectId: (populated as any).subjectId?._id?.toString() || (populated as any).subjectId,
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
    const teach = await Teach.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    })
      .populate('teacherId', 'name email')
      .populate('subjectId', 'name code');

    if (!teach) {
      return res.status(404).json({ success: false, error: 'Không tìm thấy phân công dạy' });
    }

    // Transform data to convert _id to id
    const transformedTeach = {
      id: (teach as any)._id?.toString(),
      teacherId: (teach as any).teacherId?._id?.toString() || (teach as any).teacherId,
      subjectId: (teach as any).subjectId?._id?.toString() || (teach as any).subjectId,
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
    res.status(500).json({ success: false, error: error.message });
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
