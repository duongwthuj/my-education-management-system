# Education Management System - Backend API

Backend API cho hệ thống quản lý giáo viên, môn học, lớp học và lịch giảng dạy.

## 🛠️ Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB
- **ODM**: Mongoose
- **Language**: TypeScript

## 📋 Prerequisites

- Node.js >= 18
- MongoDB >= 6.0 (local hoặc MongoDB Atlas)
- npm hoặc yarn

## 🚀 Installation

### 1. Clone và cài đặt dependencies

```bash
cd my-education-management-system-backend
npm install
```

### 2. Cấu hình Environment Variables

Copy file `.env.example` thành `.env`:

```bash
cp .env.example .env
```

Cập nhật các biến trong file `.env`:

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/education-management
FRONTEND_URL=http://localhost:3000
```

### 3. Khởi động MongoDB

**Option A: MongoDB Local**
```bash
# macOS (với Homebrew)
brew services start mongodb-community

# Linux
sudo systemctl start mongod

# Windows
net start MongoDB
```

**Option B: MongoDB Atlas (Cloud)**
- Tạo cluster tại [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
- Lấy connection string và cập nhật vào `MONGODB_URI`

### 4. Seed Database (Tùy chọn)

Import dữ liệu mẫu vào database:

```bash
npm run seed
```

### 5. Khởi động Development Server

```bash
npm run dev
```

Server sẽ chạy tại: `http://localhost:5000`

## 📁 Project Structure

```
src/
├── config/          # Configuration files
│   └── database.ts  # MongoDB connection
├── models/          # Mongoose models
│   ├── Teacher.ts
│   ├── Subject.ts
│   ├── Class.ts
│   ├── Schedule.ts
│   └── index.ts
├── routes/          # API routes
│   ├── teachers.ts
│   ├── subjects.ts
│   ├── classes.ts
│   ├── schedules.ts
│   └── index.ts
├── scripts/         # Utility scripts
│   └── seed.ts      # Database seeding
├── types/           # TypeScript types
│   └── index.ts
└── server.ts        # Entry point
```

## 📡 API Endpoints

### Health Check
```http
GET /api/health
```

### Teachers (Giáo viên)
```http
GET    /api/teachers          # Danh sách giáo viên
GET    /api/teachers/:id      # Chi tiết giáo viên
POST   /api/teachers          # Tạo giáo viên mới
PUT    /api/teachers/:id      # Cập nhật giáo viên
DELETE /api/teachers/:id      # Xóa giáo viên
```

**Query Parameters** (GET /api/teachers):
- `page`: Số trang (default: 1)
- `limit`: Số items/trang (default: 10)
- `status`: Filter theo trạng thái (active, on-leave, inactive)
- `search`: Tìm kiếm theo tên, email, phone

**Example Request**:
```bash
curl http://localhost:5000/api/teachers?page=1&limit=10&status=active
```

### Subjects (Môn học)
```http
GET    /api/subjects          # Danh sách môn học
GET    /api/subjects/:id      # Chi tiết môn học
POST   /api/subjects          # Tạo môn học mới
PUT    /api/subjects/:id      # Cập nhật môn học
DELETE /api/subjects/:id      # Xóa môn học
```

**Query Parameters**:
- `page`, `limit`: Pagination
- `category`: Filter theo danh mục
- `level`: Filter theo cấp độ (beginner, intermediate, advanced)
- `search`: Tìm kiếm theo tên, code, description

### Classes (Lớp học)
```http
GET    /api/classes           # Danh sách lớp học
GET    /api/classes/:id       # Chi tiết lớp học
POST   /api/classes           # Tạo lớp học mới
PUT    /api/classes/:id       # Cập nhật lớp học
DELETE /api/classes/:id       # Xóa lớp học
```

**Query Parameters**:
- `page`, `limit`: Pagination
- `status`: Filter theo trạng thái
- `teacherId`: Filter theo giáo viên
- `subjectId`: Filter theo môn học

### Schedules (Lịch học)
```http
GET    /api/schedules         # Danh sách lịch học
GET    /api/schedules/:id     # Chi tiết lịch học
POST   /api/schedules         # Tạo lịch học mới
PUT    /api/schedules/:id     # Cập nhật lịch học
DELETE /api/schedules/:id     # Xóa lịch học
```

**Query Parameters**:
- `page`, `limit`: Pagination
- `teacherId`: Filter theo giáo viên
- `subjectId`: Filter theo môn học
- `dayOfWeek`: Filter theo ngày trong tuần
- `status`: Filter theo trạng thái

## 🔧 Available Scripts

```bash
npm run dev      # Chạy development server với nodemon
npm run build    # Build production
npm start        # Chạy production server
npm run seed     # Seed database với sample data
```

## 📝 API Response Format

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "message": "Optional success message",
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "totalPages": 10
  }
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error message"
}
```

## 🔐 CORS Configuration

Backend được cấu hình để chấp nhận requests từ Frontend:
- Default: `http://localhost:3000`
- Có thể thay đổi trong `.env` với `FRONTEND_URL`

## 🐛 Debugging

Xem logs trong console:
- MongoDB connection status
- API request logs
- Error messages

## 📚 Models Schema

### Teacher
```typescript
{
  name: string;
  email: string; // unique
  phone: string;
  avatar?: string;
  address: string;
  joinDate: string;
  status: 'active' | 'on-leave' | 'inactive';
  education: string;
  bio: string;
  subjects: ObjectId[]; // ref: Subject
}
```

### Subject
```typescript
{
  name: string;
  code: string; // unique
  description: string;
  category: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  teachers: ObjectId[]; // ref: Teacher
}
```

### Class
```typescript
{
  name: string;
  subjectId: ObjectId; // ref: Subject
  startDate: string;
  endDate: string;
  studentsCount: number;
  status: 'pending' | 'active' | 'completed';
  teacherId?: ObjectId; // ref: Teacher
  description: string;
  location: string;
}
```

### Schedule
```typescript
{
  teacherId: ObjectId; // ref: Teacher
  subjectId: ObjectId; // ref: Subject
  dayOfWeek: string; // Thứ 2, Thứ 3, ...
  startTime: string;
  endTime: string;
  room: string;
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
}
```

## 🚧 Roadmap

- [ ] Authentication & Authorization (JWT)
- [ ] Upload avatar cho Teachers
- [ ] Validation middleware
- [ ] Rate limiting
- [ ] API documentation (Swagger)
- [ ] Unit tests
- [ ] Docker support

## 📞 Support

Nếu gặp vấn đề, vui lòng kiểm tra:
1. MongoDB đang chạy
2. Environment variables đúng
3. Port 5000 không bị chiếm dụng
4. Dependencies đã được cài đặt đầy đủ

---

**Created with ❤️ by Claude Code Assistant**
