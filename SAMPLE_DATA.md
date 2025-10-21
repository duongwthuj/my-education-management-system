# Sample Data for MongoDB Import

Dữ liệu mẫu để import vào MongoDB Mongoose.

## Cách Import

### Cách 1: Dùng Seed Script (Khuyến nghị)
```bash
cd Backend
npm run seed
```

### Cách 2: Import JSON trực tiếp
```bash
mongoimport --uri "mongodb+srv://username:password@cluster.mongodb.net/education-management" --collection teachers --type json --file sample-data.json
```

---

## Sample Data - Teachers (Giáo Viên)

```json
[
  {
    "_id": "507f1f77bcf86cd799439011",
    "name": "Nguyễn Văn A",
    "email": "nguyenvana@school.edu.vn",
    "phone": "0912345678",
    "department": "Mathematics",
    "expertise": ["Đại số", "Hình học"],
    "available_shifts": ["8:00-10:00", "14:00-16:00"],
    "created_at": "2025-01-01T10:00:00Z",
    "updated_at": "2025-01-01T10:00:00Z"
  },
  {
    "_id": "507f1f77bcf86cd799439012",
    "name": "Trần Thị B",
    "email": "tranthib@school.edu.vn",
    "phone": "0987654321",
    "department": "English",
    "expertise": ["Tiếng Anh giao tiếp", "TOEIC"],
    "available_shifts": ["10:00-12:00", "14:00-16:00"],
    "created_at": "2025-01-01T10:00:00Z",
    "updated_at": "2025-01-01T10:00:00Z"
  },
  {
    "_id": "507f1f77bcf86cd799439013",
    "name": "Lê Văn C",
    "email": "levanc@school.edu.vn",
    "phone": "0912111111",
    "department": "Physics",
    "expertise": ["Cơ học", "Điện từ học"],
    "available_shifts": ["8:00-10:00", "10:00-12:00"],
    "created_at": "2025-01-01T10:00:00Z",
    "updated_at": "2025-01-01T10:00:00Z"
  },
  {
    "_id": "507f1f77bcf86cd799439014",
    "name": "Phạm Thị D",
    "email": "phamthid@school.edu.vn",
    "phone": "0933333333",
    "department": "Chemistry",
    "expertise": ["Hóa học hữu cơ", "Hóa học vô cơ"],
    "available_shifts": ["14:00-16:00"],
    "created_at": "2025-01-01T10:00:00Z",
    "updated_at": "2025-01-01T10:00:00Z"
  },
  {
    "_id": "507f1f77bcf86cd799439015",
    "name": "Hoàng Văn E",
    "email": "hoangvane@school.edu.vn",
    "phone": "0944444444",
    "department": "Biology",
    "expertise": ["Sinh học tế bào", "Di truyền học"],
    "available_shifts": ["10:00-12:00", "16:00-18:00"],
    "created_at": "2025-01-01T10:00:00Z",
    "updated_at": "2025-01-01T10:00:00Z"
  }
]
```

---

## Sample Data - Subjects (Môn Học)

```json
[
  {
    "_id": "607f1f77bcf86cd799439101",
    "name": "Toán 10",
    "code": "MATH10",
    "description": "Toán lớp 10",
    "credits": 3,
    "max_students": 40,
    "teachers": ["507f1f77bcf86cd799439011"],
    "prerequisites": [],
    "created_at": "2025-01-01T10:00:00Z",
    "updated_at": "2025-01-01T10:00:00Z"
  },
  {
    "_id": "607f1f77bcf86cd799439102",
    "name": "Tiếng Anh 10",
    "code": "ENG10",
    "description": "Tiếng Anh lớp 10",
    "credits": 2,
    "max_students": 40,
    "teachers": ["507f1f77bcf86cd799439012"],
    "prerequisites": [],
    "created_at": "2025-01-01T10:00:00Z",
    "updated_at": "2025-01-01T10:00:00Z"
  },
  {
    "_id": "607f1f77bcf86cd799439103",
    "name": "Vật Lý 10",
    "code": "PHY10",
    "description": "Vật lý lớp 10",
    "credits": 3,
    "max_students": 35,
    "teachers": ["507f1f77bcf86cd799439013"],
    "prerequisites": [],
    "created_at": "2025-01-01T10:00:00Z",
    "updated_at": "2025-01-01T10:00:00Z"
  },
  {
    "_id": "607f1f77bcf86cd799439104",
    "name": "Hóa Học 10",
    "code": "CHEM10",
    "description": "Hóa học lớp 10",
    "credits": 3,
    "max_students": 35,
    "teachers": ["507f1f77bcf86cd799439014"],
    "prerequisites": [],
    "created_at": "2025-01-01T10:00:00Z",
    "updated_at": "2025-01-01T10:00:00Z"
  },
  {
    "_id": "607f1f77bcf86cd799439105",
    "name": "Sinh Học 10",
    "code": "BIO10",
    "description": "Sinh học lớp 10",
    "credits": 2,
    "max_students": 40,
    "teachers": ["507f1f77bcf86cd799439015"],
    "prerequisites": [],
    "created_at": "2025-01-01T10:00:00Z",
    "updated_at": "2025-01-01T10:00:00Z"
  }
]
```

---

## Sample Data - Classes (Lớp Học)

```json
[
  {
    "_id": "707f1f77bcf86cd799439201",
    "name": "10A1",
    "grade": 10,
    "section": "A1",
    "max_students": 40,
    "current_students": 38,
    "room": "A101",
    "created_at": "2025-01-01T10:00:00Z",
    "updated_at": "2025-01-01T10:00:00Z"
  },
  {
    "_id": "707f1f77bcf86cd799439202",
    "name": "10A2",
    "grade": 10,
    "section": "A2",
    "max_students": 40,
    "current_students": 39,
    "room": "A102",
    "created_at": "2025-01-01T10:00:00Z",
    "updated_at": "2025-01-01T10:00:00Z"
  },
  {
    "_id": "707f1f77bcf86cd799439203",
    "name": "10B1",
    "grade": 10,
    "section": "B1",
    "max_students": 35,
    "current_students": 34,
    "room": "B101",
    "created_at": "2025-01-01T10:00:00Z",
    "updated_at": "2025-01-01T10:00:00Z"
  },
  {
    "_id": "707f1f77bcf86cd799439204",
    "name": "10B2",
    "grade": 10,
    "section": "B2",
    "max_students": 35,
    "current_students": 33,
    "room": "B102",
    "created_at": "2025-01-01T10:00:00Z",
    "updated_at": "2025-01-01T10:00:00Z"
  },
  {
    "_id": "707f1f77bcf86cd799439205",
    "name": "10C1",
    "grade": 10,
    "section": "C1",
    "max_students": 40,
    "current_students": 40,
    "room": "C101",
    "created_at": "2025-01-01T10:00:00Z",
    "updated_at": "2025-01-01T10:00:00Z"
  }
]
```

---

## Sample Data - Schedules (Lịch Học)

```json
[
  {
    "_id": "807f1f77bcf86cd799439301",
    "class_id": "707f1f77bcf86cd799439201",
    "subject_id": "607f1f77bcf86cd799439101",
    "teacher_id": "507f1f77bcf86cd799439011",
    "day_of_week": "Monday",
    "start_time": "08:00",
    "end_time": "09:30",
    "room": "A101",
    "week": 1,
    "semester": 1,
    "year": 2025,
    "status": "active",
    "created_at": "2025-01-01T10:00:00Z",
    "updated_at": "2025-01-01T10:00:00Z"
  },
  {
    "_id": "807f1f77bcf86cd799439302",
    "class_id": "707f1f77bcf86cd799439201",
    "subject_id": "607f1f77bcf86cd799439102",
    "teacher_id": "507f1f77bcf86cd799439012",
    "day_of_week": "Tuesday",
    "start_time": "10:00",
    "end_time": "11:30",
    "room": "A101",
    "week": 1,
    "semester": 1,
    "year": 2025,
    "status": "active",
    "created_at": "2025-01-01T10:00:00Z",
    "updated_at": "2025-01-01T10:00:00Z"
  },
  {
    "_id": "807f1f77bcf86cd799439303",
    "class_id": "707f1f77bcf86cd799439202",
    "subject_id": "607f1f77bcf86cd799439103",
    "teacher_id": "507f1f77bcf86cd799439013",
    "day_of_week": "Wednesday",
    "start_time": "08:00",
    "end_time": "09:30",
    "room": "A102",
    "week": 1,
    "semester": 1,
    "year": 2025,
    "status": "active",
    "created_at": "2025-01-01T10:00:00Z",
    "updated_at": "2025-01-01T10:00:00Z"
  }
]
```

---

## Hướng Dẫn Import

### Step 1: Chuẩn Bị Dữ Liệu
Copy dữ liệu JSON từ phần tương ứng ở trên.

### Step 2: Tạo File JSON
```bash
# Tạo file sample-teachers.json
# Tạo file sample-subjects.json
# Tạo file sample-classes.json
# Tạo file sample-schedules.json
```

### Step 3: Import vào MongoDB

**Cách 1: Dùng mongoimport**
```bash
mongoimport --uri "mongodb+srv://username:password@cluster.mongodb.net/education-management" \
  --collection teachers --type json --file sample-teachers.json

mongoimport --uri "mongodb+srv://username:password@cluster.mongodb.net/education-management" \
  --collection subjects --type json --file sample-subjects.json

mongoimport --uri "mongodb+srv://username:password@cluster.mongodb.net/education-management" \
  --collection classes --type json --file sample-classes.json

mongoimport --uri "mongodb+srv://username:password@cluster.mongodb.net/education-management" \
  --collection schedules --type json --file sample-schedules.json
```

**Cách 2: Dùng Mongoose Seed Script (Khuyến nghị)**
```bash
cd Backend
npm run seed
```

---

## Ghi Chú

- Tất cả `_id` đều là ObjectId hợp lệ
- `created_at` và `updated_at` có định dạng ISO 8601
- `teachers` trong Subject là array của teacher _id
- `class_id`, `subject_id`, `teacher_id` trong Schedule là references
- Có thể thay đổi dữ liệu theo nhu cầu của bạn

