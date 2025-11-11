# API Testing Guide

## Base URL
```
http://localhost:5000/api
```

## Health Check
```bash
curl http://localhost:5000/api/health
```

## 1. Teachers API

### Get all teachers
```bash
curl http://localhost:5000/api/teachers
```

### Get teacher by ID
```bash
curl http://localhost:5000/api/teachers/{teacherId}
```

### Get teacher details (with levels & schedules)
```bash
curl http://localhost:5000/api/teachers/{teacherId}/details
```

### Create teacher
```bash
curl -X POST http://localhost:5000/api/teachers \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Nguyễn Văn A",
    "email": "nguyenvana@example.com",
    "phone": "0123456789",
    "status": "active",
    "maxOffsetClasses": 5
  }'
```

### Update teacher
```bash
curl -X PUT http://localhost:5000/api/teachers/{teacherId} \
  -H "Content-Type: application/json" \
  -d '{
    "maxOffsetClasses": 10
  }'
```

### Add teacher level (trình độ)
```bash
curl -X POST http://localhost:5000/api/teachers/{teacherId}/levels \
  -H "Content-Type: application/json" \
  -d '{
    "subjectLevelId": "{subjectLevelId}",
    "experienceYears": 5,
    "certifications": [
      {
        "name": "TESOL Certificate",
        "issuedDate": "2020-01-15",
        "expiryDate": "2025-01-15"
      }
    ]
  }'
```

### Add fixed schedule (lịch cố định)
```bash
curl -X POST http://localhost:5000/api/teachers/{teacherId}/schedules \
  -H "Content-Type: application/json" \
  -d '{
    "subjectLevelId": "{subjectLevelId}",
    "className": "Math 10A",
    "dayOfWeek": "Monday",
    "startTime": "08:00",
    "endTime": "09:30",
    "meetingLink": "https://zoom.us/j/123456"
  }'
```

## 2. Subjects API

### Get all subjects
```bash
curl http://localhost:5000/api/subjects
```

### Create subject
```bash
curl -X POST http://localhost:5000/api/subjects \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Toán học",
    "code": "MATH",
    "description": "Môn toán học"
  }'
```

### Add subject level
```bash
curl -X POST http://localhost:5000/api/subjects/{subjectId}/levels \
  -H "Content-Type: application/json" \
  -d '{
    "semester": 10,
    "name": "Toán lớp 10",
    "description": "Toán học lớp 10"
  }'
```

## 3. Schedule API (Shifts & WorkShifts)

### Create shift
```bash
curl -X POST http://localhost:5000/api/schedule/shifts \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Ca sáng",
    "startTime": "08:00",
    "endTime": "12:00"
  }'
```

### Get all shifts
```bash
curl http://localhost:5000/api/schedule/shifts
```

### Create work shift (lịch làm việc của giáo viên)
```bash
curl -X POST http://localhost:5000/api/schedule/work-shifts \
  -H "Content-Type: application/json" \
  -d '{
    "teacherId": "{teacherId}",
    "date": "2024-12-20",
    "shiftId": "{shiftId}",
    "isAvailable": true
  }'
```

### Create bulk work shifts
```bash
curl -X POST http://localhost:5000/api/schedule/work-shifts/bulk \
  -H "Content-Type: application/json" \
  -d '{
    "teacherId": "{teacherId}",
    "shifts": [
      {
        "date": "2024-12-20",
        "shiftId": "{shiftId}",
        "isAvailable": true
      },
      {
        "date": "2024-12-21",
        "shiftId": "{shiftId}",
        "isAvailable": true
      }
    ]
  }'
```

### Get teacher availability
```bash
curl "http://localhost:5000/api/schedule/work-shifts/availability?teacherId={teacherId}&date=2024-12-20"
```

## 4. Offset Classes API

### Get all offset classes
```bash
curl http://localhost:5000/api/offset-classes
```

### Get by status
```bash
curl "http://localhost:5000/api/offset-classes?status=pending"
```

### Create offset class (manual)
```bash
curl -X POST http://localhost:5000/api/offset-classes \
  -H "Content-Type: application/json" \
  -d '{
    "subjectLevelId": "{subjectLevelId}",
    "className": "Math 10A Offset",
    "scheduledDate": "2024-12-25",
    "startTime": "14:00",
    "endTime": "15:30",
    "reason": "Giáo viên nghỉ phép"
  }'
```

### Create offset class with auto-assignment
**Đây là tính năng quan trọng nhất - tự động phân bổ giáo viên thông minh**
```bash
curl -X POST http://localhost:5000/api/offset-classes/with-assignment \
  -H "Content-Type: application/json" \
  -d '{
    "subjectLevelId": "{subjectLevelId}",
    "className": "Math 10A Offset",
    "scheduledDate": "2024-12-25",
    "startTime": "14:00",
    "endTime": "15:30",
    "reason": "Giáo viên nghỉ phép"
  }'
```

### Create bulk offset classes with auto-assignment
```bash
curl -X POST http://localhost:5000/api/offset-classes/bulk \
  -H "Content-Type: application/json" \
  -d '{
    "offsetClasses": [
      {
        "subjectLevelId": "{subjectLevelId}",
        "className": "Math 10A Offset",
        "scheduledDate": "2024-12-25",
        "startTime": "14:00",
        "endTime": "15:30",
        "reason": "Giáo viên nghỉ phép"
      },
      {
        "subjectLevelId": "{subjectLevelId}",
        "className": "Math 10B Offset",
        "scheduledDate": "2024-12-25",
        "startTime": "16:00",
        "endTime": "17:30",
        "reason": "Giáo viên nghỉ phép"
      }
    ]
  }'
```

### Auto-assign teacher to existing offset class
```bash
curl -X POST http://localhost:5000/api/offset-classes/{offsetClassId}/auto-assign \
  -H "Content-Type: application/json"
```

### Reallocate teacher (assign different teacher)
```bash
curl -X POST http://localhost:5000/api/offset-classes/{offsetClassId}/reallocate \
  -H "Content-Type: application/json"
```

### Mark as completed
```bash
curl -X PATCH http://localhost:5000/api/offset-classes/{offsetClassId}/complete \
  -H "Content-Type: application/json"
```

### Cancel offset class
```bash
curl -X PATCH http://localhost:5000/api/offset-classes/{offsetClassId}/cancel \
  -H "Content-Type: application/json" \
  -d '{
    "reason": "Lớp đã được hoãn"
  }'
```

## Complete Workflow Example

### 1. Setup: Create basic data
```bash
# Create subject
SUBJECT_ID=$(curl -X POST http://localhost:5000/api/subjects \
  -H "Content-Type: application/json" \
  -d '{"name":"Toán học","code":"MATH"}' \
  | jq -r '.data._id')

# Create subject level
SUBJECT_LEVEL_ID=$(curl -X POST http://localhost:5000/api/subjects/$SUBJECT_ID/levels \
  -H "Content-Type: application/json" \
  -d '{"semester":10,"name":"Toán lớp 10"}' \
  | jq -r '.data._id')

# Create shift
SHIFT_ID=$(curl -X POST http://localhost:5000/api/schedule/shifts \
  -H "Content-Type: application/json" \
  -d '{"name":"Ca chiều","startTime":"14:00","endTime":"18:00"}' \
  | jq -r '.data._id')

# Create teacher
TEACHER_ID=$(curl -X POST http://localhost:5000/api/teachers \
  -H "Content-Type: application/json" \
  -d '{"name":"Nguyễn Văn A","email":"teacher1@example.com","maxOffsetClasses":5}' \
  | jq -r '.data._id')

# Add teacher level
curl -X POST http://localhost:5000/api/teachers/$TEACHER_ID/levels \
  -H "Content-Type: application/json" \
  -d "{\"subjectLevelId\":\"$SUBJECT_LEVEL_ID\",\"experienceYears\":5}"

# Add work shift for teacher
curl -X POST http://localhost:5000/api/schedule/work-shifts \
  -H "Content-Type: application/json" \
  -d "{\"teacherId\":\"$TEACHER_ID\",\"date\":\"2024-12-25\",\"shiftId\":\"$SHIFT_ID\",\"isAvailable\":true}"
```

### 2. Create offset class with auto-assignment
```bash
curl -X POST http://localhost:5000/api/offset-classes/with-assignment \
  -H "Content-Type: application/json" \
  -d "{
    \"subjectLevelId\":\"$SUBJECT_LEVEL_ID\",
    \"className\":\"Math 10A Offset\",
    \"scheduledDate\":\"2024-12-25\",
    \"startTime\":\"14:00\",
    \"endTime\":\"15:30\",
    \"reason\":\"Teacher on leave\"
  }"
```

## Testing with Postman

Import this collection or manually create requests with:

**Base URL**: `http://localhost:5000/api`

**Headers**:
- Content-Type: application/json

**Environment Variables**:
- BASE_URL: http://localhost:5000/api
- TEACHER_ID: (set after creating teacher)
- SUBJECT_ID: (set after creating subject)
- OFFSET_CLASS_ID: (set after creating offset class)

## Power Automate Integration Test

Sau khi setup Power Automate webhook, test bằng cách:

1. Tạo offset class với auto-assignment
2. Giáo viên sẽ nhận email thông báo
3. Kiểm tra email đã được gửi chưa

## Notes

- Tất cả API trả về format:
  ```json
  {
    "success": true,
    "data": {...},
    "message": "..."
  }
  ```

- Error format:
  ```json
  {
    "success": false,
    "message": "Error description",
    "error": "..."
  }
  ```

- Pagination (cho các GET list APIs):
  ```json
  {
    "success": true,
    "data": [...],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 50,
      "pages": 5
    }
  }
  ```
