import { Router, Request, Response } from 'express';
import { Class } from '../models';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    const { page = '1', limit = '10', status, teacherId, subjectId } = req.query;
    const pageNum = Number.parseInt(page as string, 10);
    const limitNum = Number.parseInt(limit as string, 10);

    const query: any = {};
    if (status) query.status = status;
    if (teacherId) query.teacherId = teacherId;
    if (subjectId) query.subjectId = subjectId;

    const skip = (pageNum - 1) * limitNum;
    const [classes, total] = await Promise.all([
      Class.find(query).skip(skip).limit(limitNum).populate('subjectId teacherId').lean(),
      Class.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: classes,
      pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const classItem = await Class.findById(req.params.id).populate('subjectId teacherId').lean();
    if (!classItem) {
      return res.status(404).json({ success: false, error: 'Không tìm thấy lớp học' });
    }
    res.json({ success: true, data: classItem });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const classItem = await Class.create(req.body);
    res.status(201).json({ success: true, data: classItem, message: 'Tạo lớp học thành công' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.put('/:id', async (req: Request, res: Response) => {
  try {
    const classItem = await Class.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).lean();
    if (!classItem) {
      return res.status(404).json({ success: false, error: 'Không tìm thấy lớp học' });
    }
    res.json({ success: true, data: classItem, message: 'Cập nhật lớp học thành công' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const classItem = await Class.findByIdAndDelete(req.params.id).lean();
    if (!classItem) {
      return res.status(404).json({ success: false, error: 'Không tìm thấy lớp học' });
    }
    res.json({ success: true, message: 'Xóa lớp học thành công' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
