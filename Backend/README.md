# LMS Backend - Hệ thống quản lý lớp học

Backend API cho hệ thống quản lý giáo viên, môn học, công ca và lớp offset.

## Tính năng chính

### 1. Quản lý Giáo viên (Teacher Management)
- CRUD giáo viên
- Quản lý trình độ giảng dạy (TeacherLevel)
- Quản lý lịch cố định (FixedSchedule)
- Giới hạn số lượng lớp offset (maxOffsetClasses)

### 2. Quản lý Môn học (Subject Management)
- CRUD môn học
- Quản lý cấp độ môn học theo học kỳ (SubjectLevel)

### 3. Quản lý Công ca (Shift Schedule Management)
- CRUD ca làm việc (Shift)
- Quản lý lịch làm việc giáo viên (WorkShift)
- Kiểm tra availability của giáo viên

### 4. Quản lý Lớp Offset (Offset Class Management)
- CRUD lớp offset
- **Tự động phân bổ giáo viên thông minh**:
  - Ưu tiên 1: Lịch làm việc (50%)
  - Ưu tiên 2: Trình độ (30%)
  - Ưu tiên 3: Cân bằng số lớp (20%)
- Tái phân bổ khi giáo viên không khả dụng
- Tích hợp gửi email thông báo qua Power Automate

## Cài đặt

### 1. Clone và cài đặt dependencies
```bash
cd Backend
npm install axios
```

### 2. Cấu hình môi trường
```bash
cp .env.example .env
```

Chỉnh sửa file `.env`:
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/lms_database
POWER_AUTOMATE_WEBHOOK_URL=your_webhook_url_here
```

### 3. Khởi động MongoDB
Đảm bảo MongoDB đang chạy trên máy hoặc sử dụng MongoDB Atlas.

### 4. Chạy server
```bash
# Development
npm run dev

# Production
npm start
```

## Cấu trúc API

### Teachers API
```
GET    /api/teachers                    # Lấy danh sách giáo viên
GET    /api/teachers/:id                # Lấy thông tin giáo viên
GET    /api/teachers/:id/details        # Lấy chi tiết đầy đủ
POST   /api/teachers                    # Tạo giáo viên mới
PUT    /api/teachers/:id                # Cập nhật giáo viên
DELETE /api/teachers/:id                # Xóa giáo viên

# Teacher Levels
POST   /api/teachers/:id/levels         # Thêm trình độ
PUT    /api/teachers/:id/levels/:levelId    # Cập nhật trình độ
DELETE /api/teachers/:id/levels/:levelId    # Xóa trình độ

# Fixed Schedules
POST   /api/teachers/:id/schedules      # Thêm lịch cố định
PUT    /api/teachers/:id/schedules/:scheduleId   # Cập nhật lịch
DELETE /api/teachers/:id/schedules/:scheduleId   # Xóa lịch
```

### Subjects API
```
GET    /api/subjects                    # Lấy danh sách môn học
GET    /api/subjects/:id                # Lấy thông tin môn học
GET    /api/subjects/:id/levels         # Lấy môn học với các level
POST   /api/subjects                    # Tạo môn học mới
PUT    /api/subjects/:id                # Cập nhật môn học
DELETE /api/subjects/:id                # Xóa môn học

# Subject Levels
POST   /api/subjects/:id/levels         # Thêm level
PUT    /api/subjects/:id/levels/:levelId    # Cập nhật level
DELETE /api/subjects/:id/levels/:levelId    # Xóa level
```

### Schedule API (Shifts & WorkShifts)
```
# Shifts
GET    /api/schedule/shifts             # Lấy danh sách ca
GET    /api/schedule/shifts/:id         # Lấy thông tin ca
POST   /api/schedule/shifts             # Tạo ca mới
PUT    /api/schedule/shifts/:id         # Cập nhật ca
DELETE /api/schedule/shifts/:id         # Xóa ca

# WorkShifts
GET    /api/schedule/work-shifts        # Lấy lịch làm việc
GET    /api/schedule/work-shifts/availability  # Kiểm tra availability
POST   /api/schedule/work-shifts        # Tạo lịch làm việc
POST   /api/schedule/work-shifts/bulk   # Tạo nhiều lịch cùng lúc
PUT    /api/schedule/work-shifts/:id    # Cập nhật lịch
DELETE /api/schedule/work-shifts/:id    # Xóa lịch
DELETE /api/schedule/work-shifts/bulk/delete  # Xóa nhiều lịch
```

### Offset Classes API
```
GET    /api/offset-classes              # Lấy danh sách lớp offset
GET    /api/offset-classes/:id          # Lấy thông tin lớp offset
POST   /api/offset-classes              # Tạo lớp offset
POST   /api/offset-classes/with-assignment  # Tạo + tự động phân bổ
POST   /api/offset-classes/bulk         # Tạo nhiều lớp + tự động phân bổ
PUT    /api/offset-classes/:id          # Cập nhật lớp offset
DELETE /api/offset-classes/:id          # Xóa lớp offset

# Auto-assignment
POST   /api/offset-classes/:id/auto-assign   # Tự động phân bổ giáo viên
POST   /api/offset-classes/:id/reallocate    # Tái phân bổ giáo viên

# Status management
PATCH  /api/offset-classes/:id/complete      # Đánh dấu hoàn thành
PATCH  /api/offset-classes/:id/cancel        # Hủy lớp
```

## Thuật toán phân bổ lớp offset

### Cách hoạt động
1. **Tìm giáo viên có trình độ phù hợp**: Lấy danh sách giáo viên dạy môn học và cấp độ tương ứng
2. **Tính điểm cho mỗi giáo viên** dựa trên 3 yếu tố:

#### a. Lịch làm việc (50%)
- Kiểm tra giáo viên có ca làm việc trong ngày không
- Kiểm tra thời gian lớp offset có nằm trong ca làm việc không
- Kiểm tra xung đột với lịch cố định
- Kiểm tra xung đột với lớp offset khác đã được phân công
- **Điểm**: 0 (không khả dụng) hoặc 100 (khả dụng)

#### b. Trình độ (30%)
- Dựa trên số năm kinh nghiệm
- **Điểm**: `experienceYears * 10` (tối đa 100)

#### c. Cân bằng số lớp (20%)
- Ưu tiên giáo viên có ít lớp offset hơn
- Kiểm tra không vượt quá `maxOffsetClasses`
- **Điểm**: Phần trăm slot còn lại (0-100)

3. **Chọn giáo viên có điểm cao nhất**

### Ví dụ
```javascript
// Teacher A: experienceYears=5, currentOffset=2, maxOffset=10, có lịch rảnh
scoreA = (100 * 0.5) + (50 * 0.3) + (80 * 0.2) = 81

// Teacher B: experienceYears=8, currentOffset=1, maxOffset=10, có lịch rảnh
scoreB = (100 * 0.5) + (80 * 0.3) + (90 * 0.2) = 92

=> Chọn Teacher B
```

## Tích hợp Power Automate

### Bước 1: Tạo Flow trong Power Automate
1. Đăng nhập [Power Automate](https://make.powerautomate.com)
2. Tạo flow mới
3. Chọn trigger: **"When a HTTP request is received"**
4. Thiết lập JSON schema:
```json
{
    "type": "object",
    "properties": {
        "recipientEmail": { "type": "string" },
        "subject": { "type": "string" },
        "emailType": { "type": "string" },
        "data": {
            "type": "object",
            "properties": {
                "message": { "type": "string" }
            }
        }
    }
}
```
5. Thêm action: **"Send an email (V2)"**
   - To: `recipientEmail`
   - Subject: `subject`
   - Body: `data.message`
6. Lưu flow và copy HTTP POST URL
7. Paste URL vào `.env` → `POWER_AUTOMATE_WEBHOOK_URL`

### Bước 2: Test webhook
```bash
# Sử dụng endpoint test (tạo sau nếu cần)
POST /api/test/email
```

## Database Schema

### Teacher
```javascript
{
  name: String,
  email: String (unique),
  phone: String,
  address: String,
  dateOfBirth: Date,
  status: ['active', 'inactive', 'on_leave'],
  qualifications: [{ degree, institution, year }],
  bio: String,
  maxOffsetClasses: Number  // Số lớp offset tối đa
}
```

### TeacherLevel
```javascript
{
  teacherId: ObjectId (ref: Teacher),
  subjectLevelId: ObjectId (ref: SubjectLevel),
  experienceYears: Number,
  certifications: [{ name, issuedDate, expiryDate }],
  isActive: Boolean
}
```

### Subject
```javascript
{
  name: String (unique),
  code: String (unique),
  description: String,
  isActive: Boolean
}
```

### SubjectLevel
```javascript
{
  subjectId: ObjectId (ref: Subject),
  semester: Number (1-12),
  name: String,
  description: String,
  isActive: Boolean
}
```

### Shift
```javascript
{
  name: String (unique),  // "Ca sáng", "Ca chiều", "Ca tối"
  startTime: String,      // "HH:mm"
  endTime: String,        // "HH:mm"
  description: String,
  isActive: Boolean
}
```

### WorkShift
```javascript
{
  teacherId: ObjectId (ref: Teacher),
  date: Date,
  shiftId: ObjectId (ref: Shift),
  isAvailable: Boolean,
  notes: String
}
```

### FixedSchedule
```javascript
{
  teacherId: ObjectId (ref: Teacher),
  subjectLevelId: ObjectId (ref: SubjectLevel),
  className: String,
  dayOfWeek: ['Monday', 'Tuesday', ...],
  startTime: String,
  endTime: String,
  meetingLink: String,
  isActive: Boolean,
  notes: String
}
```

### OffsetClass
```javascript
{
  subjectLevelId: ObjectId (ref: SubjectLevel),
  assignedTeacherId: ObjectId (ref: Teacher),
  className: String,
  scheduledDate: Date,
  startTime: String,
  endTime: String,
  meetingLink: String,
  status: ['pending', 'assigned', 'completed', 'cancelled'],
  reason: String,
  originalClassId: ObjectId (ref: FixedSchedule),
  notes: String
}
```

## Development

### Code structure
```
Backend/
├── src/
│   ├── config/           # Database configuration
│   ├── controllers/      # Request handlers
│   ├── models/          # Mongoose schemas
│   ├── routes/          # API routes
│   ├── services/        # Business logic
│   ├── middlewares/     # Express middlewares
│   └── app.js           # Express app setup
├── server.js            # Entry point
├── .env.example         # Environment template
└── package.json
```

### Best practices
1. Luôn validate input data
2. Handle errors properly
3. Log important events
4. Use transactions khi cần thiết
5. Test API endpoints trước khi deploy

## Troubleshooting

### MongoDB connection failed
- Kiểm tra MongoDB đang chạy
- Kiểm tra `MONGODB_URI` trong `.env`
- Kiểm tra firewall/network

### Power Automate không gửi email
- Kiểm tra `POWER_AUTOMATE_WEBHOOK_URL` đúng
- Kiểm tra flow đang active
- Xem logs trong Power Automate

### Không tìm thấy giáo viên phù hợp
- Kiểm tra giáo viên có trình độ tương ứng
- Kiểm tra WorkShift của giáo viên
- Kiểm tra `maxOffsetClasses` chưa đạt giới hạn
- Kiểm tra không có conflict với FixedSchedule

## License
MIT
