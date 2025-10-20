# Hướng Dẫn Kết Nối Frontend - Backend

## 📋 Tổng Quan

Tài liệu này hướng dẫn cách kết nối giữa Frontend (Next.js) và Backend (Express + MongoDB) cho hệ thống quản lý giáo viên.

## 🚀 Cài Đặt và Chạy

### 1. Backend Setup

```bash
# Di chuyển vào thư mục Backend
cd Backend

# Cài đặt dependencies (nếu chưa cài)
npm install

# Khởi động MongoDB (nếu chưa chạy)
# Windows: Mở MongoDB Compass hoặc chạy mongod
# Mac/Linux: sudo systemctl start mongod

# Seed dữ liệu mẫu (lần đầu tiên)
npm run seed

# Chạy backend server
npm run dev
```

Backend sẽ chạy tại: `http://localhost:5000`

### 2. Frontend Setup

```bash
# Mở terminal mới, di chuyển vào thư mục Frontend
cd Frontend

# Cài đặt dependencies (nếu chưa cài)
npm install

# Chạy frontend development server
npm run dev
```

Frontend sẽ chạy tại: `http://localhost:3000`

## 📁 Cấu Trúc File Mới

### Backend
- `.env` - File cấu hình môi trường (đã tạo)

### Frontend
- `.env.local` - File cấu hình môi trường (đã tạo)
- `src/lib/api-client.ts` - API client tổng quát
- `src/services/` - Các service để gọi API
  - `teachers.service.ts`
  - `subjects.service.ts`
  - `classes.service.ts`
  - `schedules.service.ts`
  - `index.ts`
- `src/hooks/` - React hooks để sử dụng API
  - `use-teachers.ts`
  - `use-subjects.ts`
  - `use-classes.ts`
  - `use-schedules.ts`

## 💡 Cách Sử Dụng

### Sử dụng Hooks trong Component

```typescript
'use client';

import { useTeachers } from '@/hooks/use-teachers';

export default function TeachersPage() {
  const { teachers, loading, error, refetch } = useTeachers();

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      {teachers.map((teacher) => (
        <div key={teacher.id}>
          {teacher.name} - {teacher.phone}
        </div>
      ))}
    </div>
  );
}
```

### Sử dụng Service trực tiếp

```typescript
import { teachersService } from '@/services';

// Tạo teacher mới
async function createTeacher() {
  const response = await teachersService.create({
    name: 'Nguyễn Văn A',
    phone: '0901234567',
    subjects: ['subject-id-1', 'subject-id-2']
  });

  if (response.success) {
    console.log('Created:', response.data);
  } else {
    console.error('Error:', response.error);
  }
}

// Update teacher
async function updateTeacher(id: string) {
  const response = await teachersService.update(id, {
    name: 'New Name',
    phone: '0987654321'
  });

  if (response.success) {
    console.log('Updated:', response.data);
  }
}

// Delete teacher
async function deleteTeacher(id: string) {
  const response = await teachersService.delete(id);

  if (response.success) {
    console.log('Deleted successfully');
  }
}
```

## 🔗 API Endpoints

### Teachers
- `GET /api/teachers` - Lấy danh sách giáo viên
- `GET /api/teachers/:id` - Lấy thông tin 1 giáo viên
- `POST /api/teachers` - Tạo giáo viên mới
- `PUT /api/teachers/:id` - Cập nhật giáo viên
- `DELETE /api/teachers/:id` - Xóa giáo viên

### Subjects
- `GET /api/subjects` - Lấy danh sách môn học
- `GET /api/subjects/:id` - Lấy thông tin 1 môn học
- `POST /api/subjects` - Tạo môn học mới
- `PUT /api/subjects/:id` - Cập nhật môn học
- `DELETE /api/subjects/:id` - Xóa môn học

### Classes
- `GET /api/classes` - Lấy danh sách lớp học
- `GET /api/classes/:id` - Lấy thông tin 1 lớp học
- `POST /api/classes` - Tạo lớp học mới
- `PUT /api/classes/:id` - Cập nhật lớp học
- `DELETE /api/classes/:id` - Xóa lớp học

### Schedules
- `GET /api/schedules` - Lấy danh sách lịch dạy
- `GET /api/schedules/:id` - Lấy thông tin 1 lịch dạy
- `GET /api/schedules/teacher/:teacherId` - Lấy lịch dạy của giáo viên
- `POST /api/schedules` - Tạo lịch dạy mới
- `PUT /api/schedules/:id` - Cập nhật lịch dạy
- `DELETE /api/schedules/:id` - Xóa lịch dạy

## 🔧 Cấu Hình

### Backend (.env)
```bash
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/education-management
FRONTEND_URL=http://localhost:3000
JWT_SECRET=your-secret-key-here
```

### Frontend (.env.local)
```bash
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_APP_NAME="Hệ thống quản lý giáo viên"
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## ⚠️ Lưu Ý

1. **Phải chạy Backend trước** - Backend server phải chạy trước khi frontend có thể gọi API
2. **MongoDB phải chạy** - Đảm bảo MongoDB đang chạy trên máy
3. **Port conflicts** - Nếu port 5000 hoặc 3000 bị chiếm, thay đổi trong file .env
4. **CORS** - Backend đã được cấu hình CORS để chấp nhận request từ `http://localhost:3000`

## 🐛 Troubleshooting

### Lỗi "Failed to fetch"
- Kiểm tra Backend có đang chạy không
- Kiểm tra URL trong `.env.local` có đúng không
- Kiểm tra console của browser để xem lỗi chi tiết

### Lỗi CORS
- Đảm bảo `FRONTEND_URL` trong Backend `.env` là `http://localhost:3000`
- Restart backend server sau khi thay đổi .env

### Lỗi MongoDB connection
- Kiểm tra MongoDB có đang chạy không
- Kiểm tra `MONGODB_URI` trong Backend `.env`

## 📝 Ví Dụ Component Hoàn Chỉnh

```typescript
'use client';

import React, { useState } from 'react';
import { useTeachers } from '@/hooks/use-teachers';
import { teachersService } from '@/services';
import { Button, CircularProgress, Alert } from '@mui/material';

export default function TeachersManagement() {
  const { teachers, loading, error, refetch } = useTeachers();
  const [submitting, setSubmitting] = useState(false);

  const handleCreateTeacher = async () => {
    setSubmitting(true);
    
    const response = await teachersService.create({
      name: 'Nguyễn Văn Test',
      phone: '0909090909',
      subjects: []
    });

    if (response.success) {
      // Refresh danh sách
      await refetch();
      alert('Tạo giáo viên thành công!');
    } else {
      alert('Lỗi: ' + response.error);
    }

    setSubmitting(false);
  };

  const handleDeleteTeacher = async (id: string) => {
    if (!confirm('Bạn có chắc muốn xóa?')) return;

    const response = await teachersService.delete(id);

    if (response.success) {
      await refetch();
      alert('Xóa thành công!');
    } else {
      alert('Lỗi: ' + response.error);
    }
  };

  if (loading) {
    return <CircularProgress />;
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  return (
    <div>
      <Button 
        onClick={handleCreateTeacher} 
        disabled={submitting}
        variant="contained"
      >
        Tạo Giáo Viên Mới
      </Button>

      <div>
        {teachers.map((teacher) => (
          <div key={teacher.id}>
            <h3>{teacher.name}</h3>
            <p>{teacher.phone}</p>
            <Button 
              onClick={() => handleDeleteTeacher(teacher.id)}
              color="error"
            >
              Xóa
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
```

## 🎯 Các Bước Tiếp Theo

1. Cập nhật các component hiện tại để sử dụng API thay vì mock data
2. Thêm form để tạo/sửa/xóa dữ liệu
3. Thêm xử lý lỗi và loading states
4. Thêm pagination và search
5. Thêm authentication (JWT)

## 📞 Hỗ Trợ

Nếu gặp vấn đề, kiểm tra:
1. Console của browser (F12)
2. Terminal của Backend server
3. MongoDB logs
4. Network tab trong DevTools
