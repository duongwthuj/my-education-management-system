# 🔗 Kết Nối Frontend - Backend

## ✅ Đã Hoàn Thành

Tôi đã thiết lập kết nối hoàn chỉnh giữa Frontend (Next.js) và Backend (Express + MongoDB) cho hệ thống quản lý giáo viên.

---

## 📦 Các File Đã Tạo

### Backend
- ✅ `.env` - File cấu hình môi trường

### Frontend

#### Configuration
- ✅ `.env.local` - File cấu hình môi trường
- ✅ `next.config.mjs` - Đã cập nhật với API proxy config (optional)

#### Core Libraries
- ✅ `src/lib/api-client.ts` - API client tổng quát với fetch wrapper

#### Services (API Calls)
- ✅ `src/services/teachers.service.ts` - Teacher API service
- ✅ `src/services/subjects.service.ts` - Subject API service
- ✅ `src/services/classes.service.ts` - Class API service
- ✅ `src/services/schedules.service.ts` - Schedule API service
- ✅ `src/services/index.ts` - Service exports

#### React Hooks
- ✅ `src/hooks/use-teachers.ts` - Teachers data hook
- ✅ `src/hooks/use-subjects.ts` - Subjects data hook
- ✅ `src/hooks/use-classes.ts` - Classes data hook
- ✅ `src/hooks/use-schedules.ts` - Schedules data hook

#### Components
- ✅ `src/components/teachers/teachers-list-with-api.tsx` - Component mẫu sử dụng API
- ✅ `src/components/common/api-connection-test.tsx` - Component test kết nối
- ✅ `src/app/dashboard/api-test/page.tsx` - Page test API

#### Documentation
- ✅ `INTEGRATION_GUIDE.md` - Hướng dẫn chi tiết về kết nối
- ✅ `MIGRATION_GUIDE.md` - Hướng dẫn chuyển đổi từ mock data sang API
- ✅ `SETUP_AND_TEST.md` - File này

---

## 🚀 Hướng Dẫn Sử Dụng

### 1️⃣ Khởi động Backend

```powershell
# Mở Terminal 1
cd Backend

# Cài đặt dependencies (nếu chưa)
npm install

# Chạy MongoDB (nếu chưa chạy)
# Mở MongoDB Compass hoặc khởi động mongod service

# Seed dữ liệu mẫu (chỉ lần đầu)
npm run seed

# Chạy backend server
npm run dev
```

**Backend chạy tại:** `http://localhost:5000`

### 2️⃣ Khởi động Frontend

```powershell
# Mở Terminal 2
cd Frontend

# Cài đặt dependencies (nếu chưa)
npm install

# Chạy frontend development server
npm run dev
```

**Frontend chạy tại:** `http://localhost:3000`

### 3️⃣ Test Kết Nối

Mở trình duyệt và truy cập:

```
http://localhost:3000/dashboard/api-test
```

Page này sẽ:
- ✅ Kiểm tra Backend có đang chạy không
- ✅ Kiểm tra tất cả API endpoints
- ✅ Hiển thị số lượng data từ database
- ✅ Hiển thị lỗi nếu có vấn đề

---

## 💻 Cách Sử Dụng API trong Component

### Cách 1: Sử dụng React Hooks (Khuyến nghị)

```typescript
'use client';

import { useTeachers } from '@/hooks/use-teachers';
import { CircularProgress, Alert } from '@mui/material';

export function MyComponent() {
  const { teachers, loading, error, refetch } = useTeachers();

  if (loading) return <CircularProgress />;
  if (error) return <Alert severity="error">{error}</Alert>;

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

### Cách 2: Sử dụng Service trực tiếp

```typescript
import { teachersService } from '@/services';

// Tạo mới
async function createTeacher() {
  const response = await teachersService.create({
    name: 'Nguyễn Văn A',
    phone: '0901234567',
    subjects: []
  });

  if (response.success) {
    console.log('Created:', response.data);
  } else {
    console.error('Error:', response.error);
  }
}

// Cập nhật
async function updateTeacher(id: string) {
  const response = await teachersService.update(id, {
    name: 'New Name'
  });
}

// Xóa
async function deleteTeacher(id: string) {
  const response = await teachersService.delete(id);
}
```

---

## 📚 Available Hooks

### Teachers
```typescript
const { teachers, loading, error, refetch } = useTeachers();
const { teacher, loading, error, refetch } = useTeacher(id);
```

### Subjects
```typescript
const { subjects, loading, error, refetch } = useSubjects();
const { subject, loading, error, refetch } = useSubject(id);
```

### Classes
```typescript
const { classes, loading, error, refetch } = useClasses();
const { class, loading, error, refetch } = useClass(id);
```

### Schedules
```typescript
const { schedules, loading, error, refetch } = useSchedules();
const { schedule, loading, error, refetch } = useSchedule(id);
const { schedules, loading, error, refetch } = useTeacherSchedules(teacherId);
```

---

## 🔗 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/teachers` | Lấy danh sách giáo viên |
| GET | `/api/teachers/:id` | Lấy thông tin 1 giáo viên |
| POST | `/api/teachers` | Tạo giáo viên mới |
| PUT | `/api/teachers/:id` | Cập nhật giáo viên |
| DELETE | `/api/teachers/:id` | Xóa giáo viên |
| GET | `/api/subjects` | Lấy danh sách môn học |
| GET | `/api/subjects/:id` | Lấy thông tin 1 môn học |
| POST | `/api/subjects` | Tạo môn học mới |
| PUT | `/api/subjects/:id` | Cập nhật môn học |
| DELETE | `/api/subjects/:id` | Xóa môn học |
| GET | `/api/classes` | Lấy danh sách lớp học |
| GET | `/api/classes/:id` | Lấy thông tin 1 lớp học |
| POST | `/api/classes` | Tạo lớp học mới |
| PUT | `/api/classes/:id` | Cập nhật lớp học |
| DELETE | `/api/classes/:id` | Xóa lớp học |
| GET | `/api/schedules` | Lấy danh sách lịch dạy |
| GET | `/api/schedules/:id` | Lấy thông tin 1 lịch dạy |
| GET | `/api/schedules/teacher/:teacherId` | Lấy lịch dạy của giáo viên |
| POST | `/api/schedules` | Tạo lịch dạy mới |
| PUT | `/api/schedules/:id` | Cập nhật lịch dạy |
| DELETE | `/api/schedules/:id` | Xóa lịch dạy |

---

## 🔧 Configuration

### Backend `.env`
```bash
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/education-management
FRONTEND_URL=http://localhost:3000
JWT_SECRET=your-secret-key-here
```

### Frontend `.env.local`
```bash
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_APP_NAME="Hệ thống quản lý giáo viên"
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## 🐛 Troubleshooting

### ❌ Lỗi: "Failed to fetch"
**Nguyên nhân:** Backend không chạy hoặc URL sai

**Giải pháp:**
1. Kiểm tra Backend có đang chạy tại `http://localhost:5000`
2. Kiểm tra `NEXT_PUBLIC_API_URL` trong `.env.local`
3. Xem console log trong terminal Backend

### ❌ Lỗi: CORS error
**Nguyên nhân:** CORS configuration sai

**Giải pháp:**
1. Kiểm tra `FRONTEND_URL` trong Backend `.env` = `http://localhost:3000`
2. Restart Backend server

### ❌ Lỗi: MongoDB connection
**Nguyên nhân:** MongoDB không chạy

**Giải pháp:**
1. Khởi động MongoDB service
2. Hoặc mở MongoDB Compass
3. Kiểm tra `MONGODB_URI` trong Backend `.env`

### ❌ Lỗi: "Cannot GET /api/..."
**Nguyên nhân:** Endpoint không tồn tại

**Giải pháp:**
1. Kiểm tra Backend routes
2. Kiểm tra Backend console logs
3. Xem file `Backend/src/routes/`

---

## 📖 Chi Tiết Hơn

Xem các file tài liệu sau:

1. **`INTEGRATION_GUIDE.md`** - Hướng dẫn chi tiết về integration
2. **`MIGRATION_GUIDE.md`** - Hướng dẫn migrate từ mock data sang API
3. **`Backend/BACKEND_INTEGRATION_SUMMARY.md`** - Tổng quan về Backend
4. **`Backend/DATABASE_README.md`** - Hướng dẫn về Database

---

## ✅ Checklist

- [x] Backend đã chạy tại `http://localhost:5000`
- [x] Frontend đã chạy tại `http://localhost:3000`
- [x] MongoDB đã chạy
- [x] File `.env` đã tạo cho Backend
- [x] File `.env.local` đã tạo cho Frontend
- [x] API client đã được tạo
- [x] Services đã được tạo
- [x] Hooks đã được tạo
- [x] Test page đã được tạo
- [ ] Đã test kết nối tại `/dashboard/api-test`
- [ ] Đã cập nhật components để sử dụng API

---

## 🎯 Next Steps

1. ✅ **Test kết nối** - Truy cập `/dashboard/api-test` để test
2. 📝 **Cập nhật components** - Sử dụng hooks thay vì mock data
3. 🎨 **Thêm UI feedback** - Loading, error states, toasts
4. 🔐 **Thêm authentication** - JWT tokens (future)
5. 📊 **Thêm pagination** - Cho danh sách lớn
6. 🔍 **Thêm search** - Backend search thay vì frontend filter

---

## 📞 Liên Hệ

Nếu có vấn đề, hãy kiểm tra:
1. Browser console (F12)
2. Backend terminal logs
3. Network tab trong DevTools
4. MongoDB logs

---

**Chúc bạn code vui vẻ! 🚀**
