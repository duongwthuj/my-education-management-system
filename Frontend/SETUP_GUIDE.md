# 🚀 Quick Setup Guide - Education Management System

## Cấu trúc Dự án

```
📦 Project Root
├── my-education-management-system/           # 🎨 FRONTEND (Next.js)
└── my-education-management-system-backend/   # 🔧 BACKEND (Express + MongoDB)
```

## ⚡ Quick Start (5 phút)

### Bước 1: Khởi động Backend

```bash
# 1. Di chuyển vào thư mục backend
cd my-education-management-system-backend

# 2. Cài đặt dependencies (lần đầu tiên)
npm install

# 3. Seed database với sample data
npm run seed

# 4. Khởi động server
npm run dev
```

✅ Backend chạy tại: **http://localhost:5000**

### Bước 2: Khởi động Frontend

```bash
# 1. Mở terminal mới, di chuyển vào thư mục frontend
cd my-education-management-system

# 2. Khởi động Next.js
npm run dev
```

✅ Frontend chạy tại: **http://localhost:3000**

## 📋 Yêu cầu

- **Node.js**: >= 18
- **MongoDB**:
  - Option 1: Local ([Download](https://www.mongodb.com/try/download/community))
  - Option 2: Atlas Cloud (Free tier)

## 🔗 Tích hợp Frontend với Backend

### Tạo file `.env.local` trong Frontend:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

### Ví dụ call API:

```typescript
// Fetch teachers
const response = await fetch('http://localhost:5000/api/teachers');
const data = await response.json();
console.log(data.data); // Array of teachers
```

## 📚 API Endpoints

```
GET    /api/health              # Health check
GET    /api/teachers            # Danh sách giáo viên
GET    /api/teachers/:id        # Chi tiết giáo viên
POST   /api/teachers            # Tạo giáo viên
PUT    /api/teachers/:id        # Cập nhật
DELETE /api/teachers/:id        # Xóa

# Tương tự cho: /api/subjects, /api/classes, /api/schedules
```

## 🗄️ Database

- **Name**: `education-management`
- **Collections**: `teachers`, `subjects`, `classes`, `schedules`
- **Connection**: `mongodb://localhost:27017/education-management`

## ✅ Kiểm tra Setup Thành công

### Test Backend:
```bash
curl http://localhost:5000/api/health
# Response: {"success":true,"message":"API is running"}
```

### Test Frontend:
Mở browser: `http://localhost:3000`

## 📖 Chi tiết

Xem file `MONGODB_INTEGRATION.md` để biết chi tiết đầy đủ về:
- Kiến trúc hệ thống
- Database schema
- API documentation
- Troubleshooting
- Best practices

## 🆘 Common Issues

**Backend không chạy?**
- Kiểm tra MongoDB đang chạy: `mongosh`
- Port 5000 bị chiếm: Đổi port trong `.env`

**Frontend không gọi được API?**
- Kiểm tra backend đang chạy
- Kiểm tra `.env.local` có đúng URL không

**Database rỗng?**
- Chạy: `npm run seed` trong thư mục backend

---

**Happy Coding! 🎉**
