# Hướng dẫn Tích hợp MongoDB - Education Management System

## 📚 Tổng quan

Dự án đã được tách thành 2 phần riêng biệt:

```
my-education-management-system/          # Frontend (Next.js)
my-education-management-system-backend/   # Backend (Express + MongoDB)
```

## 🏗️ Kiến trúc Hệ thống

```
┌─────────────────┐         HTTP/REST API         ┌─────────────────┐
│                 │ ◄─────────────────────────────►│                 │
│   FRONTEND      │         Port 3000 → 5000       │    BACKEND      │
│   (Next.js)     │                                │   (Express.js)  │
│                 │                                │                 │
└─────────────────┘                                └────────┬────────┘
                                                            │
                                                            │ Mongoose ODM
                                                            ▼
                                                   ┌─────────────────┐
                                                   │                 │
                                                   │    MongoDB      │
                                                   │    Database     │
                                                   │                 │
                                                   └─────────────────┘
```

## 🚀 Bước 1: Setup và Chạy Backend

### 1.1 Di chuyển vào thư mục Backend

```bash
cd my-education-management-system-backend
```

### 1.2 Cài đặt Dependencies (nếu chưa có)

```bash
npm install
```

### 1.3 Cấu hình MongoDB

**Option A: MongoDB Local**

Cài đặt MongoDB:
- **macOS**: `brew install mongodb-community`
- **Windows**: Download từ [mongodb.com](https://www.mongodb.com/try/download/community)
- **Linux**: `sudo apt-get install mongodb`

Khởi động MongoDB:
```bash
# macOS
brew services start mongodb-community

# Linux
sudo systemctl start mongod

# Windows
net start MongoDB
```

**Option B: MongoDB Atlas (Cloud - Khuyến nghị)**

1. Truy cập [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Tạo tài khoản miễn phí
3. Tạo cluster mới (chọn Free Tier)
4. Lấy connection string
5. Cập nhật trong file `.env`:

```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/education-management
```

### 1.4 Seed Database với Sample Data

```bash
npm run seed
```

Kết quả mong đợi:
```
✅ Database seeding completed successfully!

📊 Summary:
   - Teachers: 6
   - Subjects: 12
   - Classes: 3
   - Schedules: 4
```

### 1.5 Khởi động Backend Server

```bash
npm run dev
```

Server sẽ chạy tại: **http://localhost:5000**

Kiểm tra backend hoạt động:
```bash
curl http://localhost:5000/api/health
```

## 🎨 Bước 2: Cập nhật Frontend để Sử dụng API

### 2.1 Cấu hình Environment Variables

Tạo file `.env.local` trong thư mục Frontend:

```bash
cd ../my-education-management-system
```

Tạo file `.env.local`:

```env
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

### 2.2 Tạo API Client (Recommended)

Tạo file `src/lib/api-client.ts`:

```typescript
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

interface FetchOptions extends RequestInit {
  params?: Record<string, string | number>;
}

class ApiClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  private buildURL(endpoint: string, params?: Record<string, string | number>): string {
    const url = new URL(`${this.baseURL}${endpoint}`);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, String(value));
      });
    }
    return url.toString();
  }

  async request<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
    const { params, ...fetchOptions } = options;
    const url = this.buildURL(endpoint, params);

    const response = await fetch(url, {
      ...fetchOptions,
      headers: {
        'Content-Type': 'application/json',
        ...fetchOptions.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'API request failed');
    }

    return response.json();
  }

  // Teachers
  async getTeachers(params?: { page?: number; limit?: number; status?: string; search?: string }) {
    return this.request('/teachers', { params });
  }

  async getTeacher(id: string) {
    return this.request(`/teachers/${id}`);
  }

  async createTeacher(data: any) {
    return this.request('/teachers', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateTeacher(id: string, data: any) {
    return this.request(`/teachers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteTeacher(id: string) {
    return this.request(`/teachers/${id}`, { method: 'DELETE' });
  }

  // Subjects
  async getSubjects(params?: { page?: number; limit?: number; category?: string; level?: string }) {
    return this.request('/subjects', { params });
  }

  async getSubject(id: string) {
    return this.request(`/subjects/${id}`);
  }

  // Classes
  async getClasses(params?: { page?: number; limit?: number; status?: string }) {
    return this.request('/classes', { params });
  }

  async getClass(id: string) {
    return this.request(`/classes/${id}`);
  }

  // Schedules
  async getSchedules(params?: { teacherId?: string; subjectId?: string; dayOfWeek?: string }) {
    return this.request('/schedules', { params });
  }
}

export const apiClient = new ApiClient(API_URL);
export default apiClient;
```

### 2.3 Ví dụ Sử dụng trong Components

**Server Component (Recommended với Next.js 15):**

```typescript
// src/app/dashboard/teachers/page.tsx
import apiClient from '@/lib/api-client';
import { TeachersTable } from '@/components/teachers/teachers-table';

export default async function TeachersPage() {
  const response = await apiClient.getTeachers({ page: 1, limit: 10 });

  return (
    <div>
      <h1>Danh sách Giáo viên</h1>
      <TeachersTable teachers={response.data} />
    </div>
  );
}
```

**Client Component:**

```typescript
'use client';

import { useState, useEffect } from 'react';
import apiClient from '@/lib/api-client';

export function TeachersList() {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTeachers() {
      try {
        const response = await apiClient.getTeachers();
        setTeachers(response.data);
      } catch (error) {
        console.error('Error fetching teachers:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchTeachers();
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      {teachers.map(teacher => (
        <div key={teacher.id}>{teacher.name}</div>
      ))}
    </div>
  );
}
```

## 📊 Database Schema

### Collections trong MongoDB

#### 1. teachers
```javascript
{
  _id: ObjectId,
  name: String,
  email: String (unique),
  phone: String,
  avatar: String,
  address: String,
  joinDate: String,
  status: 'active' | 'on-leave' | 'inactive',
  education: String,
  bio: String,
  subjects: [ObjectId] // ref: subjects
}
```

#### 2. subjects
```javascript
{
  _id: ObjectId,
  name: String,
  code: String (unique),
  description: String,
  category: String,
  level: 'beginner' | 'intermediate' | 'advanced',
  teachers: [ObjectId] // ref: teachers
}
```

#### 3. classes
```javascript
{
  _id: ObjectId,
  name: String,
  subjectId: ObjectId, // ref: subjects
  startDate: String,
  endDate: String,
  studentsCount: Number,
  status: 'pending' | 'active' | 'completed',
  teacherId: ObjectId, // ref: teachers
  description: String,
  location: String
}
```

#### 4. schedules
```javascript
{
  _id: ObjectId,
  teacherId: ObjectId, // ref: teachers
  subjectId: ObjectId, // ref: subjects
  dayOfWeek: String,
  startTime: String,
  endTime: String,
  room: String,
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled'
}
```

## 🔧 Troubleshooting

### Vấn đề: Backend không kết nối được MongoDB

**Giải pháp:**
1. Kiểm tra MongoDB đang chạy: `mongosh` (CLI) hoặc MongoDB Compass
2. Kiểm tra `MONGODB_URI` trong `.env`
3. Kiểm tra firewall/network settings

### Vấn đề: Frontend không gọi được API

**Giải pháp:**
1. Kiểm tra Backend đang chạy: `http://localhost:5000/api/health`
2. Kiểm tra CORS settings trong Backend
3. Kiểm tra `NEXT_PUBLIC_API_URL` trong Frontend `.env.local`

### Vấn đề: Lỗi "MongooseError: Operation buffering timed out"

**Giải pháp:**
- MongoDB chưa được khởi động
- Connection string không đúng
- Network/Firewall chặn kết nối

## 🎯 Next Steps

### Immediate
1. [ ] Chạy Backend với `npm run dev`
2. [ ] Seed database với `npm run seed`
3. [ ] Test API endpoints với Postman hoặc curl
4. [ ] Cập nhật Frontend để sử dụng API

### Future Enhancements
1. [ ] Thêm Authentication (JWT)
2. [ ] Thêm file upload cho avatars
3. [ ] Implement caching (Redis)
4. [ ] Add pagination UI trong Frontend
5. [ ] Real-time updates với WebSocket
6. [ ] Deploy Backend lên cloud (Heroku, Railway, Render)
7. [ ] Deploy Database lên MongoDB Atlas

## 📚 Tài liệu Tham khảo

- [MongoDB Documentation](https://docs.mongodb.com/)
- [Mongoose Documentation](https://mongoosejs.com/docs/)
- [Express.js Documentation](https://expressjs.com/)
- [Next.js API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)

## 💡 Tips

1. **Development**: Sử dụng MongoDB Compass để xem database trực quan
2. **Testing**: Sử dụng Postman hoặc Thunder Client (VS Code extension)
3. **Debugging**: Enable MongoDB logs trong development
4. **Performance**: Tạo indexes cho các trường hay query

---

**Chúc bạn code vui vẻ! 🚀**
