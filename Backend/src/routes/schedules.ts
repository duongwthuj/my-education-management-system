import { Router, Request, Response } from 'express';
import { Schedule } from '../models';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    const { page = '1', limit = '50', teacherId, subjectId, dayOfWeek, status } = req.query;
    const pageNum = Number.parseInt(page as string, 10);
    const limitNum = Number.parseInt(limit as string, 10);

    const query: any = {};
    if (teacherId) query.teacherId = teacherId;
    if (subjectId) query.subjectId = subjectId;
    if (dayOfWeek) query.dayOfWeek = dayOfWeek;
    if (status) query.status = status;

    const skip = (pageNum - 1) * limitNum;
    const [schedules, total] = await Promise.all([
      Schedule.find(query).skip(skip).limit(limitNum).populate('teacherId subjectId').lean(),
      Schedule.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: schedules,
      pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const schedule = await Schedule.findById(req.params.id).populate('teacherId subjectId').lean();
    if (!schedule) {
      return res.status(404).json({ success: false, error: 'Không tìm thấy lịch học' });
    }
    res.json({ success: true, data: schedule });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const schedule = await Schedule.create(req.body);
    res.status(201).json({ success: true, data: schedule, message: 'Tạo lịch học thành công' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.put('/:id', async (req: Request, res: Response) => {
  try {
    const schedule = await Schedule.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).lean();
    if (!schedule) {
      return res.status(404).json({ success: false, error: 'Không tìm thấy lịch học' });
    }
    res.json({ success: true, data: schedule, message: 'Cập nhật lịch học thành công' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const schedule = await Schedule.findByIdAndDelete(req.params.id).lean();
    if (!schedule) {
      return res.status(404).json({ success: false, error: 'Không tìm thấy lịch học' });
    }
    res.json({ success: true, message: 'Xóa lịch học thành công' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
