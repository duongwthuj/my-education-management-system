# Hướng dẫn Import và Tạo Lịch Giáo Viên (Cập nhật)

## Tổng quan

Hệ thống quản lý lịch giáo viên gồm 4 bước:

1. **Teach (Lớp cố định)**: Phân công dạy cố định của giáo viên (môn gì, lớp nào, ngày nào, ca nào)
2. **WorkSchedule (Lịch làm việc/Shift)**: Ca làm việc của giáo viên (Sáng/Chiều/Tối)
3. **TeachingSchedule (Lịch dạy)**: Tự động tạo từ Teach + WorkSchedule
4. **FreeSchedule (Lịch trống)**: Tự động tính toán thời gian rảnh

## Quy trình sử dụng MỚI

### Bước 1: Import Lớp Cố Định (Teach)

**Vào trang "Giáo viên" → Click "Import Lớp Cố Định"**

Đây là bước quan trọng nhất - định nghĩa giáo viên dạy gì, lớp nào, ngày nào, ca nào.

#### Định dạng JSON cho Teach

```json
[
  {
    "teacherEmail": "nguyenvana@school.com",
    "subjectCode": "MATH101",
    "className": "10A1",
    "dayOfWeek": "Thứ 2",
    "startTime": "08:00",
    "endTime": "09:30"
  },
  {
    "teacherName": "Trần Văn B",
    "subjectName": "Vật lý",
    "className": "10A2",
    "dayOfWeek": "Thứ 3",
    "startTime": "14:00",
    "endTime": "15:30",
    "notes": "Lớp chuyên"
  }
]
```

#### Các trường bắt buộc (Teach)

- **teacherEmail** hoặc **teacherName**: Giáo viên
- **subjectCode** hoặc **subjectName**: Môn học
- **className**: Tên lớp cố định (VD: 10A1, 11B2, 12A3)
 - **className**: Tên lớp cố định (VD: 10A1, 11B2, 12A3)
 - **classType**: `fixed` hoặc `session`. Mặc định là `fixed`.
   - Nếu `classType` = `fixed`: bạn có thể cung cấp `className` (hoặc bỏ trống) — hệ thống hiểu đây là lớp cố định.
   - Nếu `classType` = `session`: bạn phải cung cấp `classId` (ObjectId) trỏ tới một document trong collection `classes` — đây là các lớp chỉ có 1 buổi.
- **dayOfWeek**: `Thứ 2`, `Thứ 3`, ..., `Chủ nhật`
- **startTime**: Giờ bắt đầu (format: `HH:mm`, ví dụ: `08:00`)
- **endTime**: Giờ kết thúc (format: `HH:mm`, ví dụ: `09:30`)

#### Các trường tùy chọn (Teach)

- **notes**: Ghi chú

> **Lưu ý**: 
> - Tất cả các lớp đều là lớp online nên không cần field `room`. Hệ thống tự động set room = "Online".
> - `startTime` và `endTime` phải nằm trong khung giờ của WorkSchedule (ca làm việc) để được tạo thành TeachingSchedule.

### Bước 2: Import Lịch Làm Việc (WorkSchedule/Shift)

**Vào trang "Lịch làm việc giáo viên" → Click "Import JSON"**

Import ca làm việc của giáo viên (khung giờ làm việc).

#### Định dạng JSON cho WorkSchedule

```json
[
  {
    "teacherEmail": "nguyenvana@school.com",
    "dayOfWeek": "Thứ 2",
    "shift": "Sáng",
    "startTime": "08:00",
    "endTime": "12:00",
    "duration": 4
  }
]
```

### Bước 3: Tạo Lịch Dạy + Lịch Trống (TỰ ĐỘNG)

**Click nút "Tạo lịch dạy & lịch trống"**

Hệ thống sẽ:
1. Lấy tất cả **Teach** (lớp cố định với thời gian cụ thể)
2. Lấy tất cả **WorkSchedule** (ca làm việc)
3. Khớp Teach với WorkSchedule (cùng teacher, dayOfWeek, và thời gian nằm trong ca làm)
4. Tạo **TeachingSchedule** với thời gian từ Teach
5. Tính toán khoảng trống → tạo **FreeSchedule**

#### Ví dụ tính toán

**Teach (Lớp cố định):**
- Thứ 2: 08:00-09:30 (Toán - 10A1)
- Thứ 2: 10:00-11:30 (Lý - 10A2)

**WorkSchedule (Ca làm):**
- Thứ 2, Sáng: 08:00-12:00

**Kết quả tự động:**
- **TeachingSchedule:**
  - 08:00-09:30: Toán - 10A1
  - 10:00-11:30: Lý - 10A2
- **FreeSchedule:**
  - 09:30-10:00: Lịch trống (30 phút)
  - 11:30-12:00: Lịch trống (30 phút)

#### Ví dụ tính toán lịch trống

**WorkSchedule:**
- Ca Sáng: 08:00 - 12:00

**TeachingSchedule:**
- Buổi 1: 08:30 - 10:00 (Toán)
- Buổi 2: 10:30 - 12:00 (Lý)

**FreeSchedule (tự động tạo):**
- 08:00 - 08:30 (30 phút trống trước buổi 1)
- 10:00 - 10:30 (30 phút trống giữa 2 buổi)

## API Endpoints

### Import WorkSchedules

```http
POST /api/import-schedules/work-schedules
Content-Type: application/json

{
  "schedules": [
    {
      "teacherEmail": "teacher@example.com",
      "dayOfWeek": "Thứ 2",
      "shift": "Sáng",
      "startTime": "08:00",
      "endTime": "12:00",
      "duration": 4
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Import hoàn tất: 10 thành công, 2 thất bại",
  "data": {
    "success": [...],
    "failed": [...],
    "total": 12
  }
}
```

### Generate Teaching & Free Schedules

```http
POST /api/import-schedules/generate-teaching-and-free
Content-Type: application/json

{
  "teacherId": "676012345abcdef" // Optional - omit để xử lý tất cả giáo viên
}
```

**Response:**
```json
{
  "success": true,
  "message": "Tạo lịch dạy và lịch trống thành công",
  "data": {
    "workSchedulesProcessed": 15,
    "teachingSchedulesGenerated": 30,
    "freeSchedulesGenerated": 25
  }
}
```

## Lưu ý

### ⚠️ Import WorkSchedule
- Không cho phép import trùng (cùng giáo viên, ngày, ca)
- Giáo viên phải tồn tại trong database trước
- Format thời gian phải đúng `HH:mm`

### ⚠️ Generate Free Schedules
- Sẽ **XÓA** tất cả FreeSchedule cũ của giáo viên và tạo lại
- Chỉ tạo FreeSchedule cho những WorkSchedule đã có trong DB
- TeachingSchedule phải nằm trong khung giờ của WorkSchedule

### 💡 Best Practices

1. **Import theo thứ tự:**
   - Trước tiên: Import WorkSchedule
   - Sau đó: Thêm TeachingSchedule thủ công
   - Cuối cùng: Generate FreeSchedule

2. **Kiểm tra dữ liệu:**
   - Đảm bảo giáo viên đã tồn tại
   - Kiểm tra format JSON trước khi import
   - Xem log kết quả import để fix lỗi

3. **Backup:**
   - Nên export dữ liệu cũ trước khi import hàng loạt
   - Test với ít dữ liệu trước

## Ví dụ JSON đầy đủ

```json
[
  {
    "teacherEmail": "nguyenvana@school.com",
    "dayOfWeek": "Thứ 2",
    "shift": "Sáng",
    "startTime": "08:00",
    "endTime": "12:00",
    "duration": 4,
    "status": "scheduled",
    "notes": "Ca sáng thứ 2"
  },
  {
    "teacherEmail": "nguyenvana@school.com",
    "dayOfWeek": "Thứ 2",
    "shift": "Chiều",
    "startTime": "14:00",
    "endTime": "18:00",
    "duration": 4,
    "status": "scheduled",
    "notes": "Ca chiều thứ 2"
  },
  {
    "teacherEmail": "tranvanb@school.com",
    "dayOfWeek": "Thứ 3",
    "shift": "Sáng",
    "startTime": "08:00",
    "endTime": "12:00",
    "duration": 4
  },
  {
    "teacherName": "Lê Thị C",
    "dayOfWeek": "Thứ 4",
    "shift": "Tối",
    "startTime": "18:30",
    "endTime": "21:30",
    "duration": 3,
    "status": "scheduled"
  }
]
```

## Troubleshooting

### Lỗi: "Không tìm thấy giáo viên"
- Kiểm tra teacherEmail hoặc teacherName có đúng không
- Đảm bảo giáo viên đã được tạo trong hệ thống

### Lỗi: "Lịch làm việc đã tồn tại"
- Kiểm tra DB, xóa lịch cũ nếu cần
- Hoặc skip record này trong file JSON

### Lỗi: "Định dạng giờ không hợp lệ"
- Sử dụng format `HH:mm` (ví dụ: `08:00`, `14:30`)
- Không dùng `8:00` hay `8h00`

### Không tạo được FreeSchedule
- Kiểm tra đã có WorkSchedule chưa
- Đảm bảo TeachingSchedule nằm trong khung giờ WorkSchedule
