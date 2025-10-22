import { Router, Request, Response } from 'express';
import { Teacher, Subject } from '../models';
import { ApiResponse } from '../types';

const router = Router();

// GET /api/teachers - Lấy danh sách giáo viên
router.get('/', async (req: Request, res: Response) => {
  try {
    const { page = '1', limit = '10', status, search } = req.query;
    const pageNum = Number.parseInt(page as string, 10);
    const limitNum = Number.parseInt(limit as string, 10);

    // Build query
    const query: any = {};
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (pageNum - 1) * limitNum;
    const [teachers, total] = await Promise.all([
      Teacher.find(query).skip(skip).limit(limitNum).lean(),
      Teacher.countDocuments(query),
    ]);

    const response: ApiResponse = {
      success: true,
      data: teachers,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    };

    res.json(response);
  } catch (error: any) {
    console.error('GET /api/teachers error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal Server Error',
    });
  }
});

// GET /api/teachers/:id - Lấy thông tin giáo viên
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const teacher = await Teacher.findById(req.params.id).lean();

    if (!teacher) {
      return res.status(404).json({
        success: false,
        error: 'Không tìm thấy giáo viên',
      });
    }

    res.json({
      success: true,
      data: teacher,
    });
  } catch (error: any) {
    console.error(`GET /api/teachers/${req.params.id} error:`, error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal Server Error',
    });
  }
});

// POST /api/teachers - Tạo giáo viên mới
router.post('/', async (req: Request, res: Response) => {
  try {
    const teacher = await Teacher.create(req.body);

    res.status(201).json({
      success: true,
      data: teacher,
      message: 'Tạo giáo viên thành công',
    });
  } catch (error: any) {
    console.error('POST /api/teachers error:', error);

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        error: 'Email đã tồn tại',
      });
    }

    res.status(500).json({
      success: false,
      error: error.message || 'Internal Server Error',
    });
  }
});

// PUT /api/teachers/:id - Cập nhật giáo viên
router.put('/:id', async (req: Request, res: Response) => {
  try {
    // Nếu cập nhật danh sách môn học, cần đồng bộ với Subject.teachers
    if (req.body.subjects && Array.isArray(req.body.subjects)) {
      // Lấy thông tin giáo viên cũ để so sánh môn học
      const oldTeacher = await Teacher.findById(req.params.id).lean();
      const oldSubjectIds = oldTeacher?.subjects || [];
      const newSubjectIds = req.body.subjects;

      // Tìm môn mới được thêm vào
      const addedSubjectIds = newSubjectIds.filter((id: string) => !oldSubjectIds.includes(id));
      // Tìm môn bị xóa
      const removedSubjectIds = oldSubjectIds.filter((id: string) => !newSubjectIds.includes(id));

      // Cập nhật môn được thêm: thêm teacherId vào Subject.teachers
      if (addedSubjectIds.length > 0) {
        await Subject.updateMany(
          { _id: { $in: addedSubjectIds } },
          { $addToSet: { teachers: req.params.id } }
        );
      }

      // Cập nhật môn bị xóa: xóa teacherId khỏi Subject.teachers
      if (removedSubjectIds.length > 0) {
        await Subject.updateMany(
          { _id: { $in: removedSubjectIds } },
          { $pull: { teachers: req.params.id } }
        );
      }
    }

    const teacher = await Teacher.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).lean();

    if (!teacher) {
      return res.status(404).json({
        success: false,
        error: 'Không tìm thấy giáo viên',
      });
    }

    res.json({
      success: true,
      data: teacher,
      message: 'Cập nhật giáo viên thành công',
    });
  } catch (error: any) {
    console.error(`PUT /api/teachers/${req.params.id} error:`, error);

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        error: 'Email đã tồn tại',
      });
    }

    res.status(500).json({
      success: false,
      error: error.message || 'Internal Server Error',
    });
  }
});

// DELETE /api/teachers/:id - Xóa giáo viên
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const teacher = await Teacher.findByIdAndDelete(req.params.id).lean();

    if (!teacher) {
      return res.status(404).json({
        success: false,
        error: 'Không tìm thấy giáo viên',
      });
    }

    res.json({
      success: true,
      message: 'Xóa giáo viên thành công',
    });
  } catch (error: any) {
    console.error(`DELETE /api/teachers/${req.params.id} error:`, error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal Server Error',
    });
  }
});

export default router;
