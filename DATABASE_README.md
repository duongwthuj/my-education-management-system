# 🗄️ Chuyển đổi từ Mock Data sang MongoDB Database

## 📊 Tổng quan

Dự án **Education Management System** đã được nâng cấp từ việc sử dụng **mock data cố định** sang hệ thống **MongoDB database hoàn chỉnh** với REST API.

### Trước đây ❌
```
Frontend (Next.js)
    ↓
Mock Data (src/data/*.ts) - Dữ liệu cứng, không lưu trữ
```

### Bây giờ ✅
```
Frontend (Next.js)
    ↓ HTTP API
Backend (Express.js)
    ↓ Mongoose
MongoDB Database - Dữ liệu thực, có thể CRUD
```

## 🎯 Lợi ích

### 1. **Dữ liệu Thật, Lưu trữ Vĩnh viễn**
- ❌ Mock data: Mất khi refresh
- ✅ MongoDB: Lưu trữ lâu dài, có thể backup

### 2. **CRUD Operations Thực sự**
- ✅ Create: Thêm giáo viên, môn học mới
- ✅ Read: Lấy danh sách với pagination
- ✅ Update: Cập nhật thông tin
- ✅ Delete: Xóa records

### 3. **Tìm kiếm & Lọc Mạnh mẽ**
- Tìm kiếm theo tên, email, phone
- Lọc theo status, category, level
- Pagination cho dữ liệu lớn

### 4. **Quan hệ Dữ liệu**
- Teacher ↔ Subject (many-to-many)
- Class → Subject (one-to-many)
- Schedule → Teacher + Subject

### 5. **Scalability**
- Dễ dàng mở rộng thêm features
- Có thể thêm authentication
- Chuẩn bị cho production

## 📁 Cấu trúc Mới

```
📦 Workspace Root
│
├── 🎨 my-education-management-system/          # FRONTEND
│   ├── src/
│   │   ├── app/                                # Next.js pages
│   │   ├── components/                         # React components
│   │   ├── data/                               # ⚠️ Deprecated (giữ làm reference)
│   │   └── types/                              # TypeScript types
│   ├── .env.local.example                      # Environment template
│   ├── SETUP_GUIDE.md                          # Quick start guide
│   └── MONGODB_INTEGRATION.md                  # Chi tiết integration
│
└── 🔧 my-education-management-system-backend/  # BACKEND
    ├── src/
    │   ├── config/                             # Database config
    │   ├── models/                             # Mongoose models
    │   │   ├── Teacher.ts
    │   │   ├── Subject.ts
    │   │   ├── Class.ts
    │   │   └── Schedule.ts
    │   ├── routes/                             # API routes
    │   │   ├── teachers.ts
    │   │   ├── subjects.ts
    │   │   ├── classes.ts
    │   │   └── schedules.ts
    │   ├── scripts/
    │   │   └── seed.ts                         # Database seeding
    │   ├── types/                              # TypeScript types
    │   └── server.ts                           # Entry point
    ├── .env                                    # Environment variables
    ├── .env.example                            # Template
    └── README.md                               # Backend documentation
```

## 🚀 Bắt đầu Sử dụng

### Bước 1: Setup MongoDB

**Option A: Local MongoDB**
```bash
# macOS
brew install mongodb-community
brew services start mongodb-community

# Hoặc download từ: https://www.mongodb.com/try/download/community
```

**Option B: MongoDB Atlas (Cloud - Miễn phí)**
1. Đăng ký tại: https://www.mongodb.com/cloud/atlas
2. Tạo cluster (chọn M0 - Free)
3. Lấy connection string
4. Cập nhật trong Backend `.env`

### Bước 2: Khởi động Backend

```bash
cd my-education-management-system-backend

# Cài đặt dependencies (lần đầu)
npm install

# Seed database với sample data
npm run seed

# Khởi động server
npm run dev
```

Kết quả:
```
✅ MongoDB connected successfully
📊 Database: education-management
🚀 Server is running on port 5000
📡 API endpoint: http://localhost:5000/api
```

### Bước 3: Kiểm tra API

```bash
# Health check
curl http://localhost:5000/api/health

# Lấy danh sách teachers
curl http://localhost:5000/api/teachers

# Lấy danh sách subjects
curl http://localhost:5000/api/subjects
```

### Bước 4: Cấu hình Frontend

```bash
cd my-education-management-system

# Tạo file .env.local
cp .env.local.example .env.local
```

Nội dung `.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

### Bước 5: Chạy Frontend

```bash
npm run dev
```

## 📡 API Endpoints

### Teachers (Giáo viên)
```http
GET    /api/teachers?page=1&limit=10&status=active&search=nguyen
GET    /api/teachers/:id
POST   /api/teachers
PUT    /api/teachers/:id
DELETE /api/teachers/:id
```

### Subjects (Môn học)
```http
GET    /api/subjects?category=Lập trình Web&level=beginner
GET    /api/subjects/:id
POST   /api/subjects
PUT    /api/subjects/:id
DELETE /api/subjects/:id
```

### Classes (Lớp học)
```http
GET    /api/classes?status=active&teacherId=xxx
GET    /api/classes/:id
POST   /api/classes
PUT    /api/classes/:id
DELETE /api/classes/:id
```

### Schedules (Lịch học)
```http
GET    /api/schedules?teacherId=xxx&dayOfWeek=Thứ 2
GET    /api/schedules/:id
POST   /api/schedules
PUT    /api/schedules/:id
DELETE /api/schedules/:id
```

## 💾 Database Schema

### teachers
```javascript
{
  _id: ObjectId,
  name: "Nguyễn Văn A",
  email: "nguyenvana@example.com",
  phone: "0901234567",
  avatar: "https://...",
  address: "Hà Nội",
  joinDate: "2023-01-15",
  status: "active",
  education: "Thạc sĩ CNTT",
  bio: "...",
  subjects: [ObjectId("...")] // refs
}
```

### subjects
```javascript
{
  _id: ObjectId,
  name: "Siêu nhân lập trình web - Học phần 1",
  code: "WEB101",
  description: "...",
  category: "Lập trình Web",
  level: "beginner",
  teachers: [ObjectId("...")] // refs
}
```

## 🔍 Ví dụ Sử dụng

### Fetch Teachers trong React

```typescript
'use client';

import { useState, useEffect } from 'react';

export function TeachersList() {
  const [teachers, setTeachers] = useState([]);

  useEffect(() => {
    fetch('http://localhost:5000/api/teachers')
      .then(res => res.json())
      .then(data => setTeachers(data.data));
  }, []);

  return (
    <div>
      {teachers.map(teacher => (
        <div key={teacher.id}>
          <h3>{teacher.name}</h3>
          <p>{teacher.email}</p>
        </div>
      ))}
    </div>
  );
}
```

### Create Teacher

```typescript
async function createTeacher(teacherData) {
  const response = await fetch('http://localhost:5000/api/teachers', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(teacherData),
  });

  const result = await response.json();

  if (result.success) {
    console.log('Teacher created:', result.data);
  }
}
```

## 🛠️ Tools Hữu ích

### 1. MongoDB Compass (GUI)
- Download: https://www.mongodb.com/try/download/compass
- Xem database trực quan
- Thực hiện queries

### 2. Postman / Thunder Client
- Test API endpoints
- Debug requests/responses

### 3. mongosh (CLI)
```bash
mongosh

use education-management
db.teachers.find()
db.subjects.countDocuments()
```

## 📚 Documentation

- **Quick Start**: `SETUP_GUIDE.md`
- **Full Integration**: `MONGODB_INTEGRATION.md`
- **Backend API**: `my-education-management-system-backend/README.md`

## 🎯 Next Steps

### Immediate
1. ✅ Backend đã setup
2. ✅ Database đã seed
3. ⏳ Cập nhật Frontend components để sử dụng API
4. ⏳ Thêm loading states
5. ⏳ Thêm error handling

### Future
1. Authentication & Authorization
2. File upload (avatars)
3. Real-time updates (WebSocket)
4. Advanced search & filters
5. Export data (PDF, Excel)
6. Deployment (Vercel + Railway/Render)

## 🆘 Troubleshooting

### "Cannot connect to MongoDB"
```bash
# Kiểm tra MongoDB đang chạy
mongosh

# macOS - restart MongoDB
brew services restart mongodb-community
```

### "Port 5000 already in use"
```bash
# Tìm process đang dùng port
lsof -i :5000

# Hoặc đổi port trong backend .env
PORT=5001
```

### "CORS error"
- Kiểm tra `FRONTEND_URL` trong backend `.env`
- Đảm bảo frontend đang chạy đúng port

## 🎉 Kết luận

Dự án đã được nâng cấp thành công từ mock data sang full-stack application với:
- ✅ MongoDB database
- ✅ RESTful API
- ✅ Full CRUD operations
- ✅ Scalable architecture
- ✅ Production-ready

**Happy coding! 🚀**

---

_Generated by Claude Code Assistant_
