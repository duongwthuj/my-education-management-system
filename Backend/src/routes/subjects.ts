import { Router, Request, Response } from 'express';
import { Subject, Teacher } from '../models';

const router = Router();

// GET /api/subjects
router.get('/', async (req: Request, res: Response) => {
  try {
    const { page = '1', limit = '50', category, level, search } = req.query;
    const pageNum = Number.parseInt(page as string, 10);
    const limitNum = Number.parseInt(limit as string, 10);

    const query: any = {};
    if (category) query.category = category;
    if (level) query.level = level;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (pageNum - 1) * limitNum;
    const [subjects, total] = await Promise.all([
      Subject.find(query).skip(skip).limit(limitNum).populate('teachers', 'id name email').lean(),
      Subject.countDocuments(query),
    ]);

    // Transform _id to id
    const transformedSubjects = subjects.map((subject: any) => ({
      ...subject,
      id: subject._id?.toString(),
    }));

    res.json({
      success: true,
      data: transformedSubjects,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/subjects/:id
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const subject = await Subject.findById(req.params.id).populate('teachers').lean();
    if (!subject) {
      return res.status(404).json({ success: false, error: 'Không tìm thấy môn học' });
    }
    // Transform _id to id
    const transformed = {
      ...subject,
      id: (subject as any)._id?.toString(),
    };
    res.json({ success: true, data: transformed });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/subjects
router.post('/', async (req: Request, res: Response) => {
  try {
    const subject = await Subject.create(req.body);
    res.status(201).json({ success: true, data: subject, message: 'Tạo môn học thành công' });
  } catch (error: any) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, error: 'Mã môn học đã tồn tại' });
    }
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT /api/subjects/:id
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const subject = await Subject.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).lean();
    if (!subject) {
      return res.status(404).json({ success: false, error: 'Không tìm thấy môn học' });
    }
    // Transform _id to id
    const transformed = {
      ...subject,
      id: (subject as any)._id?.toString(),
    };
    res.json({ success: true, data: transformed, message: 'Cập nhật môn học thành công' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE /api/subjects/:id
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const subject = await Subject.findByIdAndDelete(req.params.id).lean();
    if (!subject) {
      return res.status(404).json({ success: false, error: 'Không tìm thấy môn học' });
    }

    // Xóa subject khỏi danh sách subjects của tất cả các giáo viên
    await Teacher.updateMany(
      { subjects: req.params.id },
      { $pull: { subjects: req.params.id } }
    );

    res.json({ success: true, message: 'Xóa môn học thành công' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
